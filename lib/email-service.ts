import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailCredenciais {
  email: string;
  nome: string;
  tenantDomain: string;
  senhaTemporaria: string;
  plano: string;
}

interface EmailConfirmacao {
  email: string;
  nome: string;
  valor: number;
  formaPagamento: string;
  tenantDomain: string;
}

export async function enviarEmailCredenciais(data: EmailCredenciais) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: "Magic Lawyer <onboarding@resend.dev>",
      to: [data.email],
      subject: `🎉 Bem-vindo ao Magic Lawyer! Suas credenciais de acesso`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao Magic Lawyer</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .credentials-box {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #3b82f6;
            }
            .credential-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .credential-item:last-child {
              border-bottom: none;
            }
            .credential-label {
              font-weight: 600;
              color: #374151;
            }
            .credential-value {
              font-family: monospace;
              background: #1f2937;
              color: #10b981;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #2563eb;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .warning-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 5px;
            }
            .warning-text {
              color: #92400e;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚖️ Magic Lawyer</div>
              <h1 class="title">Bem-vindo ao Magic Lawyer!</h1>
            </div>

            <p>Olá <strong>${data.nome}</strong>,</p>
            
            <p>Sua conta foi criada com sucesso! Agora você pode acessar sua plataforma de gestão jurídica completa.</p>

            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #1f2937;">🔑 Suas Credenciais de Acesso</h3>
              
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${data.email}</span>
              </div>
              
              <div class="credential-item">
                <span class="credential-label">Senha Temporária:</span>
                <span class="credential-value">${data.senhaTemporaria}</span>
              </div>
              
              <div class="credential-item">
                <span class="credential-label">Plano:</span>
                <span class="credential-value">${data.plano}</span>
              </div>
              
              <div class="credential-item">
                <span class="credential-label">URL de Acesso:</span>
                <span class="credential-value">${data.tenantDomain}</span>
              </div>
            </div>

            <div class="warning">
              <div class="warning-title">⚠️ Importante</div>
              <div class="warning-text">
                Por segurança, altere sua senha temporária no primeiro acesso. 
                Esta senha expira em 7 dias.
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://${data.tenantDomain}" class="button">
                🚀 Acessar Minha Conta
              </a>
            </div>

            <h3 style="color: #1f2937; margin-top: 30px;">📋 Próximos Passos:</h3>
            <ul>
              <li>Faça login com suas credenciais</li>
              <li>Configure seu perfil e dados do escritório</li>
              <li>Importe seus primeiros processos</li>
              <li>Explore as funcionalidades do plano ${data.plano}</li>
              <li>Entre em contato conosco se precisar de ajuda</li>
            </ul>

            <h3 style="color: #1f2937;">💡 Dicas para Começar:</h3>
            <ul>
              <li>Complete seu perfil para personalizar a experiência</li>
              <li>Configure seus dados bancários para recebimentos</li>
              <li>Importe clientes e processos existentes</li>
              <li>Explore os relatórios e dashboards</li>
            </ul>

            <div class="footer">
              <p>Se você tiver alguma dúvida, nossa equipe de suporte está pronta para ajudar!</p>
              <p><strong>Suporte:</strong> suporte@magiclawyer.com</p>
              <p><strong>Telefone:</strong> (11) 99999-9999</p>
              <br>
              <p>Este é um email automático, não responda a esta mensagem.</p>
              <p>© 2025 Magic Lawyer. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email de credenciais:", error);
      throw new Error("Falha ao enviar email");
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error("Erro no serviço de email:", error);
    throw error;
  }
}

export async function enviarEmailConfirmacao(data: EmailConfirmacao) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: "Magic Lawyer <onboarding@resend.dev>",
      to: [data.email],
      subject: `✅ Pagamento confirmado - Magic Lawyer`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Confirmado</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #10b981;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .success-box {
              background: #ecfdf5;
              border: 1px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .payment-details {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-item:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✅ Magic Lawyer</div>
              <h1 class="title">Pagamento Confirmado!</h1>
            </div>

            <p>Olá <strong>${data.nome}</strong>,</p>
            
            <div class="success-box">
              <h3 style="margin-top: 0; color: #065f46;">🎉 Sucesso!</h3>
              <p style="color: #065f46; margin-bottom: 0;">
                Seu pagamento foi processado com sucesso e sua conta Magic Lawyer está ativa!
              </p>
            </div>

            <div class="payment-details">
              <h3 style="margin-top: 0; color: #1f2937;">📋 Detalhes do Pagamento</h3>
              
              <div class="detail-item">
                <span>Valor:</span>
                <strong>R$ ${data.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </div>
              
              <div class="detail-item">
                <span>Forma de Pagamento:</span>
                <strong>${data.formaPagamento}</strong>
              </div>
              
              <div class="detail-item">
                <span>Data:</span>
                <strong>${new Date().toLocaleDateString("pt-BR")}</strong>
              </div>
              
              <div class="detail-item">
                <span>Status:</span>
                <strong style="color: #10b981;">✅ Aprovado</strong>
              </div>
            </div>

            <p>Sua conta está pronta para uso! Em breve você receberá um email com suas credenciais de acesso.</p>

            <div style="text-align: center;">
              <a href="https://${data.tenantDomain}" class="button">
                🚀 Acessar Minha Conta
              </a>
            </div>

            <div class="footer">
              <p>Se você tiver alguma dúvida sobre o pagamento, entre em contato conosco.</p>
              <p><strong>Suporte:</strong> suporte@magiclawyer.com</p>
              <p><strong>Telefone:</strong> (11) 99999-9999</p>
              <br>
              <p>Este é um email automático, não responda a esta mensagem.</p>
              <p>© 2025 Magic Lawyer. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email de confirmação:", error);
      throw new Error("Falha ao enviar email de confirmação");
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error("Erro no serviço de email:", error);
    throw error;
  }
}

export async function enviarEmailLembrete(data: { email: string; nome: string; tenantDomain: string; diasRestantes: number }) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: "Magic Lawyer <onboarding@resend.dev>",
      to: [data.email],
      subject: `⏰ Lembrete: Acesse sua conta Magic Lawyer`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Acesso</title>
        <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #f59e0b;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .reminder-box {
              background: #fffbeb;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
              <div class="logo">⏰ Magic Lawyer</div>
              <h1 class="title">Lembrete de Acesso</h1>
          </div>
          
            <p>Olá <strong>${data.nome}</strong>,</p>
            
            <div class="reminder-box">
              <h3 style="margin-top: 0; color: #92400e;">🔔 Não esqueça de acessar sua conta!</h3>
              <p style="color: #92400e; margin-bottom: 0;">
                Sua conta Magic Lawyer está pronta há alguns dias. 
                ${data.diasRestantes > 0 ? `Você ainda tem ${data.diasRestantes} dias de teste grátis.` : "Seu período de teste está prestes a expirar."}
              </p>
            </div>
            
            <p>Não perca a oportunidade de experimentar todas as funcionalidades da nossa plataforma de gestão jurídica!</p>

            <div style="text-align: center;">
              <a href="https://${data.tenantDomain}" class="button">
                🚀 Acessar Minha Conta
              </a>
          </div>
          
          <div class="footer">
              <p>Se você tiver alguma dúvida, nossa equipe está pronta para ajudar!</p>
              <p><strong>Suporte:</strong> suporte@magiclawyer.com</p>
              <p><strong>Telefone:</strong> (11) 99999-9999</p>
              <br>
              <p>Este é um email automático, não responda a esta mensagem.</p>
              <p>© 2025 Magic Lawyer. Todos os direitos reservados.</p>
            </div>
        </div>
      </body>
      </html>
    `,
    });

    if (error) {
      console.error("Erro ao enviar email de lembrete:", error);
      throw new Error("Falha ao enviar email de lembrete");
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error("Erro no serviço de email:", error);
    throw error;
  }
}
