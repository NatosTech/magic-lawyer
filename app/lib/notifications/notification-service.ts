import { PrismaClient } from "@/app/generated/prisma";
import { publishRealtimeEvent } from "@/app/lib/realtime/publisher";
import { getNotificationQueue } from "./notification-queue";

const prisma = new PrismaClient();

export type NotificationUrgency = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
export type NotificationChannel = "REALTIME" | "EMAIL" | "SMS" | "PUSH";

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
   */
  static async publishNotification(event: NotificationEvent): Promise<void> {
    try {
      const queue = getNotificationQueue();

      // Adiciona job à fila para processamento assíncrono
      await queue.addNotificationJob({
        type: event.type,
        tenantId: event.tenantId,
        userId: event.userId,
        payload: event.payload,
        urgency: event.urgency || "MEDIUM",
        channels: event.channels || ["REALTIME"],
      });

      console.log(`[NotificationService] Job de notificação ${event.type} adicionado à fila para usuário ${event.userId}`);
    } catch (error) {
      console.error(`[NotificationService] Erro ao adicionar job à fila:`, error);
      throw error;
    }
  }

  /**
   * Processa notificação de forma síncrona (usado pelo worker)
   */
  static async processNotificationSync(event: NotificationEvent): Promise<void> {
    try {
      // 1. Verificar se o usuário tem permissão para receber esta notificação
      const hasPermission = await this.checkUserPermission(event);
      if (!hasPermission) {
        console.log(`[NotificationService] Usuário ${event.userId} não tem permissão para receber ${event.type}`);
        return;
      }

      // 2. Verificar preferências do usuário
      const preferences = await this.getUserPreferences(event.tenantId, event.userId, event.type);
      if (!preferences.enabled) {
        console.log(`[NotificationService] Notificação ${event.type} desabilitada para usuário ${event.userId}`);
        return;
      }

      // 3. Gerar template da notificação
      const template = await this.generateTemplate(event);
      if (!template) {
        console.error(`[NotificationService] Template não encontrado para ${event.type}`);
        return;
      }

      // 4. Substituir variáveis no template
      const { title, message } = this.replaceVariables(template, event.payload);

      // 5. Salvar notificação no banco
      const notification = await prisma.notification.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId,
          type: event.type,
          title,
          message,
          payload: event.payload,
          urgency: event.urgency || preferences.urgency,
          channels: preferences.channels,
          expiresAt: this.calculateExpiration(event.urgency || preferences.urgency),
        },
      });

      // 6. Enviar via canais configurados
      await this.deliverNotification(notification, preferences.channels);

      console.log(`[NotificationService] Notificação ${notification.id} processada para usuário ${event.userId}`);
    } catch (error) {
      console.error(`[NotificationService] Erro ao processar notificação:`, error);
      throw error;
    }
  }

  /**
   * Publica notificação para múltiplos usuários
   */
  static async publishToMultipleUsers(eventType: string, tenantId: string, userIds: string[], payload: Record<string, any>, urgency: NotificationUrgency = "MEDIUM"): Promise<void> {
    const promises = userIds.map((userId) =>
      this.publishNotification({
        type: eventType,
        tenantId,
        userId,
        payload,
        urgency,
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Publica notificação para todos os usuários de um tenant com um role específico
   */
  static async publishToRole(eventType: string, tenantId: string, role: string, payload: Record<string, any>, urgency: NotificationUrgency = "MEDIUM"): Promise<void> {
    const users = await prisma.usuario.findMany({
      where: {
        tenantId,
        role: role as any,
        active: true,
      },
      select: { id: true },
    });

    const userIds = users.map((user) => user.id);
    await this.publishToMultipleUsers(eventType, tenantId, userIds, payload, urgency);
  }

  /**
   * Verifica se o usuário tem permissão para receber a notificação
   */
  private static async checkUserPermission(event: NotificationEvent): Promise<boolean> {
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
    eventType: string
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

    // Usar preferências padrão baseadas no role
    const user = await prisma.usuario.findFirst({
      where: { id: userId, tenantId },
      select: { role: true },
    });

    const defaultPreferences = this.getDefaultPreferencesByRole(user?.role || "SECRETARIA");
    return defaultPreferences[eventType] || defaultPreferences.default;
  }

  /**
   * Gera template para a notificação
   */
  private static async generateTemplate(event: NotificationEvent): Promise<NotificationTemplate | null> {
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
  private static replaceVariables(template: NotificationTemplate, payload: Record<string, any>): { title: string; message: string } {
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
   * Calcula data de expiração baseada na urgência
   */
  private static calculateExpiration(urgency: NotificationUrgency): Date {
    const now = new Date();
    const days = {
      CRITICAL: 7,
      HIGH: 3,
      MEDIUM: 1,
      INFO: 1,
    };

    return new Date(now.getTime() + days[urgency] * 24 * 60 * 60 * 1000);
  }

  /**
   * Entrega a notificação pelos canais configurados
   */
  private static async deliverNotification(notification: any, channels: NotificationChannel[]): Promise<void> {
    const promises = channels.map((channel) => {
      switch (channel) {
        case "REALTIME":
          return this.deliverRealtime(notification);
        case "EMAIL":
          return this.deliverEmail(notification);
        case "SMS":
          return this.deliverSMS(notification);
        case "PUSH":
          return this.deliverPush(notification);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Entrega via tempo real (Ably)
   */
  private static async deliverRealtime(notification: any): Promise<void> {
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
  }

  /**
   * Entrega via email
   */
  private static async deliverEmail(notification: any): Promise<void> {
    // TODO: Implementar envio de email
    console.log(`[NotificationService] Email enviado para notificação ${notification.id}`);
  }

  /**
   * Entrega via SMS
   */
  private static async deliverSMS(notification: any): Promise<void> {
    // TODO: Implementar envio de SMS
    console.log(`[NotificationService] SMS enviado para notificação ${notification.id}`);
  }

  /**
   * Entrega via push mobile
   */
  private static async deliverPush(notification: any): Promise<void> {
    // TODO: Implementar push mobile
    console.log(`[NotificationService] Push mobile enviado para notificação ${notification.id}`);
  }

  /**
   * Preferências padrão por role
   */
  private static getDefaultPreferencesByRole(role: string): Record<string, any> {
    const preferences = {
      SUPER_ADMIN: {
        default: { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "processo.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "cliente.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "financeiro.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "equipe.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
      },
      ADMIN: {
        default: { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "processo.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "cliente.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "financeiro.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "equipe.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
      },
      ADVOGADO: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "cliente.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "agenda.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "prazo.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "CRITICAL" },
      },
      SECRETARIA: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "cliente.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "agenda.*": { enabled: true, channels: ["REALTIME"], urgency: "HIGH" },
        "equipe.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
      },
      FINANCEIRO: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "financeiro.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "contrato.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "HIGH" },
        "pagamento.*": { enabled: true, channels: ["REALTIME", "EMAIL"], urgency: "CRITICAL" },
      },
      CLIENTE: {
        default: { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "processo.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "contrato.*": { enabled: true, channels: ["REALTIME"], urgency: "MEDIUM" },
        "pagamento.*": { enabled: true, channels: ["REALTIME"], urgency: "HIGH" },
      },
    };

    return preferences[role as keyof typeof preferences] || preferences.SECRETARIA;
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
        message: "Processo {numero} foi atualizado",
      },
      "processo.status_changed": {
        title: "Status do processo alterado",
        message: "Processo {numero} mudou para {status}",
      },
      "prazo.expiring_7d": {
        title: "Prazo próximo do vencimento",
        message: "Prazo do processo {numero} vence em 7 dias",
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
    };
  }
}
