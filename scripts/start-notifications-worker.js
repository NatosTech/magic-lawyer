#!/usr/bin/env node

/**
 * Script para iniciar o worker de notificações.
 * Uso: npm run dev:worker
 */

require("dotenv").config();

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "CommonJS",
    moduleResolution: "Node",
    esModuleInterop: true,
    baseUrl: ".",
  },
});
require("tsconfig-paths/register");

const path = require("path");

async function main() {
  console.log("🚀 Iniciando Worker de Notificações...");

  try {
    const { testRedisConnection } = require(path.join(__dirname, "../app/lib/notifications/redis-config"));
    const { startNotificationWorker, stopNotificationWorker } = require(path.join(__dirname, "../app/lib/notifications/notification-worker"));

    console.log("📡 Testando conexão Redis...");
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      console.error("❌ Falha na conexão Redis. Verifique a variável REDIS_URL");
      process.exit(1);
    }

    console.log("✅ Conexão Redis OK");

    console.log("👷 Iniciando worker...");
    await startNotificationWorker();

    console.log("✅ Worker iniciado com sucesso!");
    console.log("📊 Monitoramento disponível em: /api/admin/notifications/worker");

    process.on("SIGINT", async () => {
      console.log("\n🛑 Parando worker...");
      await stopNotificationWorker();
      console.log("✅ Worker parado");
      process.exit(0);
    });

    setInterval(() => {
      // Heartbeat
    }, 30_000);
  } catch (error) {
    console.error("❌ Erro ao iniciar worker:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erro inesperado no worker:", error);
  process.exit(1);
});
