"use server";

import type { CheckoutData } from "./checkout";

import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

import prisma, { toNumber } from "@/app/lib/prisma";
import {
  enviarEmailCredenciais,
  enviarEmailConfirmacao,
} from "@/lib/email-service";

export type ProcessarPagamentoConfirmadoResult =
  | {
      success: true;
      data: {
        tenantId: string;
        tenantDomain: string;
        subscriptionId: string;
        credentials: {
          email: string;
          senhaTemporaria: string;
        };
        message: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function processarPagamentoConfirmado(
  asaasPaymentId: string,
): Promise<ProcessarPagamentoConfirmadoResult> {
  try {
    const checkoutSession = await prisma.checkoutSession.findFirst({
      where: { asaasPaymentId },
    });

    if (!checkoutSession) {
      throw new Error(
        `Sessão de checkout não encontrada para o pagamento ${asaasPaymentId}`,
      );
    }

    const checkoutData = checkoutSession.dadosCheckout as CheckoutData | null;

    if (!checkoutData) {
      throw new Error("Dados do checkout não encontrados");
    }

    const plano = await prisma.plano.findUnique({
      where: { id: checkoutSession.planoId },
    });

    if (!plano) {
      throw new Error("Plano não encontrado");
    }

    const senhaTemporaria = nanoid(12);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: checkoutData.nomeEmpresa,
        slug: checkoutSession.tenantSlug,
        domain: checkoutSession.tenantDomain,
        documento: checkoutData.cnpj.replace(/\D/g, ""),
        email: checkoutData.email,
        telefone: checkoutData.telefone,
        status: "ACTIVE",
        tipoPessoa: "JURIDICA",
        razaoSocial: checkoutData.nomeEmpresa,
      },
    });

    await prisma.usuario.create({
      data: {
        firstName: checkoutData.nomeResponsavel,
        email: checkoutData.email,
        passwordHash: senhaHash,
        role: "ADMIN",
        tenantId: tenant.id,
        cpf: checkoutData.cpf.replace(/\D/g, ""),
        phone: checkoutData.telefone,
        active: true,
      },
    });

    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planoId: plano.id,
        status: "ATIVA",
        dataInicio: new Date(),
        asaasCustomerId: checkoutSession.asaasCustomerId,
        asaasPaymentId: checkoutSession.asaasPaymentId,
        metadata: {
          formaPagamento: checkoutData.formaPagamento,
          dadosEmpresa: {
            nomeEmpresa: checkoutData.nomeEmpresa,
            cnpj: checkoutData.cnpj,
            endereco: {
              cep: checkoutData.cep,
              endereco: checkoutData.endereco,
              numero: checkoutData.numero,
              complemento: checkoutData.complemento,
              bairro: checkoutData.bairro,
              cidade: checkoutData.cidade,
              estado: checkoutData.estado,
            },
          },
          dadosResponsavel: {
            nome: checkoutData.nomeResponsavel,
            cpf: checkoutData.cpf,
          },
        },
      },
    });

    const valorPlano = toNumber(plano.valorMensal) ?? 0;

    try {
      await enviarEmailConfirmacao({
        email: checkoutData.email,
        nome: checkoutData.nomeResponsavel,
        valor: valorPlano,
        formaPagamento: checkoutData.formaPagamento,
        tenantDomain: checkoutSession.tenantDomain,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError);
    }

    try {
      await enviarEmailCredenciais({
        email: checkoutData.email,
        nome: checkoutData.nomeResponsavel,
        tenantDomain: checkoutSession.tenantDomain,
        senhaTemporaria,
        plano: plano.nome,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de credenciais:", emailError);
    }

    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { status: "CONFIRMED" },
    });

    return {
      success: true,
      data: {
        tenantId: tenant.id,
        tenantDomain: checkoutSession.tenantDomain,
        subscriptionId: subscription.id,
        credentials: {
          email: checkoutData.email,
          senhaTemporaria,
        },
        message: "Conta criada com sucesso após confirmação do pagamento!",
      },
    };
  } catch (error) {
    console.error("Erro ao processar pagamento confirmado:", error);

    return {
      success: false,
      error: "Erro ao processar pagamento confirmado",
    };
  }
}
