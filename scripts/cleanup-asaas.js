#!/usr/bin/env node

/**
 * Script para limpeza automática do sandbox do Asaas
 * Remove todos os clientes e cobranças que não existem no banco de dados
 * Atualiza automaticamente o webhook com a nova URL do ngrok
 */

const { PrismaClient } = require("../app/generated/prisma");
const axios = require("axios");

const prisma = new PrismaClient();

// Configurações do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY?.replace(/^\\/, ""); // Remove contrabarra se existir
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || "https://sandbox.asaas.com/api/v3";

if (!ASAAS_API_KEY) {
  console.log("⚠️  ASAAS_API_KEY não encontrada no .env - continuando sem limpeza do Asaas");
}

/**
 * Obtém a URL atual do ngrok
 */
async function getNgrokUrl() {
  try {
    const response = await axios.get("http://localhost:4040/api/tunnels");
    const tunnels = response.data.tunnels;

    if (tunnels && tunnels.length > 0) {
      const httpsTunnel = tunnels.find((t) => t.proto === "https");
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      }
    }

    console.log("⚠️  Ngrok não encontrado ou não está rodando");
    return null;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log("⚠️  Ngrok não está rodando - execute 'ngrok http 9192' em outro terminal");
    } else {
      console.log("⚠️  Não foi possível obter URL do ngrok:", error.message);
    }
    return null;
  }
}

/**
 * Lista webhooks existentes no Asaas
 */
async function getExistingWebhooks() {
  if (!ASAAS_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(`${ASAAS_BASE_URL}/webhooks`, {
      headers: {
        access_token: ASAAS_API_KEY,
      },
    });

    return response.data.data || [];
  } catch (error) {
    if (error.response?.data?.errors?.[0]?.code === "invalid_access_token") {
      console.log("⚠️  ASAAS_API_KEY inválida - pulando busca de webhooks");
    } else {
      console.error("❌ Erro ao buscar webhooks:", error.response?.data || error.message);
    }
    return [];
  }
}

/**
 * Atualiza um webhook existente no Asaas
 */
async function updateExistingWebhook(webhookId, ngrokUrl) {
  if (!ASAAS_API_KEY) {
    return false;
  }

  try {
    const webhookUrl = `${ngrokUrl}/api/webhooks/asaas`;

    console.log(`🔄 Atualizando webhook existente (ID: ${webhookId}) para: ${webhookUrl}`);

    const response = await axios.put(
      `${ASAAS_BASE_URL}/webhooks/${webhookId}`,
      {
        url: webhookUrl,
        email: "webhook@magiclawyer.com",
        enabled: true,
        events: [
          "PAYMENT_CREATED",
          "PAYMENT_RECEIVED",
          "PAYMENT_OVERDUE",
          "PAYMENT_DELETED",
          "PAYMENT_RESTORED",
          "PAYMENT_REFUNDED",
          "PAYMENT_RECEIVED_IN_CASH_UNDONE",
          "PAYMENT_CHARGEBACK_REQUESTED",
          "PAYMENT_CHARGEBACK_DISPUTE",
          "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
          "PAYMENT_DUNNING_RECEIVED",
          "PAYMENT_DUNNING_REQUESTED",
          "PAYMENT_BANK_SLIP_VIEWED",
          "PAYMENT_CHECKOUT_VIEWED",
        ],
      },
      {
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Webhook atualizado com sucesso!");
    console.log(`   URL: ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao atualizar webhook:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Cria um novo webhook no Asaas
 */
async function createNewWebhook(ngrokUrl) {
  if (!ASAAS_API_KEY) {
    return false;
  }

  try {
    const webhookUrl = `${ngrokUrl}/api/webhooks/asaas`;

    console.log(`🔄 Criando novo webhook para: ${webhookUrl}`);

    const response = await axios.post(
      `${ASAAS_BASE_URL}/webhooks`,
      {
        url: webhookUrl,
        email: "webhook@magiclawyer.com",
        enabled: true,
        events: [
          "PAYMENT_CREATED",
          "PAYMENT_RECEIVED",
          "PAYMENT_OVERDUE",
          "PAYMENT_DELETED",
          "PAYMENT_RESTORED",
          "PAYMENT_REFUNDED",
          "PAYMENT_RECEIVED_IN_CASH_UNDONE",
          "PAYMENT_CHARGEBACK_REQUESTED",
          "PAYMENT_CHARGEBACK_DISPUTE",
          "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
          "PAYMENT_DUNNING_RECEIVED",
          "PAYMENT_DUNNING_REQUESTED",
          "PAYMENT_BANK_SLIP_VIEWED",
          "PAYMENT_CHECKOUT_VIEWED",
        ],
      },
      {
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Webhook criado com sucesso!");
    console.log(`   URL: ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao criar webhook:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Atualiza o webhook do Asaas
 */
async function updateWebhook(ngrokUrl) {
  if (!ngrokUrl) {
    console.log("⚠️  Pulando atualização do webhook - ngrok não disponível");
    return;
  }

  if (!ASAAS_API_KEY) {
    console.log("⚠️  Pulando atualização do webhook - ASAAS_API_KEY não configurada");
    return;
  }

  try {
    console.log("🔍 Verificando webhooks existentes...");

    // 1. Listar webhooks existentes
    const existingWebhooks = await getExistingWebhooks();

    if (existingWebhooks.length > 0) {
      console.log(`📋 Encontrados ${existingWebhooks.length} webhook(s) existente(s)`);

      // 2. Atualizar o primeiro webhook encontrado
      const webhookToUpdate = existingWebhooks[0];
      console.log(`📝 Webhook atual: ${webhookToUpdate.url}`);

      const success = await updateExistingWebhook(webhookToUpdate.id, ngrokUrl);
      if (success) {
        console.log("✅ Webhook atualizado com sucesso!");
      }
    } else {
      console.log("📋 Nenhum webhook encontrado, criando novo...");

      // 3. Criar novo webhook se não existir nenhum
      const success = await createNewWebhook(ngrokUrl);
      if (success) {
        console.log("✅ Novo webhook criado com sucesso!");
      }
    }
  } catch (error) {
    console.error("❌ Erro durante atualização do webhook:", error.message);
  }
}

/**
 * Obtém todos os clientes do Asaas
 */
async function getAsaasCustomers() {
  if (!ASAAS_API_KEY) {
    console.log("⚠️  ASAAS_API_KEY não configurada - pulando busca de clientes");
    return [];
  }

  try {
    const response = await axios.get(`${ASAAS_BASE_URL}/customers`, {
      headers: {
        access_token: ASAAS_API_KEY,
      },
    });

    return response.data.data || [];
  } catch (error) {
    if (error.response?.data?.errors?.[0]?.code === "invalid_access_token") {
      console.log("⚠️  ASAAS_API_KEY inválida - pulando busca de clientes");
    } else {
      console.error("❌ Erro ao buscar clientes do Asaas:", error.response?.data || error.message);
    }
    return [];
  }
}

/**
 * Obtém todas as cobranças de um cliente
 */
async function getCustomerCharges(customerId) {
  if (!ASAAS_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(`${ASAAS_BASE_URL}/payments?customer=${customerId}`, {
      headers: {
        access_token: ASAAS_API_KEY,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Erro ao buscar cobranças do cliente ${customerId}:`, error.response?.data || error.message);
    return [];
  }
}

/**
 * Remove um cliente do Asaas
 */
async function deleteAsaasCustomer(customerId) {
  if (!ASAAS_API_KEY) {
    return false;
  }

  try {
    await axios.delete(`${ASAAS_BASE_URL}/customers/${customerId}`, {
      headers: {
        access_token: ASAAS_API_KEY,
      },
    });

    console.log(`✅ Cliente ${customerId} removido do Asaas`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao remover cliente ${customerId}:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Remove uma cobrança do Asaas
 */
async function deleteAsaasCharge(chargeId) {
  if (!ASAAS_API_KEY) {
    return false;
  }

  try {
    await axios.delete(`${ASAAS_BASE_URL}/payments/${chargeId}`, {
      headers: {
        access_token: ASAAS_API_KEY,
      },
    });

    console.log(`✅ Cobrança ${chargeId} removida do Asaas`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao remover cobrança ${chargeId}:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Obtém todos os clientes do banco de dados
 */
async function getDatabaseCustomers() {
  try {
    const customers = await prisma.cliente.findMany({
      where: {
        deletedAt: null,
        asaasCustomerId: {
          not: null,
        },
      },
      select: {
        id: true,
        asaasCustomerId: true,
        nome: true,
      },
    });

    return customers;
  } catch (error) {
    console.error("❌ Erro ao buscar clientes do banco:", error.message);
    return [];
  }
}

/**
 * Limpa o sandbox do Asaas
 */
async function cleanupAsaasSandbox() {
  console.log("🧹 Iniciando limpeza do sandbox do Asaas...");

  // 1. Obter clientes do banco
  console.log("📋 Buscando clientes no banco de dados...");
  const dbCustomers = await getDatabaseCustomers();
  const dbCustomerIds = new Set(dbCustomers.map((c) => c.asaasCustomerId).filter(Boolean));

  console.log(`📊 Encontrados ${dbCustomers.length} clientes no banco com ID do Asaas`);

  // 2. Obter clientes do Asaas
  console.log("📋 Buscando clientes no Asaas...");
  const asaasCustomers = await getAsaasCustomers();

  console.log(`📊 Encontrados ${asaasCustomers.length} clientes no Asaas`);

  // 3. Identificar clientes órfãos (existem no Asaas mas não no banco)
  const orphanCustomers = asaasCustomers.filter((customer) => !dbCustomerIds.has(customer.id));

  console.log(`🗑️  Encontrados ${orphanCustomers.length} clientes órfãos para remover`);

  // 4. Remover cobranças e clientes órfãos
  let removedCustomers = 0;
  let removedCharges = 0;

  for (const customer of orphanCustomers) {
    console.log(`\n🔄 Processando cliente órfão: ${customer.name} (${customer.id})`);

    // Remover todas as cobranças do cliente
    const charges = await getCustomerCharges(customer.id);
    console.log(`   📄 Encontradas ${charges.length} cobranças para remover`);

    for (const charge of charges) {
      if (await deleteAsaasCharge(charge.id)) {
        removedCharges++;
      }
    }

    // Remover o cliente
    if (await deleteAsaasCustomer(customer.id)) {
      removedCustomers++;
    }
  }

  console.log(`\n✅ Limpeza concluída!`);
  console.log(`   🗑️  Clientes removidos: ${removedCustomers}`);
  console.log(`   🗑️  Cobranças removidas: ${removedCharges}`);
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log("🚀 Iniciando limpeza automática do Asaas...\n");

    // 1. Atualizar webhook com URL do ngrok
    const ngrokUrl = await getNgrokUrl();
    await updateWebhook(ngrokUrl || "");

    console.log("\n" + "=".repeat(50) + "\n");

    // 2. Limpar sandbox
    await cleanupAsaasSandbox();

    console.log("\n🎉 Limpeza automática concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, cleanupAsaasSandbox, updateWebhook };
