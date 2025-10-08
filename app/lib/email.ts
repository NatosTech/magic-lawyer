import nodemailer from "nodemailer";

// Configuração do transporter do Nodemailer
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Para desenvolvimento, em produção deve ser true
    },
  });
};

// Interface para opções de email
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Função para enviar email
export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email enviado com sucesso:", result.messageId);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para verificar a conexão SMTP
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();

    await transporter.verify();
    console.log("Conexão SMTP verificada com sucesso");

    return { success: true };
  } catch (error) {
    console.error("Erro na verificação SMTP:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Templates de email
export const emailTemplates = {
  // Template para notificação de novo evento
  novoEvento: (evento: {
    titulo: string;
    dataInicio: string;
    local?: string;
    descricao?: string;
  }) => ({
    subject: `Novo evento agendado: ${evento.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Novo Evento Agendado</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #2c3e50;">${evento.titulo}</h3>
          <p><strong>Data/Hora:</strong> ${evento.dataInicio}</p>
          ${evento.local ? `<p><strong>Local:</strong> ${evento.local}</p>` : ""}
          ${evento.descricao ? `<p><strong>Descrição:</strong> ${evento.descricao}</p>` : ""}
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Este é um email automático do sistema Magic Lawyer.
        </p>
      </div>
    `,
  }),

  // Template para lembrete de evento
  lembreteEvento: (evento: {
    titulo: string;
    dataInicio: string;
    local?: string;
    minutosRestantes: number;
  }) => ({
    subject: `Lembrete: ${evento.titulo} em ${evento.minutosRestantes} minutos`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Lembrete de Evento</h2>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">${evento.titulo}</h3>
          <p><strong>Data/Hora:</strong> ${evento.dataInicio}</p>
          ${evento.local ? `<p><strong>Local:</strong> ${evento.local}</p>` : ""}
          <p style="color: #856404; font-weight: bold;">
            ⏰ Evento em ${evento.minutosRestantes} minutos
          </p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Este é um lembrete automático do sistema Magic Lawyer.
        </p>
      </div>
    `,
  }),

  // Template para documento para assinatura
  documentoAssinatura: (documento: {
    titulo: string;
    urlAssinatura: string;
    dataExpiracao?: string;
    descricao?: string;
  }) => ({
    subject: `Documento para assinatura: ${documento.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Documento para Assinatura</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #2c3e50;">${documento.titulo}</h3>
          ${documento.descricao ? `<p><strong>Descrição:</strong> ${documento.descricao}</p>` : ""}
          ${documento.dataExpiracao ? `<p><strong>Expira em:</strong> ${documento.dataExpiracao}</p>` : ""}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documento.urlAssinatura}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Assinar Documento
            </a>
          </div>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Este é um email automático do sistema Magic Lawyer.
        </p>
      </div>
    `,
  }),

  // Template para notificação financeira
  notificacaoFinanceira: (dados: {
    tipo: "fatura" | "pagamento" | "vencimento";
    titulo: string;
    valor?: string;
    dataVencimento?: string;
    descricao?: string;
  }) => ({
    subject: `Notificação Financeira: ${dados.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Notificação Financeira</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #2c3e50;">${dados.titulo}</h3>
          ${dados.descricao ? `<p><strong>Descrição:</strong> ${dados.descricao}</p>` : ""}
          ${dados.valor ? `<p><strong>Valor:</strong> ${dados.valor}</p>` : ""}
          ${dados.dataVencimento ? `<p><strong>Vencimento:</strong> ${dados.dataVencimento}</p>` : ""}
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Este é um email automático do sistema Magic Lawyer.
        </p>
      </div>
    `,
  }),
};
