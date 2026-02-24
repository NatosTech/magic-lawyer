#!/usr/bin/env node

/**
 * Worker assíncrono para produção (Railway)
 * Este arquivo inicializa os workers de notificação e sincronização de processos.
 */

import { getNotificationWorker } from "@/app/lib/notifications/notification-worker";
import { getPortalProcessSyncWorker } from "@/app/lib/juridical/process-sync-worker";
import { testRedisConnection } from "@/app/lib/notifications/redis-config";

async function main() {
  console.log("🚀 Iniciando Workers Assíncronos (Produção)...");

  try {
    console.log("📡 Testando conexão Redis...");
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      console.error("❌ Falha na conexão Redis. Verifique a variável REDIS_URL");
      process.exit(1);
    }

    console.log("✅ Conexão Redis OK");

    console.log("👷 Iniciando workers...");
    const notificationWorker = getNotificationWorker();
    const processSyncWorker = getPortalProcessSyncWorker();

    console.log("✅ Workers iniciados com sucesso!");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Parando worker...");
      await processSyncWorker.stop();
      await notificationWorker.stop();
      console.log("✅ Workers parados");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Parando worker...");
      await processSyncWorker.stop();
      await notificationWorker.stop();
      console.log("✅ Workers parados");
      process.exit(0);
    });

    // Heartbeat
    setInterval(() => {
      console.log("💓 Workers ativos...");
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
