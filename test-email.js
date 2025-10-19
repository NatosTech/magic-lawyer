// Script para testar o envio de emails
require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function testarEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Magic Lawyer <onboarding@resend.dev>",
      to: ["magiclawyersaas@gmail.com"],
      subject: "Teste de Email - Magic Lawyer",
      html: `
        <h1>Teste de Email</h1>
        <p>Se você recebeu este email, o sistema está funcionando!</p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
    } else {
      console.log("Email enviado com sucesso!", data);
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

testarEmail();
