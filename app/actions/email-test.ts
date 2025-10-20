"use server";

import {
  enviarEmailCredenciais,
  enviarEmailConfirmacao,
} from "@/lib/email-service";

export async function testarEmailCredenciais() {
  try {
    const result = await enviarEmailCredenciais({
      email: "teste@example.com",
      nome: "Usuário Teste",
      tenantDomain: "teste.magiclawyer.com",
      senhaTemporaria: "123456789",
      plano: "Pro",
    });

    return {
      success: true,
      message: "Email de credenciais enviado com sucesso!",
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Erro ao testar email de credenciais:", error);

    return {
      success: false,
      error: "Erro ao enviar email de credenciais",
    };
  }
}

export async function testarEmailConfirmacao() {
  try {
    const result = await enviarEmailConfirmacao({
      email: "teste@example.com",
      nome: "Usuário Teste",
      valor: 299.0,
      formaPagamento: "PIX",
      tenantDomain: "teste.magiclawyer.com",
    });

    return {
      success: true,
      message: "Email de confirmação enviado com sucesso!",
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Erro ao testar email de confirmação:", error);

    return {
      success: false,
      error: "Erro ao enviar email de confirmação",
    };
  }
}
