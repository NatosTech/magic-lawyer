/**
 * Script de teste para publicação manual no Ably
 *
 * Execução: npx tsx scripts/test-realtime.ts
 */

import Ably from "ably/promises";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env" });

async function testPublish() {
  console.log("🚀 Iniciando teste de publicação no Ably...\n");

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.error("❌ ABLY_API_KEY não encontrada no .env");
    process.exit(1);
  }

  const tenantId = process.argv[2] || "test-tenant-id";
  const channelPrefix = process.env.REALTIME_CHANNEL_PREFIX || "ml-dev";

  console.log("📋 Configuração:");
  console.log(`   - API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`   - Tenant ID: ${tenantId}`);
  console.log(`   - Channel Prefix: ${channelPrefix}\n`);

  try {
    // Criar cliente
    const client = new Ably.Realtime({ key: apiKey });
    console.log("✅ Cliente Ably criado");

    // Aguardar conexão
    await new Promise<void>((resolve, reject) => {
      client.connection.once("connected", () => {
        console.log("✅ Conectado ao Ably\n");
        resolve();
      });

      client.connection.once("failed", (stateChange) => {
        console.error("❌ Conexão falhou:", stateChange);
        reject(stateChange);
      });

      setTimeout(() => reject(new Error("Timeout na conexão")), 5000);
    });

    // Pegar canal
    const channelName = `${channelPrefix}:tenant:${tenantId}`;
    const channel = client.channels.get(channelName);
    console.log(`📡 Canal: ${channelName}`);

    // Publicar evento de teste
    const event = {
      type: "plan-update",
      tenantId: tenantId,
      userId: null,
      payload: {
        planId: "test-plan",
        planRevision: 2,
        message: "Teste manual do sistema realtime",
      },
      timestamp: new Date().toISOString(),
      version: 2,
    };

    console.log("\n📤 Publicando evento...");
    console.log(JSON.stringify(event, null, 2));

    await new Promise<void>((resolve, reject) => {
      channel.publish("plan-update", event, (err) => {
        if (err) {
          console.error("❌ Erro ao publicar:", err);
          reject(err);
        } else {
          console.log("\n✅ Evento publicado com sucesso!");
          console.log("\n👀 Verifique o console do navegador para ver se foi recebido");
          resolve();
        }
      });
    });

    // Aguardar um pouco antes de fechar
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fechar conexão
    client.close();
    console.log("\n✅ Cliente desconectado");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro no teste:", error);
    process.exit(1);
  }
}

// Executar
testPublish();
