import { emailService } from "@/app/lib/email-service";

export interface ConviteEmailData {
  email: string;
  nome?: string;
  nomeEscritorio: string;
  token: string;
  expiraEm: Date;
  observacoes?: string;
  cargo?: string;
  role: string;
}

export async function sendConviteEmail(
  tenantId: string,
  data: ConviteEmailData,
): Promise<void> {
  const {
    email,
    nome,
    nomeEscritorio,
    token,
    expiraEm,
    observacoes,
    cargo,
    role,
  } = data;

  const conviteUrl = `${process.env.NEXTAUTH_URL}/convite/${token}`;
  const expiracaoFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(expiraEm));

  const roleLabel = getRoleLabel(role);

  try {
    const subject = `Convite para participar da equipe ${nomeEscritorio}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Equipe</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .invite-details {
              background: #f3f4f6;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
            }
            .detail-value {
              color: #6b7280;
            }
            .cta-button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button:hover {
              background: #1d4ed8;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .observacoes {
              background: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #0c4a6e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚖️ Magic Lawyer</div>
              <h1 class="title">Você foi convidado para a equipe!</h1>
            </div>

            <div class="content">
              <p>Olá${nome ? ` ${nome}` : ""},</p>
              
              <p>Você foi convidado para participar da equipe do escritório <strong>${nomeEscritorio}</strong> no Magic Lawyer.</p>

              <div class="invite-details">
                <div class="detail-row">
                  <span class="detail-label">Escritório:</span>
                  <span class="detail-value">${nomeEscritorio}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Função:</span>
                  <span class="detail-value">${roleLabel}</span>
                </div>
                ${
                  cargo
                    ? `
                <div class="detail-row">
                  <span class="detail-label">Cargo:</span>
                  <span class="detail-value">${cargo}</span>
                </div>
                `
                    : ""
                }
                <div class="detail-row">
                  <span class="detail-label">Expira em:</span>
                  <span class="detail-value">${expiracaoFormatada}</span>
                </div>
              </div>

              ${
                observacoes
                  ? `
              <div class="observacoes">
                <strong>Mensagem do convite:</strong><br>
                ${observacoes}
              </div>
              `
                  : ""
              }

              <div style="text-align: center;">
                <a href="${conviteUrl}" class="cta-button">
                  Aceitar Convite
                </a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Este convite expira em ${expiracaoFormatada}. 
                Após essa data, você precisará solicitar um novo convite.
              </div>

              <p>Se você não conseguir clicar no botão acima, copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${conviteUrl}</p>
            </div>

            <div class="footer">
              <p>Este é um email automático do Magic Lawyer. Não responda a este email.</p>
              <p>Se você não esperava receber este convite, pode ignorá-lo com segurança.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const result = await emailService.sendEmailPerTenant(tenantId, {
      to: email,
      subject,
      html,
      from: undefined,
      text: undefined,
      credentialType: "ADMIN",
      fromNameFallback: nomeEscritorio,
    });

    if (!result.success) {
      throw new Error(result.error || "Falha ao enviar email de convite");
    }
  } catch (error) {
    console.error("Erro ao enviar email de convite:", error);
    throw new Error("Erro ao enviar email de convite");
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ADVOGADO":
      return "Advogado";
    case "SECRETARIA":
      return "Secretária";
    case "CLIENTE":
      return "Cliente";
    default:
      return role;
  }
}
