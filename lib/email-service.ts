/**
 * Serviço de envio de emails
 * Suporta múltiplos provedores: Resend, SendGrid, SMTP, etc.
 */

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: "attachment" | "inline";
  cid?: string; // Content-ID para imagens inline
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface EmailProvider {
  name: string;
  sendEmail(message: EmailMessage): Promise<EmailResponse>;
  isConfigured(): boolean;
}

/**
 * Provedor Resend
 * Plano gratuito: 3.000 emails/mês, 100 emails/dia
 */
class ResendProvider implements EmailProvider {
  name = "resend";
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@magiclawyer.com";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Resend não configurado. Verifique RESEND_API_KEY",
        provider: this.name,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: Array.isArray(message.to) ? message.to : [message.to],
          cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : undefined,
          bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : undefined,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          attachments: message.attachments?.map((att) => ({
            filename: att.filename,
            content: typeof att.content === "string" ? att.content : att.content.toString("base64"),
            content_type: att.contentType,
            disposition: att.disposition,
            cid: att.cid,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Erro HTTP ${response.status}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: data.id,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: this.name,
      };
    }
  }
}

/**
 * Provedor SendGrid
 * Plano gratuito: 100 emails/dia
 */
class SendGridProvider implements EmailProvider {
  name = "sendgrid";
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@magiclawyer.com";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "SendGrid não configurado. Verifique SENDGRID_API_KEY",
        provider: this.name,
      };
    }

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: Array.isArray(message.to) ? message.to.map((email) => ({ email })) : [{ email: message.to }],
              cc: message.cc ? (Array.isArray(message.cc) ? message.cc.map((email) => ({ email })) : [{ email: message.cc }]) : undefined,
              bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.map((email) => ({ email })) : [{ email: message.bcc }]) : undefined,
            },
          ],
          from: { email: this.fromEmail },
          reply_to: message.replyTo ? { email: message.replyTo } : undefined,
          subject: message.subject,
          content: [...(message.text ? [{ type: "text/plain", value: message.text }] : []), ...(message.html ? [{ type: "text/html", value: message.html }] : [])],
          attachments: message.attachments?.map((att) => ({
            filename: att.filename,
            content: typeof att.content === "string" ? att.content : att.content.toString("base64"),
            type: att.contentType,
            disposition: att.disposition,
            content_id: att.cid,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Erro HTTP ${response.status}: ${errorText}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: response.headers.get("X-Message-Id") || undefined,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: this.name,
      };
    }
  }
}

/**
 * Provedor SMTP (usando nodemailer)
 */
class SMTPProvider implements EmailProvider {
  name = "smtp";
  private config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  private fromEmail: string;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };
    this.fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@magiclawyer.com";
  }

  isConfigured(): boolean {
    return !!(this.config.host && this.config.auth.user && this.config.auth.pass);
  }

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "SMTP não configurado. Verifique SMTP_HOST, SMTP_USER, SMTP_PASS",
        provider: this.name,
      };
    }

    try {
      // Para usar nodemailer, seria necessário instalar: npm install nodemailer @types/nodemailer
      // Por enquanto, retornamos erro indicando que precisa ser implementado
      return {
        success: false,
        error: "Provedor SMTP não implementado. Use Resend ou SendGrid.",
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: this.name,
      };
    }
  }
}

/**
 * Provedor Mock para desenvolvimento/testes
 */
class MockEmailProvider implements EmailProvider {
  name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`[MOCK Email] Enviando para ${Array.isArray(message.to) ? message.to.join(", ") : message.to}:`);
    console.log(`Assunto: ${message.subject}`);
    console.log(`Conteúdo: ${message.html || message.text}`);

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: this.name,
    };
  }
}

/**
 * Serviço principal de Email
 */
export class EmailService {
  private providers: EmailProvider[] = [];
  private defaultProvider: EmailProvider;

  constructor() {
    // Inicializa provedores disponíveis
    this.providers = [
      new ResendProvider(),
      new SendGridProvider(),
      new SMTPProvider(),
      new MockEmailProvider(), // Sempre disponível para desenvolvimento
    ];

    // Seleciona o primeiro provedor configurado
    this.defaultProvider = this.providers.find((p) => p.isConfigured()) || this.providers[this.providers.length - 1];
  }

  /**
   * Envia email usando o provedor padrão
   */
  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    return this.defaultProvider.sendEmail(message);
  }

  /**
   * Envia email usando um provedor específico
   */
  async sendEmailWithProvider(providerName: string, message: EmailMessage): Promise<EmailResponse> {
    const provider = this.providers.find((p) => p.name === providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provedor '${providerName}' não encontrado`,
      };
    }

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: `Provedor '${providerName}' não configurado`,
        provider: providerName,
      };
    }

    return provider.sendEmail(message);
  }

  /**
   * Lista provedores disponíveis e seus status
   */
  getProvidersStatus(): Array<{ name: string; configured: boolean }> {
    return this.providers.map((provider) => ({
      name: provider.name,
      configured: provider.isConfigured(),
    }));
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Instância singleton
export const emailService = new EmailService();

/**
 * Templates de email para andamentos
 */
export const emailTemplates = {
  andamento: {
    subject: (processoNumero: string, titulo: string) => `Nova movimentação no processo ${processoNumero} - ${titulo}`,

    html: (data: { titulo: string; descricao?: string; processo: { numero: string; titulo?: string }; dataMovimentacao: Date; clienteNome: string; escritorioNome: string }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Movimentação Processual</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .process-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .highlight { color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nova Movimentação Processual</h1>
          </div>
          
          <div class="content">
            <p>Olá <span class="highlight">${data.clienteNome}</span>,</p>
            
            <p>Informamos que houve uma nova movimentação no seu processo:</p>
            
            <div class="process-info">
              <p><strong>Processo:</strong> ${data.processo.numero}</p>
              ${data.processo.titulo ? `<p><strong>Título:</strong> ${data.processo.titulo}</p>` : ""}
              <p><strong>Movimentação:</strong> ${data.titulo}</p>
              ${data.descricao ? `<p><strong>Descrição:</strong> ${data.descricao}</p>` : ""}
              <p><strong>Data:</strong> ${data.dataMovimentacao.toLocaleDateString("pt-BR")}</p>
            </div>
            
            <p>Para mais informações, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>${data.escritorioNome}</strong></p>
          </div>
          
          <div class="footer">
            <p>Esta é uma mensagem automática do sistema. Não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `,

    text: (data: { titulo: string; descricao?: string; processo: { numero: string; titulo?: string }; dataMovimentacao: Date; clienteNome: string; escritorioNome: string }) => `
Nova Movimentação Processual

Olá ${data.clienteNome},

Informamos que houve uma nova movimentação no seu processo:

Processo: ${data.processo.numero}
${data.processo.titulo ? `Título: ${data.processo.titulo}` : ""}
Movimentação: ${data.titulo}
${data.descricao ? `Descrição: ${data.descricao}` : ""}
Data: ${data.dataMovimentacao.toLocaleDateString("pt-BR")}

Para mais informações, entre em contato conosco.

Atenciosamente,
${data.escritorioNome}

---
Esta é uma mensagem automática do sistema. Não responda este email.
    `,
  },
};

/**
 * Função utilitária para enviar notificação de andamento por email
 */
export async function sendAndamentoEmailNotification(
  email: string,
  andamento: {
    titulo: string;
    descricao?: string;
    processo: { numero: string; titulo?: string };
    dataMovimentacao: Date;
  },
  clienteNome: string,
  escritorioNome: string
): Promise<EmailResponse> {
  const data = {
    ...andamento,
    clienteNome,
    escritorioNome,
  };

  return emailService.sendEmail({
    to: email,
    subject: emailTemplates.andamento.subject(andamento.processo.numero, andamento.titulo),
    html: emailTemplates.andamento.html(data),
    text: emailTemplates.andamento.text(data),
  });
}
