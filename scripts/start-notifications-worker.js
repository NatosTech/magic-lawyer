#!/usr/bin/env node

/**
 * Script para iniciar o worker de notificações
 * Uso: npm run notifications:worker
 */

const { testRedisConnection } = require("./app/lib/notifications/redis-config.cjs");

async function main() {
  console.log("🚀 Iniciando Worker de Notificações...");

  try {
    // Testar conexão Redis
    console.log("📡 Testando conexão Redis...");
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      console.error("❌ Falha na conexão Redis. Verifique a variável REDIS_URL");
      process.exit(1);
    }

    console.log("✅ Conexão Redis OK");

    // Iniciar worker
    console.log("👷 Iniciando worker...");
    await startNotificationWorker();

    console.log("✅ Worker iniciado com sucesso!");
    console.log("📊 Monitoramento disponível em: /api/admin/notifications/worker");

    // Manter processo vivo
    process.on("SIGINT", async () => {
      console.log("\n🛑 Parando worker...");
      const { stopNotificationWorker } = require("./app/lib/notifications/notification-worker");
      await stopNotificationWorker();
      console.log("✅ Worker parado");
      process.exit(0);
    });

    // Manter processo vivo
    setInterval(() => {
      // Heartbeat
    }, 30000);
  } catch (error) {
    console.error("❌ Erro ao iniciar worker:", error);
    process.exit(1);
  }
}

main().catch(console.error);
