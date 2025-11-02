#!/usr/bin/env node

/**
 * Worker de Notificações para Produção (Railway)
 * Este é um arquivo TypeScript que será compilado pelo build
 */

import { getNotificationWorker } from "@/app/lib/notifications/notification-worker";
import { testRedisConnection } from "@/app/lib/notifications/redis-config";

async function main() {
  console.log("🚀 Iniciando Worker de Notificações (Produção)...");

  try {
    console.log("📡 Testando conexão Redis...");
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      console.error("❌ Falha na conexão Redis. Verifique a variável REDIS_URL");
      process.exit(1);
    }

    console.log("✅ Conexão Redis OK");

    console.log("👷 Iniciando worker...");
    const worker = getNotificationWorker();

    console.log("✅ Worker iniciado com sucesso!");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Parando worker...");
      await worker.stop();
      console.log("✅ Worker parado");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Parando worker...");
      await worker.stop();
      console.log("✅ Worker parado");
      process.exit(0);
    });

    // Heartbeat
    setInterval(() => {
      console.log("💓 Worker ativo...");
    }, 60_000);
  } catch (error) {
    console.error("❌ Erro ao iniciar worker:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erro inesperado no worker:", error);
  process.exit(1);
});

