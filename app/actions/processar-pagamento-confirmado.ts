"use server";

import type { CheckoutData } from "./checkout";

import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

import prisma, { toNumber } from "@/app/lib/prisma";
import { emailService } from "@/app/lib/email-service";
import { ensureDefaultCargosForTenant } from "@/app/lib/default-cargos";

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

    await ensureDefaultCargosForTenant(prisma, tenant.id);

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
      const assunto = `✅ Pagamento confirmado - Magic Lawyer`;
      const html = `
        <h2>Pagamento Confirmado</h2>
        <p>Olá <strong>${checkoutData.nomeResponsavel}</strong>, seu pagamento foi processado com sucesso.</p>
        <p><strong>Plano:</strong> ${plano.nome} — <strong>Valor:</strong> R$ ${valorPlano.toFixed(2)}</p>
        <p>Seu domínio: ${checkoutSession.tenantDomain}</p>
      `;

      await emailService.sendEmailPerTenant(tenant.id, {
        to: checkoutData.email,
        subject: assunto,
        html,
        credentialType: "ADMIN",
        fromNameFallback: checkoutData.nomeEmpresa,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError);
    }

    try {
      const htmlCred = `
        <h2>Bem-vindo ao Magic Lawyer!</h2>
        <p>Olá <strong>${checkoutData.nomeResponsavel}</strong>, sua conta foi criada com sucesso.</p>
        <p><strong>Email:</strong> ${checkoutData.email}</p>
        <p><strong>Senha Temporária:</strong> ${senhaTemporaria}</p>
        <p><strong>Plano:</strong> ${plano.nome}</p>
        <p><strong>URL de acesso:</strong> https://${checkoutSession.tenantDomain}</p>
      `;

      const sent = await emailService.sendEmailPerTenant(tenant.id, {
        to: checkoutData.email,
        subject: `🎉 Bem-vindo ao Magic Lawyer! Suas credenciais de acesso`,
        html: htmlCred,
        credentialType: "ADMIN",
        fromNameFallback: checkoutData.nomeEmpresa,
      });

      if (!sent.success) {
        console.warn("Falha ao enviar credenciais:", sent.error);
      }
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
