"use server";

import prisma from "@/app/lib/prisma";
import { enviarEmailCredenciais, enviarEmailConfirmacao } from "@/lib/email-service";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

interface CheckoutSession {
  id: string;
  dadosCheckout: any;
  planoId: string;
  tenantSlug: string;
  tenantDomain: string;
  asaasCustomerId: string;
  asaasPaymentId: string;
  status: string;
  createdAt: Date;
}

export async function processarPagamentoConfirmado(asaasPaymentId: string) {
  try {
    // Buscar dados da sessão de checkout no banco
    const checkoutSession = await prisma.checkoutSession.findFirst({
      where: { asaasPaymentId },
    });

    if (!checkoutSession) {
      throw new Error(`Sessão de checkout não encontrada para o pagamento ${asaasPaymentId}`);
    }

    // Buscar plano
    const plano = await prisma.plano.findUnique({
      where: { id: checkoutSession.planoId },
    });

    if (!plano) {
      throw new Error("Plano não encontrado");
    }

    // Gerar senha temporária
    const senhaTemporaria = nanoid(12);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: checkoutSession.dadosCheckout.nomeEmpresa,
        slug: checkoutSession.tenantSlug,
        domain: checkoutSession.tenantDomain,
        documento: checkoutSession.dadosCheckout.cnpj.replace(/\D/g, ""),
        email: checkoutSession.dadosCheckout.email,
        telefone: checkoutSession.dadosCheckout.telefone,
        status: "ACTIVE",
        tipoPessoa: "JURIDICA",
        razaoSocial: checkoutSession.dadosCheckout.nomeEmpresa,
      },
    });

    // Criar usuário admin
    const adminUser = await prisma.usuario.create({
      data: {
        firstName: checkoutSession.dadosCheckout.nomeResponsavel,
        email: checkoutSession.dadosCheckout.email,
        passwordHash: senhaHash,
        role: "ADMIN",
        tenantId: tenant.id,
        cpf: checkoutSession.dadosCheckout.cpf.replace(/\D/g, ""),
        phone: checkoutSession.dadosCheckout.telefone,
        active: true,
      },
    });

    // Criar assinatura com status ATIVA
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planoId: plano.id,
        status: "ATIVA",
        dataInicio: new Date(),
        asaasCustomerId: checkoutSession.asaasCustomerId,
        asaasPaymentId: checkoutSession.asaasPaymentId,
        metadata: {
          formaPagamento: checkoutSession.dadosCheckout.formaPagamento,
          dadosEmpresa: {
            nomeEmpresa: checkoutSession.dadosCheckout.nomeEmpresa,
            cnpj: checkoutSession.dadosCheckout.cnpj,
            endereco: {
              cep: checkoutSession.dadosCheckout.cep,
              endereco: checkoutSession.dadosCheckout.endereco,
              numero: checkoutSession.dadosCheckout.numero,
              complemento: checkoutSession.dadosCheckout.complemento,
              bairro: checkoutSession.dadosCheckout.bairro,
              cidade: checkoutSession.dadosCheckout.cidade,
              estado: checkoutSession.dadosCheckout.estado,
            },
          },
          dadosResponsavel: {
            nome: checkoutSession.dadosCheckout.nomeResponsavel,
            cpf: checkoutSession.dadosCheckout.cpf,
          },
        },
      },
    });

    // Enviar email de confirmação de pagamento
    try {
      await enviarEmailConfirmacao({
        email: checkoutSession.dadosCheckout.email,
        nome: checkoutSession.dadosCheckout.nomeResponsavel,
        valor: plano.valorMensal,
        formaPagamento: checkoutSession.dadosCheckout.formaPagamento,
        tenantDomain: checkoutSession.tenantDomain,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError);
    }

    // Enviar email com credenciais
    try {
      await enviarEmailCredenciais({
        email: checkoutSession.dadosCheckout.email,
        nome: checkoutSession.dadosCheckout.nomeResponsavel,
        tenantDomain: checkoutSession.tenantDomain,
        senhaTemporaria,
        plano: plano.nome,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de credenciais:", emailError);
    }

    // Atualizar status da sessão de checkout
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { status: "CONFIRMADO" },
    });

    return {
      success: true,
      data: {
        tenantId: tenant.id,
        tenantDomain: checkoutSession.tenantDomain,
        subscriptionId: subscription.id,
        credentials: {
          email: checkoutSession.dadosCheckout.email,
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
