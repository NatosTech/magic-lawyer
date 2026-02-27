"use server";

import type { CheckoutData } from "./checkout";

import prisma, { toNumber } from "@/app/lib/prisma";
import { emailService } from "@/app/lib/email-service";
import { ensureDefaultCargosForTenant } from "@/app/lib/default-cargos";
import { enviarEmailPrimeiroAcesso, maskEmail } from "@/app/lib/first-access-email";

export type ProcessarPagamentoConfirmadoResult =
  | {
      success: true;
      data: {
        tenantId: string;
        tenantDomain: string;
        subscriptionId: string;
        credentials: {
          email: string;
          maskedEmail: string;
          primeiroAcessoEnviado: boolean;
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

    const adminUser = await prisma.usuario.create({
      data: {
        firstName: checkoutData.nomeResponsavel,
        email: checkoutData.email,
        passwordHash: null,
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

    let primeiroAcessoEnviado = false;

    try {
      const baseUrl = checkoutSession.tenantDomain.includes("localhost")
        ? `http://${checkoutSession.tenantDomain}`
        : `https://${checkoutSession.tenantDomain}`;
      const envioPrimeiroAcesso = await enviarEmailPrimeiroAcesso({
        userId: adminUser.id,
        tenantId: tenant.id,
        email: checkoutData.email,
        nome: checkoutData.nomeResponsavel,
        tenantNome: checkoutData.nomeEmpresa,
        baseUrl,
      });
      primeiroAcessoEnviado = envioPrimeiroAcesso.success;

      if (!envioPrimeiroAcesso.success) {
        console.warn("Falha ao enviar e-mail de primeiro acesso:", envioPrimeiroAcesso.error);
      }
    } catch (emailError) {
      console.error("Erro ao enviar email de primeiro acesso:", emailError);
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
          maskedEmail: maskEmail(checkoutData.email),
          primeiroAcessoEnviado,
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
