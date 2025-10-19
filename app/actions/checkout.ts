"use server";

import { nanoid } from "nanoid";

import prisma from "@/app/lib/prisma";
import { AsaasClient, formatCpfCnpjForAsaas, formatDateForAsaas } from "@/lib/asaas";

interface CheckoutData {
  // Dados da empresa
  nomeEmpresa: string;
  cnpj: string;
  email: string;
  telefone: string;

  // Dados do responsável
  nomeResponsavel: string;
  cpf: string;

  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;

  // Pagamento
  formaPagamento: "PIX" | "BOLETO" | "CREDIT_CARD";
  planoId: string;
}

export async function processarCheckout(data: CheckoutData) {
  try {
    // Buscar plano
    const plano = await prisma.plano.findUnique({
      where: { id: data.planoId },
    });

    if (!plano) {
      return { success: false, error: "Plano não encontrado" };
    }

    // Verificar se já existe um tenant com este CNPJ ou email
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ documento: data.cnpj.replace(/\D/g, "") }, { email: { equals: data.email, mode: "insensitive" } }],
      },
    });

    if (existingTenant) {
      return {
        success: false,
        error: "Já existe uma conta com este CNPJ ou email",
      };
    }

    // Gerar dados únicos para o tenant (sempre minúsculo)
    const tenantSlug = nanoid(8).toLowerCase();
    const tenantDomain = `${tenantSlug}.magiclawyer.com`;

    // Validar credenciais do Asaas
    const apiKey = process.env.ASAAS_API_KEY;

    console.log("[checkout] ASAAS_API_KEY presente?", apiKey ? `sim (${apiKey.slice(0, 10)}...)` : "não");

    if (!apiKey) {
      return {
        success: false,
        error: "Configuração do sistema de pagamento não encontrada.",
      };
    }

    const asaasEnvironment: "sandbox" | "production" = process.env.ASAAS_ENVIRONMENT?.toLowerCase() === "production" ? "production" : "sandbox";

    // Criar cliente no Asaas
    const asaasClient = new AsaasClient(apiKey, asaasEnvironment);

    const sanitizedPhone = data.telefone?.replace(/\D/g, "");
    const sanitizedCep = data.cep.replace(/\D/g, "");

    const customerData = {
      name: data.nomeEmpresa,
      email: data.email,
      phone: sanitizedPhone,
      mobilePhone: sanitizedPhone,
      cpfCnpj: formatCpfCnpjForAsaas(data.cnpj),
      address: data.endereco,
      addressNumber: data.numero,
      complement: data.complemento,
      province: data.bairro,
      city: data.cidade,
      state: data.estado,
      postalCode: sanitizedCep,
      country: "Brasil",
    };

    const customer = await asaasClient.createCustomer(customerData);

    if (!customer?.id) {
      return {
        success: false,
        error: "Erro ao criar cliente no sistema de pagamento",
      };
    }

    // Criar cobrança no Asaas
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const paymentData = {
      customer: customer.id,
      billingType: data.formaPagamento,
      value: Number(plano.valorMensal),
      dueDate: formatDateForAsaas(dueDate), // 7 dias no futuro
      description: `Assinatura ${plano.nome} - Magic Lawyer`,
      externalReference: `checkout_${Date.now()}`,
    };

    const payment = await asaasClient.createPayment(paymentData);

    if (!payment?.id) {
      return {
        success: false,
        error: "Erro ao criar cobrança no sistema de pagamento",
      };
    }

    // Salvar dados temporários para processar após pagamento
    const checkoutSession = {
      id: nanoid(),
      dadosCheckout: data,
      planoId: plano.id,
      tenantSlug,
      tenantDomain,
      asaasCustomerId: customer.id,
      asaasPaymentId: payment.id,
      status: "PENDENTE",
      createdAt: new Date(),
    };

    // Salvar sessão de checkout no banco (temporário)
    await prisma.checkoutSession.create({
      data: {
        id: checkoutSession.id,
        dadosCheckout: checkoutSession.dadosCheckout,
        planoId: checkoutSession.planoId,
        tenantSlug: checkoutSession.tenantSlug,
        tenantDomain: checkoutSession.tenantDomain,
        asaasCustomerId: checkoutSession.asaasCustomerId,
        asaasPaymentId: checkoutSession.asaasPaymentId,
        status: "PENDENTE",
        createdAt: checkoutSession.createdAt,
      },
    });

    // Buscar dados completos do pagamento (incluindo PIX)
    const fullPayment = await asaasClient.getPayment(payment.id);

    console.log("🔍 Full Payment Data:", JSON.stringify(fullPayment, null, 2));

    return {
      success: true,
      data: {
        checkoutId: checkoutSession.id,
        paymentData: {
          ...payment,
          pixQrCode: fullPayment?.pixQrCode || "",
          pixCopyPaste: fullPayment?.pixCopyPaste || "",
          pixTransaction: fullPayment?.pixTransaction || null,
        },
        customerData: customer,
        message: "Pagamento criado com sucesso! Complete o pagamento para ativar sua conta.",
      },
    };
  } catch (error) {
    console.error("Erro ao processar checkout:", error);
    if (error instanceof Error && error.message.includes("401")) {
      return {
        success: false,
        error: "Falha na autenticação com o sistema de pagamento. Verifique a API key configurada.",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
    };
  }
}

export async function verificarDisponibilidadeCNPJ(cnpj: string) {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    const existingTenant = await prisma.tenant.findFirst({
      where: { documento: cnpjLimpo },
    });

    return {
      success: true,
      data: {
        disponivel: !existingTenant,
        message: existingTenant ? "CNPJ já cadastrado" : "CNPJ disponível",
      },
    };
  } catch (error) {
    console.error("Erro ao verificar CNPJ:", error);

    return {
      success: false,
      error: "Erro ao verificar CNPJ",
    };
  }
}

export async function verificarDisponibilidadeEmail(email: string) {
  try {
    const existingTenant = await prisma.tenant.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    const existingUser = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    return {
      success: true,
      data: {
        disponivel: !existingTenant && !existingUser,
        message: existingTenant || existingUser ? "Email já cadastrado" : "Email disponível",
      },
    };
  } catch (error) {
    console.error("Erro ao verificar email:", error);

    return {
      success: false,
      error: "Erro ao verificar email",
    };
  }
}
