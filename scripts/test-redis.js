#!/usr/bin/env node

/**
 * Script simples para testar conexão Redis
 * Uso: npm run notifications:test
 */

require('dotenv').config();
const Redis = require("ioredis");

async function testRedis() {
  console.log("🚀 Testando Conexão Redis...");

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.error("❌ REDIS_URL não encontrada nas variáveis de ambiente");
    console.log("💡 Configure REDIS_URL no .env.local ou no Vercel");
    process.exit(1);
  }

  console.log("📡 Conectando ao Redis:", redisUrl.replace(/\/\/.*@/, "//***:***@"));

  try {
    const redis = new Redis(redisUrl, {
      tls: redisUrl.startsWith("rediss://")
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Testar conexão
    const pong = await redis.ping();
    console.log("✅ Redis conectado:", pong);

    // Testar operações básicas
    await redis.set("test:connection", "ok");
    const value = await redis.get("test:connection");
    console.log("✅ Teste de escrita/leitura:", value);

    await redis.del("test:connection");
    console.log("✅ Teste de limpeza: OK");

    await redis.disconnect();
    console.log("🎉 Redis funcionando perfeitamente!");
  } catch (error) {
    console.error("❌ Erro ao conectar Redis:", error.message);
    process.exit(1);
  }
}

testRedis().catch(console.error);
