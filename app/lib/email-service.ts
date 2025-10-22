import { Resend } from "resend";

// =============================================
// TYPES
// =============================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface AdvogadoEmailData {
  nome: string;
  email: string;
  oab: string;
  especialidades: string[];
  senhaTemporaria?: string;
  linkLogin?: string;
}

// =============================================
// EMAIL TEMPLATES
// =============================================

export const getBoasVindasTemplate = (data: AdvogadoEmailData): EmailTemplate => {
  const especialidadesText = data.especialidades.length > 0 ? data.especialidades.join(", ") : "Não especificadas";

  return {
    subject: "Bem-vindo ao Magic Lawyer! 🎉",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Magic Lawyer</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .welcome-title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .info-card {
            background-color: #f8f9fa;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .info-value {
            color: #6b7280;
          }
          .credentials {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials-title {
            color: #92400e;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .credentials-item {
            margin-bottom: 8px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background-color: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #dc2626;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚖️ Magic Lawyer</div>
            <h1 class="welcome-title">Bem-vindo, ${data.nome}!</h1>
          </div>

          <p>É com grande prazer que damos as boas-vindas ao <strong>Magic Lawyer</strong>! Seu perfil de advogado foi criado com sucesso e você já pode começar a utilizar nossa plataforma.</p>

          <div class="info-card">
            <h3 style="color: #2563eb; margin-top: 0;">Seus Dados Cadastrais</h3>
            <div class="info-item">
              <span class="info-label">Nome:</span>
              <span class="info-value"> ${data.nome}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value"> ${data.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">OAB:</span>
              <span class="info-value"> ${data.oab}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Especialidades:</span>
              <span class="info-value"> ${especialidadesText}</span>
            </div>
          </div>

          ${
            data.senhaTemporaria
              ? `
            <div class="credentials">
              <div class="credentials-title">🔐 Credenciais de Acesso</div>
              <div class="credentials-item">
                <strong>Email:</strong> ${data.email}
              </div>
              <div class="credentials-item">
                <strong>Senha Temporária:</strong> ${data.senhaTemporaria}
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha temporária no primeiro acesso.
            </div>
          `
              : ""
          }

          <p>Com o Magic Lawyer, você terá acesso a:</p>
          <ul>
            <li>📋 Gestão completa de processos</li>
            <li>👥 Controle de clientes</li>
            <li>📊 Relatórios de performance</li>
            <li>💰 Controle de comissões</li>
            <li>🔔 Notificações em tempo real</li>
            <li>📱 Interface responsiva e intuitiva</li>
          </ul>

          ${
            data.linkLogin
              ? `
            <div style="text-align: center;">
              <a href="${data.linkLogin}" class="button">Acessar Plataforma</a>
            </div>
          `
              : ""
          }

          <p>Se você tiver alguma dúvida ou precisar de suporte, não hesite em entrar em contato conosco.</p>

          <div class="footer">
            <p>Este é um email automático do sistema Magic Lawyer.</p>
            <p>© ${new Date().getFullYear()} Magic Lawyer. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Bem-vindo ao Magic Lawyer!

      Olá ${data.nome},

      É com grande prazer que damos as boas-vindas ao Magic Lawyer! Seu perfil de advogado foi criado com sucesso.

      Seus Dados:
      - Nome: ${data.nome}
      - Email: ${data.email}
      - OAB: ${data.oab}
      - Especialidades: ${especialidadesText}

      ${
        data.senhaTemporaria
          ? `
      Credenciais de Acesso:
      - Email: ${data.email}
      - Senha Temporária: ${data.senhaTemporaria}
      
      IMPORTANTE: Por questões de segurança, altere sua senha no primeiro acesso.
      `
          : ""
      }

      Com o Magic Lawyer você terá acesso a:
      - Gestão completa de processos
      - Controle de clientes
      - Relatórios de performance
      - Controle de comissões
      - Notificações em tempo real
      - Interface responsiva e intuitiva

      ${data.linkLogin ? `Acesse: ${data.linkLogin}` : ""}

      Se tiver dúvidas, entre em contato conosco.

      © ${new Date().getFullYear()} Magic Lawyer. Todos os direitos reservados.
    `,
  };
};

export const getNotificacaoTemplate = (data: { nome: string; email: string; tipo: string; titulo: string; mensagem: string; linkAcao?: string; textoAcao?: string }): EmailTemplate => {
  return {
    subject: `🔔 Magic Lawyer - ${data.titulo}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificação - Magic Lawyer</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .notification-title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .notification-content {
            background-color: #f8f9fa;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚖️ Magic Lawyer</div>
            <h1 class="notification-title">${data.titulo}</h1>
          </div>

          <p>Olá <strong>${data.nome}</strong>,</p>

          <div class="notification-content">
            <p>${data.mensagem}</p>
          </div>

          ${
            data.linkAcao && data.textoAcao
              ? `
            <div style="text-align: center;">
              <a href="${data.linkAcao}" class="button">${data.textoAcao}</a>
            </div>
          `
              : ""
          }

          <p>Atenciosamente,<br>Equipe Magic Lawyer</p>

          <div class="footer">
            <p>Este é um email automático do sistema Magic Lawyer.</p>
            <p>© ${new Date().getFullYear()} Magic Lawyer. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Magic Lawyer - ${data.titulo}

      Olá ${data.nome},

      ${data.mensagem}

      ${data.linkAcao && data.textoAcao ? `${data.textoAcao}: ${data.linkAcao}` : ""}

      Atenciosamente,
      Equipe Magic Lawyer

      © ${new Date().getFullYear()} Magic Lawyer. Todos os direitos reservados.
    `,
  };
};

// =============================================
// EMAIL SERVICE
// =============================================

class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY not configured");
        return false;
      }

      const { data, error } = await this.resend.emails.send({
        from: emailData.from || "Magic Lawyer <notificacoes@magiclawyer.com>",
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ""),
      });

      if (error) {
        console.error("Error sending email:", error);
        return false;
      }

      console.log("Email sent successfully:", data?.id);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendBoasVindasAdvogado(data: AdvogadoEmailData): Promise<boolean> {
    const template = getBoasVindasTemplate(data);

    return this.sendEmail({
      to: data.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendNotificacaoAdvogado(data: { nome: string; email: string; tipo: string; titulo: string; mensagem: string; linkAcao?: string; textoAcao?: string }): Promise<boolean> {
    const template = getNotificacaoTemplate(data);

    return this.sendEmail({
      to: data.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Método para testar a configuração de email
  async testConnection(): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        return false;
      }
      // Resend não tem um método de verificação direto, então vamos tentar enviar um email de teste
      const { error } = await this.resend.emails.send({
        from: "Magic Lawyer <notificacoes@magiclawyer.com>",
        to: ["test@example.com"],
        subject: "Test Connection",
        html: "<p>Test</p>",
      });
      return !error;
    } catch (error) {
      console.error("Email connection test failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
