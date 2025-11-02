import type { NotificationJobData } from "./notification-worker";

import crypto from "crypto";

import { EmailChannel } from "./channels/email-channel";
import { getNotificationQueue } from "./notification-queue";
import { NotificationFactory } from "./domain/notification-factory";
import { NotificationPolicy } from "./domain/notification-policy";
import { getRedisInstance } from "./redis-singleton";

import prisma from "@/app/lib/prisma";
import { publishRealtimeEvent } from "@/app/lib/realtime/publisher";

export type NotificationUrgency = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
export type NotificationChannel = "REALTIME" | "EMAIL" | "PUSH";

export interface NotificationEvent {
  type: string;
  tenantId: string;
  userId: string;
  payload: Record<string, any>;
  urgency?: NotificationUrgency;
  channels?: NotificationChannel[];
}

export interface NotificationTemplate {
  title: string;
  message: string;
  variables?: Record<string, any>;
}

/**
 * Serviço principal de notificações
 */

export class NotificationService {
  /**
   * Publica uma notificação para um usuário (assíncrono via fila)
   * Usa NotificationFactory para criar e validar o evento
   */
  static async publishNotification(event: NotificationEvent): Promise<void> {
    try {
      // Usar Factory para criar/validar evento (aplica validações e sanitizações)
      const validatedEvent = NotificationFactory.createEvent(
        event.type,
        event.tenantId,
        event.userId,
        event.payload,
        {
          urgency: event.urgency,
          channels: event.channels,
        },
      );

      // Deduplicação simples: chave única por (tenantId, userId, type, payloadHash) com TTL de 5 minutos
      const redis = getRedisInstance();

      const payloadHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(validatedEvent.payload))
        .digest("hex");
      const dedupKey = `notif:d:${validatedEvent.tenantId}:${validatedEvent.userId}:${validatedEvent.type}:${payloadHash}`;

      // SET NX PX=300000 => só seta se não existir (evita duplicatas)
      const setResult = await redis.set(
        dedupKey,
        "1",
        "PX",
        5 * 60 * 1000,
        "NX",
      );

      if (setResult !== "OK") {
        console.log(
          `[NotificationService] 🔁 Evento duplicado ignorado (${validatedEvent.type}) para usuário ${validatedEvent.userId}`,
        );

        return;
      }

      // Determinar prioridade na fila baseada na urgência
      const priority = NotificationPolicy.getQueuePriority(
        validatedEvent.urgency || "MEDIUM",
      );

      const jobPayload: NotificationJobData = {
        type: validatedEvent.type,
        tenantId: validatedEvent.tenantId,
        userId: validatedEvent.userId,
        payload: validatedEvent.payload,
        urgency: validatedEvent.urgency || "MEDIUM",
        channels: validatedEvent.channels || ["REALTIME"],
      };

      try {
        const queue = getNotificationQueue();

        await queue.addNotificationJob(jobPayload, priority);
      } catch (queueError) {
        console.error(
          "[NotificationService] Falha ao enfileirar notificação, processando de forma síncrona:",
          queueError,
        );
        await this.processNotificationSync(jobPayload);
      }
    } catch (error) {
      console.error(
        `[NotificationService] Erro ao adicionar job à fila:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Processa notificação de forma síncrona (usado pelo worker)
   */
  static async processNotificationSync(
    event: NotificationEvent,
  ): Promise<void> {
    try {
      console.log(
        `[NotificationService] 📱 Processando notificação ${event.type} para usuário ${event.userId}`,
      );

      // 1. Verificar se o usuário tem permissão para receber esta notificação
      const hasPermission = await this.checkUserPermission(event);

      if (!hasPermission) {
        console.log(
          `[NotificationService] Usuário ${event.userId} não tem permissão para receber ${event.type}`,
        );

        return;
      }

      // 2. Verificar preferências do usuário (usando Policy para validação)
      const preferences = await this.getUserPreferences(
        event.tenantId,
        event.userId,
        event.type,
      );

      // Validar se evento pode ser desabilitado (Policy)
      const canDisable = NotificationPolicy.canDisableEvent(event.type);

      if (!preferences.enabled && canDisable) {
        console.log(
          `[NotificationService] Notificação ${event.type} desabilitada para usuário ${event.userId}`,
        );

        return;
      }

      // Eventos críticos não podem ser desabilitados (forçar enabled)
      if (!preferences.enabled && !canDisable) {
        console.log(
          `[NotificationService] Evento crítico ${event.type} não pode ser desabilitado, forçando ativação`,
        );
        preferences.enabled = true;
      }

      // 3. Gerar template da notificação
      const template =
        (await this.generateTemplate(event)) ??
        this.buildFallbackTemplate(event);

      // 4. Substituir variáveis no template
      const { title, message } = this.replaceVariables(template, event.payload);

      // 5. Determinar canais a usar
      // - Se evento CRITICAL: sempre REALTIME + EMAIL (ignora preferências)
      // - Se evento especificou canais explicitamente: usa os canais do evento (override)
      // - Caso contrário: respeita preferências do usuário
      let channelsToUse: NotificationChannel[];

      if (event.urgency === "CRITICAL") {
        // Eventos críticos sempre vão por REALTIME + EMAIL
        channelsToUse = ["REALTIME", "EMAIL"];
      } else if (event.channels && event.channels.length > 0) {
        // Se o evento especificou canais explicitamente (override), usa eles
        // Mas filtra para manter apenas canais habilitados nas preferências (exceto CRITICAL)
        const enabledChannels = preferences.channels;

        channelsToUse = event.channels.filter((channel) =>
          enabledChannels.includes(channel),
        );

        // Se após filtrar não sobrar nenhum, usa as preferências
        if (channelsToUse.length === 0) {
          channelsToUse = preferences.channels;
        }
      } else {
        // Caso padrão: respeita preferências do usuário
        channelsToUse = preferences.channels;
      }

      // 6. Salvar notificação no banco
      const notification = await prisma.notification.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId,
          type: event.type,
          title,
          message,
          payload: event.payload,
          urgency: event.urgency || preferences.urgency,
          channels: channelsToUse,
          expiresAt: this.calculateExpiration(
            event.urgency || preferences.urgency,
          ),
        },
      });

      // 7. Enviar via canais configurados
      await this.deliverNotification(notification, channelsToUse);

      console.log(
        `[NotificationService] Notificação ${notification.id} processada para usuário ${event.userId}`,
      );
    } catch (error) {
      console.error(
        `[NotificationService] Erro ao processar notificação:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Publica notificação para múltiplos usuários
   */
  static async publishToMultipleUsers(
    eventType: string,
    tenantId: string,
    userIds: string[],
    payload: Record<string, any>,
    urgency: NotificationUrgency = "MEDIUM",
  ): Promise<void> {
    const promises = userIds.map((userId) =>
      this.publishNotification({
        type: eventType,
        tenantId,
        userId,
        payload,
        urgency,
      }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Publica notificação para todos os usuários de um tenant com um role específico
   */
  static async publishToRole(
    eventType: string,
    tenantId: string,
    role: string,
    payload: Record<string, any>,
    urgency: NotificationUrgency = "MEDIUM",
  ): Promise<void> {
    const users = await prisma.usuario.findMany({
      where: {
        tenantId,
        role: role as any,
        active: true,
      },
      select: { id: true },
    });

    const userIds = users.map((user) => user.id);

    await this.publishToMultipleUsers(
      eventType,
      tenantId,
      userIds,
      payload,
      urgency,
    );
  }

  /**
   * Verifica se o usuário tem permissão para receber a notificação
   */
  private static async checkUserPermission(
    event: NotificationEvent,
  ): Promise<boolean> {
    // Verificar se o usuário existe e está ativo
    const user = await prisma.usuario.findFirst({
      where: {
        id: event.userId,
        tenantId: event.tenantId,
        active: true,
      },
    });

    return !!user;
  }

  /**
   * Obtém as preferências do usuário para um tipo de evento
   */
  private static async getUserPreferences(
    tenantId: string,
    userId: string,
    eventType: string,
  ): Promise<{
    enabled: boolean;
    channels: NotificationChannel[];
    urgency: NotificationUrgency;
  }> {
    // Buscar preferência específica
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        tenantId_userId_eventType: {
          tenantId,
          userId,
          eventType,
        },
      },
    });

    if (preference) {
      return {
        enabled: preference.enabled,
        channels: preference.channels as NotificationChannel[],
        urgency: preference.urgency as NotificationUrgency,
      };
    }

    // Tentar buscar preferências wildcard (ex: processo.*) ou default
    const wildcardCandidates = this.buildWildcardEventTypes(eventType);

    if (wildcardCandidates.length > 0) {
      const wildcardPreferences = await prisma.notificationPreference.findMany({
        where: {
          tenantId,
          userId,
          eventType: { in: wildcardCandidates },
        },
      });

      const matchedPreference = this.selectPreferenceFromCandidates(
        wildcardCandidates,
        wildcardPreferences.map((pref) => ({
          eventType: pref.eventType,
          enabled: pref.enabled,
          channels: pref.channels as NotificationChannel[],
          urgency: pref.urgency as NotificationUrgency,
        })),
      );

      if (matchedPreference) {
        return matchedPreference;
      }
    }

    // Usar preferências padrão baseadas no role
    const user = await prisma.usuario.findFirst({
      where: { id: userId, tenantId },
      select: { role: true },
    });

    return this.resolvePreferenceFromRoleDefaults(
      this.getDefaultPreferencesByRole(user?.role || "SECRETARIA"),
      eventType,
      wildcardCandidates,
    );
  }

  /**
   * Gera template para a notificação
   */
  private static async generateTemplate(
    event: NotificationEvent,
  ): Promise<NotificationTemplate | null> {
    // Buscar template específico do tenant
    const template = await prisma.notificationTemplate.findUnique({
      where: {
        tenantId_eventType: {
          tenantId: event.tenantId,
          eventType: event.type,
        },
      },
    });

    if (template) {
      return {
        title: template.title,
        message: template.message,
        variables: template.variables as Record<string, any>,
      };
    }

    // Usar template padrão
    const defaultTemplates = this.getDefaultTemplates();

    return defaultTemplates[event.type] || null;
  }

  /**
   * Substitui variáveis no template
   */
  private static replaceVariables(
    template: NotificationTemplate,
    payload: Record<string, any>,
  ): { title: string; message: string } {
    let title = template.title;
    let message = template.message;

    // Substituir variáveis no formato {variavel}
    Object.entries(payload).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, "g");

      title = title.replace(regex, String(value));
      message = message.replace(regex, String(value));
    });

    return { title, message };
  }

  /**
   * Template genérico quando não existir um específico para o evento
   */
  private static buildFallbackTemplate(
    event: NotificationEvent,
  ): NotificationTemplate {
    const prettyType = event.type
      .split(".")
      .map((segment) => segment.replace(/_/g, " "))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" - ");

    const defaultTitle =
      (event.payload.title as string | undefined) ||
      (event.payload.titulo as string | undefined) ||
      `Atualização: ${prettyType}`;

    const defaultMessage =
      (event.payload.message as string | undefined) ||
      (event.payload.mensagem as string | undefined) ||
      `Você recebeu uma nova atualização (${prettyType}).`;

    return {
      title: defaultTitle,
      message: defaultMessage,
    };
  }

  /**
   * Calcula data de expiração baseada na urgência
   */
  private static calculateExpiration(urgency: NotificationUrgency): Date {
    const now = new Date();
    const days = {
      CRITICAL: 30,
      HIGH: 30,
      MEDIUM: 30,
      INFO: 30,
    };

    return new Date(now.getTime() + days[urgency] * 24 * 60 * 60 * 1000);
  }

  /**
   * Entrega a notificação pelos canais configurados
   */
  private static async deliverNotification(
    notification: any,
    channels: NotificationChannel[],
  ): Promise<void> {
    console.log(
      `[NotificationService] 📱 Processando canais: ${channels.join(",")}`,
    );

    await Promise.allSettled(
      channels.map((channel) =>
        this.processChannelDelivery(notification, channel),
      ),
    );
  }

  private static getProviderForChannel(channel: NotificationChannel): string {
    switch (channel) {
      case "EMAIL":
        return "SMTP";
      case "PUSH":
        return "PUSH_GATEWAY";
      case "REALTIME":
      default:
        return "ABLY";
    }
  }

  private static async processChannelDelivery(
    notification: any,
    channel: NotificationChannel,
  ): Promise<void> {
    console.log(`[NotificationService] 🔄 Processando canal: ${channel}`);

    const provider = this.getProviderForChannel(channel);
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel,
        provider,
        status: "PENDING",
      },
    });

    try {
      let result:
        | { success: true; messageId?: string; metadata?: Record<string, any> }
        | {
            success: false;
            error?: string;
            messageId?: string;
            metadata?: Record<string, any>;
          };

      switch (channel) {
        case "REALTIME":
          result = await this.deliverRealtime(notification);
          break;
        case "EMAIL":
          result = await this.deliverEmail(notification);
          break;
        case "PUSH":
          result = await this.deliverPush(notification);
          break;
        default:
          result = { success: false, error: `Canal ${channel} não suportado` };
          break;
      }

      if (result.success) {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SENT",
            providerMessageId: result.messageId,
            metadata: result.metadata,
          },
        });
      } else {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            providerMessageId: result.messageId,
            errorMessage: result.error?.slice(0, 500),
            metadata: result.metadata,
          },
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          errorMessage: message.slice(0, 500),
        },
      });

      console.error(`[NotificationService] Erro no canal ${channel}:`, error);
    }
  }

  /**
   * Entrega via tempo real (Ably)
   */
  private static async deliverRealtime(
    notification: any,
  ): Promise<{ success: boolean }> {
    await publishRealtimeEvent("notification.new", {
      tenantId: notification.tenantId,
      userId: notification.userId,
      payload: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        urgency: notification.urgency,
        payload: notification.payload,
        createdAt: notification.createdAt,
      },
    });

    return { success: true };
  }

  /**
   * Entrega via email
   */
  private static async deliverEmail(
    notification: any,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Buscar dados do usuário para obter email e nome
      const user = await prisma.usuario.findUnique({
        where: { id: notification.userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user || !user.email) {
        console.warn(
          `[NotificationService] Usuário ${notification.userId} não tem email configurado`,
        );

        return { success: false, error: "Usuário sem email configurado" };
      }

      // Validar email
      if (!EmailChannel.isValidEmail(user.email)) {
        console.warn(
          `[NotificationService] Email inválido para usuário ${notification.userId}: ${user.email}`,
        );

        return { success: false, error: `Email inválido: ${user.email}` };
      }

      const userName = `${user.firstName} ${user.lastName}`.trim();

      // Enviar email
      const result = await EmailChannel.send(
        {
          type: notification.type,
          tenantId: notification.tenantId,
          userId: notification.userId,
          payload: notification.payload,
          urgency: notification.urgency,
          channels: notification.channels,
        },
        user.email,
        userName,
        notification.title,
        notification.message,
      );

      if (result.success) {
        console.log(
          `[NotificationService] ✅ Email enviado com sucesso para ${user.email} (notificação ${notification.id})`,
        );

        return { success: true, messageId: result.messageId };
      }

      console.error(
        `[NotificationService] ❌ Falha ao enviar email para ${user.email}: ${result.error}`,
      );

      return {
        success: false,
        error: result.error,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error(
        `[NotificationService] Erro ao processar envio de email:`,
        error,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Entrega via push mobile
   */
  private static async deliverPush(
    notification: any,
  ): Promise<{ success: boolean }> {
    // TODO: Implementar push mobile real
    console.log(
      `[NotificationService] Push mobile enviado para notificação ${notification.id}`,
    );

    return { success: true };
  }

  /**
   * Preferências padrão por role
   */
  private static getDefaultPreferencesByRole(
    role: string,
  ): Record<string, any> {
    const preferences = {
      SUPER_ADMIN: {
        default: {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "processo.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "cliente.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "financeiro.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "equipe.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
      },
      ADMIN: {
        default: {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "processo.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "cliente.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "financeiro.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "equipe.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
      },
      ADVOGADO: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "cliente.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "agenda.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "prazo.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "CRITICAL",
        },
      },
      SECRETARIA: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "cliente.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "agenda.*": { enabled: true, channels: ["REALTIME"], urgency: "HIGH" },
        "equipe.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
      },
      FINANCEIRO: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "financeiro.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "contrato.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "HIGH",
        },
        "pagamento.*": {
          enabled: true,
          channels: ["REALTIME", "EMAIL"],
          urgency: "CRITICAL",
        },
      },
      CLIENTE: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "contrato.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "MEDIUM",
        },
        "pagamento.*": {
          enabled: true,
          channels: ["REALTIME"],
          urgency: "HIGH",
        },
      },
    };

    return (
      preferences[role as keyof typeof preferences] || preferences.SECRETARIA
    );
  }

  /**
   * Templates padrão para cada tipo de evento
   */
  private static getDefaultTemplates(): Record<string, NotificationTemplate> {
    return {
      "processo.created": {
        title: "Novo processo criado",
        message: "Processo {numero} foi criado para {cliente}",
      },
      "processo.updated": {
        title: "Processo atualizado",
        message: "Processo {numero} foi atualizado: {changesSummary}",
      },
      "processo.status_changed": {
        title: "Status do processo alterado",
        message:
          "Processo {numero} mudou de {oldStatusLabel} para {newStatusLabel}",
      },
      "prazo.expiring_7d": {
        title: "Prazo próximo do vencimento",
        message: "Prazo do processo {numero} vence em 7 dias",
      },
      "prazo.expiring": {
        title: "Prazo próximo do vencimento",
        message: "Prazo do processo {numero} está próximo do vencimento",
      },
      "prazo.expiring_3d": {
        title: "Prazo próximo do vencimento",
        message: "Prazo do processo {numero} vence em 3 dias",
      },
      "prazo.expiring_1d": {
        title: "Prazo próximo do vencimento",
        message: "Prazo do processo {numero} vence em 1 dia",
      },
      "prazo.expired": {
        title: "Prazo vencido",
        message: "Prazo do processo {numero} venceu",
      },
      "cliente.created": {
        title: "Novo cliente cadastrado",
        message: "Cliente {nome} foi cadastrado",
      },
      "contrato.created": {
        title: "Novo contrato criado",
        message: "Contrato {numero} foi criado para {cliente}",
      },
      "contrato.signed": {
        title: "Contrato assinado",
        message: "Contrato {numero} foi assinado",
      },
      "pagamento.paid": {
        title: "Pagamento confirmado",
        message: "Pagamento de R$ {valor} foi confirmado",
      },
      "pagamento.overdue": {
        title: "Pagamento em atraso",
        message: "Pagamento de R$ {valor} está em atraso",
      },
      "evento.created": {
        title: "Novo evento agendado",
        message: "Evento {titulo} foi agendado para {data}",
      },
      "evento.reminder_1h": {
        title: "Lembrete de evento",
        message: "Evento {titulo} em 1 hora",
      },
      "equipe.user_invited": {
        title: "Novo convite de equipe",
        message: "Convite enviado para {email}",
      },
      "equipe.user_joined": {
        title: "Novo membro da equipe",
        message: "{nome} aceitou o convite e entrou na equipe",
      },
      "andamento.created": {
        title: "Novo andamento registrado",
        message:
          'Um novo andamento "{titulo}" foi adicionado ao processo {processoNumero}.',
      },
      "andamento.updated": {
        title: "Andamento atualizado",
        message:
          'O andamento "{titulo}" do processo {processoNumero} foi atualizado: {changesSummary}',
      },
    };
  }

  private static buildWildcardEventTypes(eventType: string): string[] {
    const wildcards: string[] = [];
    const segments = eventType.split(".");

    if (segments.length > 0 && segments[0]) {
      wildcards.push(`${segments[0]}.*`);
    }

    // Suporte a padrões mais específicos (ex: processo.status.*) se definidos
    if (segments.length > 1) {
      const partial = segments.slice(0, segments.length - 1).join(".");

      wildcards.push(`${partial}.*`);
    }

    wildcards.push("default");

    return Array.from(new Set(wildcards));
  }

  private static selectPreferenceFromCandidates(
    orderedCandidates: string[],
    preferences: {
      eventType: string;
      enabled: boolean;
      channels: NotificationChannel[];
      urgency: NotificationUrgency;
    }[],
  ): {
    enabled: boolean;
    channels: NotificationChannel[];
    urgency: NotificationUrgency;
  } | null {
    for (const candidate of orderedCandidates) {
      const match = preferences.find((pref) => pref.eventType === candidate);

      if (match) {
        return {
          enabled: match.enabled,
          channels: match.channels,
          urgency: match.urgency,
        };
      }
    }

    return null;
  }

  private static resolvePreferenceFromRoleDefaults(
    defaults: Record<
      string,
      {
        enabled: boolean;
        channels: NotificationChannel[];
        urgency: NotificationUrgency;
      }
    >,
    eventType: string,
    wildcardCandidates: string[],
  ): {
    enabled: boolean;
    channels: NotificationChannel[];
    urgency: NotificationUrgency;
  } {
    if (defaults[eventType]) {
      return defaults[eventType];
    }

    const match = this.selectPreferenceFromCandidates(
      wildcardCandidates,
      Object.entries(defaults).map(([key, value]) => ({
        eventType: key,
        ...value,
      })),
    );

    if (match) {
      return match;
    }

    return (
      defaults.default || {
        enabled: true,
        channels: ["REALTIME"],
        urgency: "MEDIUM",
      }
    );
  }
}
