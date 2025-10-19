"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
import { AsaasClient, createAsaasClientFromEncrypted, encryptAsaasCredentials, validateAsaasApiKey, formatCpfCnpjForAsaas, formatValueForAsaas, formatDateForAsaas } from "@/lib/asaas";
import { revalidatePath } from "next/cache";

// ============================================
// CONFIGURAÇÃO ASAAS POR TENANT
// ============================================

export async function configurarAsaasTenant(data: { asaasApiKey: string; asaasAccountId: string; asaasWalletId?: string; ambiente: "SANDBOX" | "PRODUCAO" }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;
    if (user.role !== "ADMIN") {
      return { success: false, error: "Apenas administradores podem configurar Asaas" };
    }

    // Validar API key
    if (!validateAsaasApiKey(data.asaasApiKey)) {
      return { success: false, error: "API key do Asaas inválida" };
    }

    // Testar conexão com Asaas
    const asaasClient = new AsaasClient(data.asaasApiKey, data.ambiente.toLowerCase() as "sandbox" | "production");
    const connectionTest = await asaasClient.testConnection();

    if (!connectionTest) {
      return { success: false, error: "Falha na conexão com Asaas. Verifique suas credenciais." };
    }

    // Criptografar API key
    const encryptedApiKey = encryptAsaasCredentials(data.asaasApiKey);

    // Salvar configuração
    const config = await prisma.tenantAsaasConfig.upsert({
      where: { tenantId: user.tenantId },
      update: {
        asaasApiKey: encryptedApiKey,
        asaasAccountId: data.asaasAccountId,
        asaasWalletId: data.asaasWalletId,
        ambiente: data.ambiente,
        integracaoAtiva: true,
        ultimaValidacao: new Date(),
        updatedAt: new Date(),
      },
      create: {
        tenantId: user.tenantId,
        asaasApiKey: encryptedApiKey,
        asaasAccountId: data.asaasAccountId,
        asaasWalletId: data.asaasWalletId,
        ambiente: data.ambiente,
        integracaoAtiva: true,
        ultimaValidacao: new Date(),
      },
    });

    revalidatePath("/configuracoes/asaas");

    return {
      success: true,
      data: {
        id: config.id,
        ambiente: config.ambiente,
        integracaoAtiva: config.integracaoAtiva,
        dataConfiguracao: config.dataConfiguracao,
      },
    };
  } catch (error) {
    console.error("Erro ao configurar Asaas:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function testarConexaoAsaas() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    const config = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!config) {
      return { success: false, error: "Configuração Asaas não encontrada" };
    }

    const asaasClient = createAsaasClientFromEncrypted(config.asaasApiKey, config.ambiente.toLowerCase() as "sandbox" | "production");
    const connectionTest = await asaasClient.testConnection();

    if (connectionTest) {
      // Atualizar última validação
      await prisma.tenantAsaasConfig.update({
        where: { id: config.id },
        data: { ultimaValidacao: new Date() },
      });
    }

    return {
      success: connectionTest,
      data: {
        conectado: connectionTest,
        ultimaValidacao: connectionTest ? new Date() : config.ultimaValidacao,
      },
    };
  } catch (error) {
    console.error("Erro ao testar conexão Asaas:", error);
    return { success: false, error: "Erro ao testar conexão" };
  }
}

export async function obterConfiguracaoAsaas() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    const config = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!config) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: config.id,
        ambiente: config.ambiente,
        integracaoAtiva: config.integracaoAtiva,
        dataConfiguracao: config.dataConfiguracao,
        ultimaValidacao: config.ultimaValidacao,
        // Não retornar API key por segurança
      },
    };
  } catch (error) {
    console.error("Erro ao obter configuração Asaas:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ============================================
// ASSINATURAS
// ============================================

export async function criarAssinatura(data: {
  planoId: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX";
  customerData: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
  };
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar plano
    const plano = await prisma.plano.findUnique({
      where: { id: data.planoId },
    });

    if (!plano) {
      return { success: false, error: "Plano não encontrado" };
    }

    // Buscar configuração Asaas
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Criar cliente no Asaas
    const asaasCustomer = await asaasClient.createCustomer({
      name: data.customerData.name,
      email: data.customerData.email,
      cpfCnpj: formatCpfCnpjForAsaas(data.customerData.cpfCnpj),
      phone: data.customerData.phone,
      mobilePhone: data.customerData.phone,
      postalCode: data.customerData.postalCode,
      address: data.customerData.address,
      addressNumber: data.customerData.addressNumber,
      complement: data.customerData.complement,
      province: data.customerData.province,
      city: data.customerData.city,
      state: data.customerData.state,
      country: "Brasil",
    });

    // Criar assinatura no Asaas
    const asaasSubscription = await asaasClient.createSubscription({
      customer: asaasCustomer.id!,
      billingType: data.billingType,
      value: formatValueForAsaas(Number(plano.valorMensal || 0)),
      nextDueDate: formatDateForAsaas(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 dias
      cycle: "MONTHLY",
      description: `Assinatura Magic Lawyer - ${plano.nome}`,
      externalReference: `tenant_${user.tenantId}`,
    });

    // Criar assinatura no banco
    const subscription = await prisma.tenantSubscription.upsert({
      where: { tenantId: user.tenantId },
      update: {
        planoId: plano.id,
        status: "ATIVA",
        asaasCustomerId: asaasCustomer.id,
        asaasSubscriptionId: asaasSubscription.id,
        dataInicio: new Date(),
        trialEndsAt: new Date(Date.now() + plano.periodoTeste * 24 * 60 * 60 * 1000),
        metadata: {
          billingType: data.billingType,
          customerData: data.customerData,
        },
        updatedAt: new Date(),
      },
      create: {
        tenantId: user.tenantId,
        planoId: plano.id,
        status: "TRIAL",
        asaasCustomerId: asaasCustomer.id,
        asaasSubscriptionId: asaasSubscription.id,
        dataInicio: new Date(),
        trialEndsAt: new Date(Date.now() + plano.periodoTeste * 24 * 60 * 60 * 1000),
        metadata: {
          billingType: data.billingType,
          customerData: data.customerData,
        },
      },
    });

    revalidatePath("/precos");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        asaasSubscriptionId: asaasSubscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
      },
    };
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return { success: false, error: "Erro ao criar assinatura" };
  }
}

export async function cancelarAssinatura() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar assinatura atual
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId: user.tenantId },
      include: { plano: true },
    });

    if (!subscription || !subscription.asaasSubscriptionId) {
      return { success: false, error: "Assinatura não encontrada" };
    }

    // Buscar configuração Asaas
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig) {
      return { success: false, error: "Configuração Asaas não encontrada" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Cancelar assinatura no Asaas
    await asaasClient.deleteSubscription(subscription.asaasSubscriptionId);

    // Atualizar status no banco
    await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELADA",
        dataFim: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/precos");
    revalidatePath("/dashboard");

    return { success: true, data: { status: "CANCELADA" } };
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return { success: false, error: "Erro ao cancelar assinatura" };
  }
}

export async function obterAssinaturaAtual() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId: user.tenantId },
      include: { plano: true },
    });

    if (!subscription) {
      return { success: true, data: null };
    }

    // Converter campos Decimal para number
    const convertedSubscription = convertAllDecimalFields(subscription);

    // Serialização JSON explícita
    const serializedSubscription = JSON.parse(JSON.stringify(convertedSubscription));

    return {
      success: true,
      data: {
        id: serializedSubscription.id,
        status: serializedSubscription.status,
        dataInicio: serializedSubscription.dataInicio,
        dataFim: serializedSubscription.dataFim,
        trialEndsAt: serializedSubscription.trialEndsAt,
        plano: serializedSubscription.plano
          ? {
              id: serializedSubscription.plano.id,
              nome: serializedSubscription.plano.nome,
              valorMensal: serializedSubscription.plano.valorMensal,
              periodoTeste: serializedSubscription.plano.periodoTeste,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Erro ao obter assinatura:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ============================================
// PLANOS
// ============================================

export async function obterPlanos() {
  try {
    const planos = await prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { valorMensal: "asc" },
    });

    // Converter campos Decimal para number
    const convertedPlanos = planos.map((plano) => convertAllDecimalFields(plano));

    // Serialização JSON explícita para garantir que não há objetos Decimal
    const serializedPlanos = JSON.parse(JSON.stringify(convertedPlanos));

    return {
      success: true,
      data: serializedPlanos,
    };
  } catch (error) {
    console.error("Erro ao obter planos:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}
