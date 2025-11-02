"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const email_channel_1 = require("./channels/email-channel");
const notification_queue_1 = require("./notification-queue");
const notification_factory_1 = require("./domain/notification-factory");
const notification_policy_1 = require("./domain/notification-policy");
const prisma_1 = __importDefault(require("@/app/lib/prisma"));
const publisher_1 = require("@/app/lib/realtime/publisher");
/**
 * Serviço principal de notificações
 */
class NotificationService {
    /**
     * Publica uma notificação para um usuário (assíncrono via fila)
     * Usa NotificationFactory para criar e validar o evento
     */
    static async publishNotification(event) {
        try {
            // Usar Factory para criar/validar evento (aplica validações e sanitizações)
            const validatedEvent = notification_factory_1.NotificationFactory.createEvent(event.type, event.tenantId, event.userId, event.payload, {
                urgency: event.urgency,
                channels: event.channels,
            });
            // Deduplicação simples: chave única por (tenantId, userId, type, payloadHash) com TTL de 5 minutos
            const { getRedisInstance } = await Promise.resolve().then(() => __importStar(require("./redis-singleton")));
            const redis = getRedisInstance();
            const payloadHash = crypto_1.default
                .createHash("sha256")
                .update(JSON.stringify(validatedEvent.payload))
                .digest("hex");
            const dedupKey = `notif:d:${validatedEvent.tenantId}:${validatedEvent.userId}:${validatedEvent.type}:${payloadHash}`;
            // SET NX PX=300000 => só seta se não existir (evita duplicatas)
            const setResult = await redis.set(dedupKey, "1", "PX", 5 * 60 * 1000, "NX");
            if (setResult !== "OK") {
                console.log(`[NotificationService] 🔁 Evento duplicado ignorado (${validatedEvent.type}) para usuário ${validatedEvent.userId}`);
                return;
            }
            // Determinar prioridade na fila baseada na urgência
            const priority = notification_policy_1.NotificationPolicy.getQueuePriority(validatedEvent.urgency || "MEDIUM");
            const jobPayload = {
                type: validatedEvent.type,
                tenantId: validatedEvent.tenantId,
                userId: validatedEvent.userId,
                payload: validatedEvent.payload,
                urgency: validatedEvent.urgency || "MEDIUM",
                channels: validatedEvent.channels || ["REALTIME"],
            };
            try {
                const queue = (0, notification_queue_1.getNotificationQueue)();
                await queue.addNotificationJob(jobPayload, priority);
            }
            catch (queueError) {
                console.error("[NotificationService] Falha ao enfileirar notificação, processando de forma síncrona:", queueError);
                await this.processNotificationSync(jobPayload);
            }
        }
        catch (error) {
            console.error(`[NotificationService] Erro ao adicionar job à fila:`, error);
            throw error;
        }
    }
    /**
     * Processa notificação de forma síncrona (usado pelo worker)
     */
    static async processNotificationSync(event) {
        try {
            console.log(`[NotificationService] 📱 Processando notificação ${event.type} para usuário ${event.userId}`);
            // 1. Verificar se o usuário tem permissão para receber esta notificação
            const hasPermission = await this.checkUserPermission(event);
            if (!hasPermission) {
                console.log(`[NotificationService] Usuário ${event.userId} não tem permissão para receber ${event.type}`);
                return;
            }
            // 2. Verificar preferências do usuário (usando Policy para validação)
            const preferences = await this.getUserPreferences(event.tenantId, event.userId, event.type);
            // Validar se evento pode ser desabilitado (Policy)
            const canDisable = notification_policy_1.NotificationPolicy.canDisableEvent(event.type);
            if (!preferences.enabled && canDisable) {
                console.log(`[NotificationService] Notificação ${event.type} desabilitada para usuário ${event.userId}`);
                return;
            }
            // Eventos críticos não podem ser desabilitados (forçar enabled)
            if (!preferences.enabled && !canDisable) {
                console.log(`[NotificationService] Evento crítico ${event.type} não pode ser desabilitado, forçando ativação`);
                preferences.enabled = true;
            }
            // 3. Gerar template da notificação
            const template = (await this.generateTemplate(event)) ??
                this.buildFallbackTemplate(event);
            // 4. Substituir variáveis no template
            const { title, message } = this.replaceVariables(template, event.payload);
            // 5. Determinar canais a usar
            // - Se evento CRITICAL: sempre REALTIME + EMAIL (ignora preferências)
            // - Se evento especificou canais explicitamente: usa os canais do evento (override)
            // - Caso contrário: respeita preferências do usuário
            let channelsToUse;
            if (event.urgency === "CRITICAL") {
                // Eventos críticos sempre vão por REALTIME + EMAIL
                channelsToUse = ["REALTIME", "EMAIL"];
            }
            else if (event.channels && event.channels.length > 0) {
                // Se o evento especificou canais explicitamente (override), usa eles
                // Mas filtra para manter apenas canais habilitados nas preferências (exceto CRITICAL)
                const enabledChannels = preferences.channels;
                channelsToUse = event.channels.filter((channel) => enabledChannels.includes(channel));
                // Se após filtrar não sobrar nenhum, usa as preferências
                if (channelsToUse.length === 0) {
                    channelsToUse = preferences.channels;
                }
            }
            else {
                // Caso padrão: respeita preferências do usuário
                channelsToUse = preferences.channels;
            }
            // 6. Salvar notificação no banco
            const notification = await prisma_1.default.notification.create({
                data: {
                    tenantId: event.tenantId,
                    userId: event.userId,
                    type: event.type,
                    title,
                    message,
                    payload: event.payload,
                    urgency: event.urgency || preferences.urgency,
                    channels: channelsToUse,
                    expiresAt: this.calculateExpiration(event.urgency || preferences.urgency),
                },
            });
            // 7. Enviar via canais configurados
            await this.deliverNotification(notification, channelsToUse);
            console.log(`[NotificationService] Notificação ${notification.id} processada para usuário ${event.userId}`);
        }
        catch (error) {
            console.error(`[NotificationService] Erro ao processar notificação:`, error);
            throw error;
        }
    }
    /**
     * Publica notificação para múltiplos usuários
     */
    static async publishToMultipleUsers(eventType, tenantId, userIds, payload, urgency = "MEDIUM") {
        const promises = userIds.map((userId) => this.publishNotification({
            type: eventType,
            tenantId,
            userId,
            payload,
            urgency,
        }));
        await Promise.allSettled(promises);
    }
    /**
     * Publica notificação para todos os usuários de um tenant com um role específico
     */
    static async publishToRole(eventType, tenantId, role, payload, urgency = "MEDIUM") {
        const users = await prisma_1.default.usuario.findMany({
            where: {
                tenantId,
                role: role,
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
    static async checkUserPermission(event) {
        // Verificar se o usuário existe e está ativo
        const user = await prisma_1.default.usuario.findFirst({
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
    static async getUserPreferences(tenantId, userId, eventType) {
        // Buscar preferência específica
        const preference = await prisma_1.default.notificationPreference.findUnique({
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
                channels: preference.channels,
                urgency: preference.urgency,
            };
        }
        // Tentar buscar preferências wildcard (ex: processo.*) ou default
        const wildcardCandidates = this.buildWildcardEventTypes(eventType);
        if (wildcardCandidates.length > 0) {
            const wildcardPreferences = await prisma_1.default.notificationPreference.findMany({
                where: {
                    tenantId,
                    userId,
                    eventType: { in: wildcardCandidates },
                },
            });
            const matchedPreference = this.selectPreferenceFromCandidates(wildcardCandidates, wildcardPreferences.map((pref) => ({
                eventType: pref.eventType,
                enabled: pref.enabled,
                channels: pref.channels,
                urgency: pref.urgency,
            })));
            if (matchedPreference) {
                return matchedPreference;
            }
        }
        // Usar preferências padrão baseadas no role
        const user = await prisma_1.default.usuario.findFirst({
            where: { id: userId, tenantId },
            select: { role: true },
        });
        return this.resolvePreferenceFromRoleDefaults(this.getDefaultPreferencesByRole(user?.role || "SECRETARIA"), eventType, wildcardCandidates);
    }
    /**
     * Gera template para a notificação
     */
    static async generateTemplate(event) {
        // Buscar template específico do tenant
        const template = await prisma_1.default.notificationTemplate.findUnique({
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
                variables: template.variables,
            };
        }
        // Usar template padrão
        const defaultTemplates = this.getDefaultTemplates();
        return defaultTemplates[event.type] || null;
    }
    /**
     * Substitui variáveis no template
     */
    static replaceVariables(template, payload) {
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
    static buildFallbackTemplate(event) {
        const prettyType = event.type
            .split(".")
            .map((segment) => segment.replace(/_/g, " "))
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" - ");
        const defaultTitle = event.payload.title ||
            event.payload.titulo ||
            `Atualização: ${prettyType}`;
        const defaultMessage = event.payload.message ||
            event.payload.mensagem ||
            `Você recebeu uma nova atualização (${prettyType}).`;
        return {
            title: defaultTitle,
            message: defaultMessage,
        };
    }
    /**
     * Calcula data de expiração baseada na urgência
     */
    static calculateExpiration(urgency) {
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
    static async deliverNotification(notification, channels) {
        console.log(`[NotificationService] 📱 Processando canais: ${channels.join(",")}`);
        await Promise.allSettled(channels.map((channel) => this.processChannelDelivery(notification, channel)));
    }
    static getProviderForChannel(channel) {
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
    static async processChannelDelivery(notification, channel) {
        console.log(`[NotificationService] 🔄 Processando canal: ${channel}`);
        const provider = this.getProviderForChannel(channel);
        const delivery = await prisma_1.default.notificationDelivery.create({
            data: {
                notificationId: notification.id,
                channel,
                provider,
                status: "PENDING",
            },
        });
        try {
            let result;
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
                await prisma_1.default.notificationDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: "SENT",
                        providerMessageId: result.messageId,
                        metadata: result.metadata,
                    },
                });
            }
            else {
                await prisma_1.default.notificationDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: "FAILED",
                        providerMessageId: result.messageId,
                        errorMessage: result.error?.slice(0, 500),
                        metadata: result.metadata,
                    },
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            await prisma_1.default.notificationDelivery.update({
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
    static async deliverRealtime(notification) {
        await (0, publisher_1.publishRealtimeEvent)("notification.new", {
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
    static async deliverEmail(notification) {
        try {
            // Buscar dados do usuário para obter email e nome
            const user = await prisma_1.default.usuario.findUnique({
                where: { id: notification.userId },
                select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            });
            if (!user || !user.email) {
                console.warn(`[NotificationService] Usuário ${notification.userId} não tem email configurado`);
                return { success: false, error: "Usuário sem email configurado" };
            }
            // Validar email
            if (!email_channel_1.EmailChannel.isValidEmail(user.email)) {
                console.warn(`[NotificationService] Email inválido para usuário ${notification.userId}: ${user.email}`);
                return { success: false, error: `Email inválido: ${user.email}` };
            }
            const userName = `${user.firstName} ${user.lastName}`.trim();
            // Enviar email
            const result = await email_channel_1.EmailChannel.send({
                type: notification.type,
                tenantId: notification.tenantId,
                userId: notification.userId,
                payload: notification.payload,
                urgency: notification.urgency,
                channels: notification.channels,
            }, user.email, userName, notification.title, notification.message);
            if (result.success) {
                console.log(`[NotificationService] ✅ Email enviado com sucesso para ${user.email} (notificação ${notification.id})`);
                return { success: true, messageId: result.messageId };
            }
            console.error(`[NotificationService] ❌ Falha ao enviar email para ${user.email}: ${result.error}`);
            return {
                success: false,
                error: result.error,
                messageId: result.messageId,
            };
        }
        catch (error) {
            console.error(`[NotificationService] Erro ao processar envio de email:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            };
        }
    }
    /**
     * Entrega via push mobile
     */
    static async deliverPush(notification) {
        // TODO: Implementar push mobile real
        console.log(`[NotificationService] Push mobile enviado para notificação ${notification.id}`);
        return { success: true };
    }
    /**
     * Preferências padrão por role
     */
    static getDefaultPreferencesByRole(role) {
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
        return (preferences[role] || preferences.SECRETARIA);
    }
    /**
     * Templates padrão para cada tipo de evento
     */
    static getDefaultTemplates() {
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
                message: "Processo {numero} mudou de {oldStatusLabel} para {newStatusLabel}",
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
                message: 'Um novo andamento "{titulo}" foi adicionado ao processo {processoNumero}.',
            },
            "andamento.updated": {
                title: "Andamento atualizado",
                message: 'O andamento "{titulo}" do processo {processoNumero} foi atualizado: {changesSummary}',
            },
        };
    }
    static buildWildcardEventTypes(eventType) {
        const wildcards = [];
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
    static selectPreferenceFromCandidates(orderedCandidates, preferences) {
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
    static resolvePreferenceFromRoleDefaults(defaults, eventType, wildcardCandidates) {
        if (defaults[eventType]) {
            return defaults[eventType];
        }
        const match = this.selectPreferenceFromCandidates(wildcardCandidates, Object.entries(defaults).map(([key, value]) => ({
            eventType: key,
            ...value,
        })));
        if (match) {
            return match;
        }
        return (defaults.default || {
            enabled: true,
            channels: ["REALTIME"],
            urgency: "MEDIUM",
        });
    }
}
exports.NotificationService = NotificationService;
