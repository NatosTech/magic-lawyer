import { emailService } from "@/app/lib/email-service";
import { NotificationEvent } from "../types";

/**
 * Canal de EMAIL para notificações
 * Integra com o serviço de email existente (Resend)
 */
export class EmailChannel {
  /**
   * Envia notificação por email
   */
  static async send(
    event: NotificationEvent,
    userEmail: string,
    userName: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Verificar se RESEND_API_KEY está configurado
      if (!process.env.RESEND_API_KEY) {
        console.warn("[EmailChannel] RESEND_API_KEY não configurado");
        return {
          success: false,
          error: "RESEND_API_KEY não configurado",
        };
      }

      // Gerar link de ação baseado no tipo de evento
      const linkAcao = this.generateActionLink(event);
      const textoAcao = this.generateActionText(event);

      // Enviar email usando o serviço existente
      const result = await emailService.sendNotificacaoAdvogado({
        nome: userName,
        email: userEmail,
        tipo: event.type,
        titulo: title,
        mensagem: message,
        linkAcao,
        textoAcao,
      });

      if (result.success) {
        console.log(`[EmailChannel] Email enviado com sucesso para ${userEmail}`);
        return { success: true, messageId: result.messageId };
      }

      console.error(`[EmailChannel] Falha ao enviar email para ${userEmail}: ${result.error}`);
      return { success: false, error: result.error || "Falha ao enviar email" };
    } catch (error) {
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
  private static generateActionLink(event: NotificationEvent): string | undefined {
    const baseUrl = process.env.NEXTAUTH_URL || "https://magiclawyer.vercel.app";

    switch (event.type) {
      case "processo.created":
        return event.payload.processoId ? `${baseUrl}/processos/${event.payload.processoId}` : undefined;

      case "prazo.expiring":
      case "prazo.expiring_7d":
      case "prazo.expiring_3d":
      case "prazo.expiring_1d":
        return event.payload.processoId ? `${baseUrl}/processos/${event.payload.processoId}` : `${baseUrl}/andamentos`;

      case "documento.uploaded":
        return event.payload.processoId ? `${baseUrl}/processos/${event.payload.processoId}` : undefined;

      case "pagamento.paid":
      case "pagamento.pending":
      case "pagamento.overdue":
        return `${baseUrl}/financeiro`;

      case "evento.created":
      case "evento.updated":
      case "evento.confirmation_updated":
        return event.payload.eventoId ? `${baseUrl}/agenda/${event.payload.eventoId}` : `${baseUrl}/agenda`;

      default:
        return `${baseUrl}/dashboard`;
    }
  }

  /**
   * Gera texto do botão de ação baseado no tipo de evento
   */
  private static generateActionText(event: NotificationEvent): string | undefined {
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

      default:
        return "Acessar Plataforma";
    }
  }

  /**
   * Valida se o email é válido
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}



