"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailChannel = void 0;
const prisma_1 = __importDefault(require("@/app/lib/prisma"));
const email_service_1 = require("@/app/lib/email-service");
/**
 * Canal de EMAIL para notificações
 * Integra com o serviço de email existente (Resend)
 */
class EmailChannel {
    /**
     * Envia notificação por email
     */
    static async send(event, userEmail, userName, title, message) {
        try {
            const tenant = event.tenantId
                ? await prisma_1.default.tenant.findUnique({
                    where: { id: event.tenantId },
                    select: {
                        slug: true,
                        domain: true,
                        branding: { select: { customDomainText: true } },
                    },
                })
                : null;
            const tenantBaseUrl = this.resolveTenantBaseUrl(tenant);
            // Gerar link de ação baseado no tipo de evento
            const linkAcao = tenantBaseUrl
                ? this.generateActionLink(event, tenantBaseUrl)
                : undefined;
            const textoAcao = tenantBaseUrl && linkAcao ? this.generateActionText(event) : undefined;
            const enrichedMessage = this.enrichMessage(message, event);
            // Enviar email usando o novo serviço per-tenant
            const result = await email_service_1.emailService.sendNotificacaoAdvogado(event.tenantId, {
                nome: userName,
                email: userEmail,
                tipo: event.type,
                titulo: title,
                mensagem: enrichedMessage,
                linkAcao,
                textoAcao,
            });
            if (result.success) {
                console.log(`[EmailChannel] Email enviado com sucesso para ${userEmail}`);
                return { success: true, messageId: result.messageId };
            }
            console.error(`[EmailChannel] Falha ao enviar email para ${userEmail}: ${result.error}`);
            return { success: false, error: result.error || "Falha ao enviar email" };
        }
        catch (error) {
            console.error("[EmailChannel] Erro ao enviar email:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            };
        }
    }
    /**
     * Gera link de ação baseado no tipo de evento
     */
    static generateActionLink(event, baseUrl) {
        if (!baseUrl) {
            return undefined;
        }
        const normalizedBase = baseUrl.replace(/\/+$/, "");
        switch (event.type) {
            case "processo.created":
                return event.payload.processoId
                    ? `${normalizedBase}/processos/${event.payload.processoId}`
                    : undefined;
            case "prazo.expiring":
            case "prazo.expiring_7d":
            case "prazo.expiring_3d":
            case "prazo.expiring_1d":
                return event.payload.processoId
                    ? `${normalizedBase}/processos/${event.payload.processoId}`
                    : `${normalizedBase}/andamentos`;
            case "documento.uploaded":
                return event.payload.processoId
                    ? `${normalizedBase}/processos/${event.payload.processoId}`
                    : undefined;
            case "pagamento.paid":
            case "pagamento.pending":
            case "pagamento.overdue":
                return `${normalizedBase}/financeiro`;
            case "evento.created":
            case "evento.updated":
            case "evento.confirmation_updated":
                return event.payload.eventoId
                    ? `${normalizedBase}/agenda/${event.payload.eventoId}`
                    : `${normalizedBase}/agenda`;
            case "andamento.created":
            case "andamento.updated":
                return event.payload.processoId
                    ? `${normalizedBase}/processos/${event.payload.processoId}`
                    : `${normalizedBase}/andamentos`;
            default:
                return `${normalizedBase}/dashboard`;
        }
    }
    /**
     * Gera texto do botão de ação baseado no tipo de evento
     */
    static generateActionText(event) {
        switch (event.type) {
            case "processo.created":
                return "Ver Processo";
            case "prazo.expiring":
            case "prazo.expiring_7d":
            case "prazo.expiring_3d":
            case "prazo.expiring_1d":
                return "Ver Prazos";
            case "documento.uploaded":
                return "Ver Documento";
            case "pagamento.paid":
            case "pagamento.pending":
            case "pagamento.overdue":
                return "Ver Financeiro";
            case "evento.created":
            case "evento.updated":
            case "evento.confirmation_updated":
                return "Ver Evento";
            case "andamento.created":
            case "andamento.updated":
                return "Ver andamento";
            default:
                return "Acessar Plataforma";
        }
    }
    /**
     * Valida se o email é válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static resolveTenantBaseUrl(tenant) {
        if (!tenant) {
            return undefined;
        }
        const defaultBase = process.env.NEXTAUTH_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://magiclawyer.vercel.app";
        const getProtocol = (raw) => {
            try {
                const url = new URL(raw.startsWith("http://") || raw.startsWith("https://")
                    ? raw
                    : `https://${raw}`);
                return url.protocol || "https:";
            }
            catch {
                return "https:";
            }
        };
        const ensureProtocol = (value, protocol) => {
            if (/^https?:\/\//i.test(value)) {
                return value;
            }
            return `${protocol}//${value}`;
        };
        const candidateDomain = tenant.branding?.customDomainText?.trim() || tenant.domain?.trim();
        if (candidateDomain) {
            return ensureProtocol(candidateDomain, getProtocol(defaultBase));
        }
        if (!tenant.slug) {
            return undefined;
        }
        try {
            const base = new URL(defaultBase.startsWith("http://") || defaultBase.startsWith("https://")
                ? defaultBase
                : `https://${defaultBase}`);
            const host = base.host;
            const protocol = base.protocol || "https:";
            return `${protocol}//${tenant.slug}.${host}`;
        }
        catch {
            return undefined;
        }
    }
    static enrichMessage(originalMessage, event) {
        const details = [];
        if (event.type === "andamento.created" ||
            event.type === "andamento.updated") {
            const payload = event.payload || {};
            if (payload.processoNumero) {
                details.push(`Processo: ${payload.processoNumero}`);
            }
            if (payload.titulo) {
                details.push(`Andamento: ${payload.titulo}`);
            }
            if (payload.tipo) {
                details.push(`Tipo: ${payload.tipo}`);
            }
            const formattedDate = this.formatDate(payload.dataMovimentacao);
            if (formattedDate) {
                details.push(`Data/Hora: ${formattedDate}`);
            }
            if (payload.descricao) {
                details.push(`Descrição: ${payload.descricao}`);
            }
        }
        if (!details.length) {
            return originalMessage;
        }
        return `${originalMessage}\n\n${details.join("\n")}`;
    }
    static formatDate(value) {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(date);
    }
}
exports.EmailChannel = EmailChannel;
