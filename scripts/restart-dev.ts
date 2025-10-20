#!/usr/bin/env ts-node

/**
 * Script para reiniciar o ambiente de desenvolvimento
 * Para e reinicia Next.js e ngrok sem resetar o banco de dados
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Tipos para o ngrok
interface NgrokTunnel {
  name: string;
  uri: string;
  public_url: string;
  proto: string;
  config: {
    addr: string;
    inspect: boolean;
  };
  metrics: {
    conns: {
      count: number;
      gauge: number;
      rate1: number;
      rate5: number;
      rate15: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
    http: {
      count: number;
      rate1: number;
      rate5: number;
      rate15: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
}

interface NgrokResponse {
  tunnels: NgrokTunnel[];
  uri: string;
}

/**
 * Mata processos específicos
 */
function killProcesses(): void {
  console.log("🛑 Parando processos...");

  try {
    // Matar processos do Next.js
    execSync('pkill -f "next dev" || true', { stdio: "inherit" });

    // Matar processos do ngrok
    execSync('pkill -f "ngrok" || true', { stdio: "inherit" });

    // Matar processos do Node relacionados ao magic-lawyer
    execSync('pkill -f "node.*magic-lawyer" || true', { stdio: "inherit" });

    console.log("✅ Processos parados com sucesso");
  } catch (error: any) {
    console.log("⚠️  Alguns processos podem não ter sido encontrados");
  }
}

/**
 * Aguarda um tempo para garantir que os processos foram finalizados
 */
function waitForProcesses(): Promise<void> {
  console.log("⏳ Aguardando finalização dos processos...");
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}

/**
 * Inicia o Next.js em background
 */
function startNext() {
  console.log("🚀 Iniciando Next.js...");

  const nextProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    detached: true,
  });

  nextProcess.unref();

  console.log("✅ Next.js iniciado");
  return nextProcess;
}

/**
 * Inicia o ngrok em background
 */
function startNgrok() {
  console.log("🌐 Iniciando ngrok...");

  const ngrokProcess = spawn("ngrok", ["http", "9192"], {
    stdio: "inherit",
    detached: true,
  });

  ngrokProcess.unref();

  console.log("✅ Ngrok iniciado");
  return ngrokProcess;
}

/**
 * Aguarda o ngrok estar disponível e retorna a URL
 */
async function waitForNgrok(): Promise<string | null> {
  console.log("⏳ Aguardando ngrok estar disponível...");

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get("http://localhost:4040/api/tunnels");
      const tunnels = response.data.tunnels;

      if (tunnels && tunnels.length > 0) {
        const httpsTunnel = tunnels.find((t: any) => t.proto === "https");
        if (httpsTunnel) {
          console.log(`✅ Ngrok disponível: ${httpsTunnel.public_url}`);
          return httpsTunnel.public_url;
        }
      }
    } catch (error: any) {
      // Ngrok ainda não está disponível
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("⚠️  Ngrok não ficou disponível no tempo esperado");
  return null;
}

/**
 * Lista webhooks existentes no Asaas
 */
async function getExistingWebhooks(): Promise<any[]> {
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || "https://sandbox.asaas.com/api/v3";

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
  } catch (error: any) {
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
async function updateExistingWebhook(webhookId: string, ngrokUrl: string): Promise<boolean> {
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || "https://sandbox.asaas.com/api/v3";

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
          "PAYMENT_AWAITING_PAYMENT",
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
  } catch (error: any) {
    console.error("❌ Erro ao atualizar webhook:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Cria um novo webhook no Asaas
 */
async function createNewWebhook(ngrokUrl: string): Promise<boolean> {
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || "https://sandbox.asaas.com/api/v3";

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
          "PAYMENT_AWAITING_PAYMENT",
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
  } catch (error: any) {
    console.error("❌ Erro ao criar webhook:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Atualiza o webhook do Asaas com a nova URL
 */
async function updateAsaasWebhook(ngrokUrl: string): Promise<void> {
  if (!ngrokUrl) {
    console.log("⚠️  Pulando atualização do webhook - ngrok não disponível");
    return;
  }

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
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
  } catch (error: any) {
    console.error("❌ Erro durante atualização do webhook:", error.message);
  }
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  try {
    console.log("🔄 Reiniciando ambiente de desenvolvimento...\n");

    // 1. Parar processos
    killProcesses();

    // 2. Aguardar finalização
    await waitForProcesses();

    // 3. Iniciar Next.js
    startNext();

    // 4. Aguardar um pouco para o Next.js inicializar
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 5. Iniciar ngrok
    startNgrok();

    // 6. Aguardar ngrok estar disponível
    const ngrokUrl = await waitForNgrok();

    // 7. Atualizar webhook do Asaas
    if (ngrokUrl) {
      await updateAsaasWebhook(ngrokUrl);
    }

    console.log("\n🎉 Ambiente de desenvolvimento reiniciado com sucesso!");
    console.log(`🌐 URL do ngrok: ${ngrokUrl || "Não disponível"}`);
    console.log("🚀 Next.js rodando em: http://localhost:9192");
  } catch (error: any) {
    console.error("❌ Erro durante o reinício:", error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
