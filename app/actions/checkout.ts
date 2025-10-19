"use server";

import prisma from "@/app/lib/prisma";
import { AsaasClient, formatCpfCnpjForAsaas, formatValueForAsaas, formatDateForAsaas } from "@/lib/asaas";
import { enviarEmailCredenciais, enviarEmailConfirmacao } from "@/lib/email-service";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

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
        OR: [{ documento: data.cnpj.replace(/\D/g, "") }, { email: data.email }],
      },
    });

    if (existingTenant) {
      return { success: false, error: "Já existe uma conta com este CNPJ ou email" };
    }

    // Gerar dados únicos para o tenant
    const tenantSlug = nanoid(8);
    const tenantDomain = `${tenantSlug}.magiclawyer.com`;

    // Criar cliente no Asaas
    const asaasClient = new AsaasClient(process.env.ASAAS_API_KEY || "", "sandbox");

    const customerData = {
      name: data.nomeEmpresa,
      email: data.email,
      phone: data.telefone,
      cpfCnpj: data.cnpj.replace(/\D/g, ""),
      personType: "JURIDICA",
      address: data.endereco,
      addressNumber: data.numero,
      complement: data.complemento,
      province: data.bairro,
      city: data.cidade,
      state: data.estado,
      postalCode: data.cep.replace(/\D/g, ""),
    };

    const customer = await asaasClient.createCustomer(customerData);

    if (!customer.success) {
      console.error("Erro ao criar cliente:", customer);
      return { success: false, error: "Erro ao criar cliente no sistema de pagamento" };
    }

    // Criar cobrança no Asaas
    const paymentData = {
      customer: customer.data.id,
      billingType: data.formaPagamento,
      value: Number(plano.valorMensal),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias no futuro
      description: `Assinatura ${plano.nome} - Magic Lawyer`,
      externalReference: `checkout_${Date.now()}`,
    };

    const payment = await asaasClient.createPayment(paymentData);

    if (!payment.success) {
      console.error("Erro ao criar pagamento:", payment);
      return { success: false, error: "Erro ao criar cobrança no sistema de pagamento" };
    }

    // Salvar dados temporários para processar após pagamento
    const checkoutSession = {
      id: nanoid(),
      dadosCheckout: data,
      planoId: plano.id,
      tenantSlug,
      tenantDomain,
      asaasCustomerId: customer.data.id,
      asaasPaymentId: payment.data.id,
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

    return {
      success: true,
      data: {
        checkoutId: checkoutSession.id,
        paymentData: payment.data,
        customerData: customer.data,
        message: "Pagamento criado com sucesso! Complete o pagamento para ativar sua conta.",
      },
    };
  } catch (error) {
    console.error("Erro ao processar checkout:", error);
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
      where: { email: email },
    });

    const existingUser = await prisma.usuario.findFirst({
      where: { email: email },
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
