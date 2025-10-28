const Redis = require("ioredis");

/**
 * Configuração Redis para BullMQ
 * Suporta desenvolvimento local e produção Vercel
 */
function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  // Configuração para Vercel Redis (Upstash)
  if (redisUrl.startsWith("rediss://")) {
    return new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false,
      },
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  // Configuração para desenvolvimento local
  return new Redis(redisUrl, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

/**
 * Testa conexão Redis
 */
async function testRedisConnection() {
  try {
    const redis = createRedisConnection();
    await redis.ping();
    await redis.disconnect();
    return true;
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}

/**
 * Configuração BullMQ
 */
const bullMQConfig = {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

module.exports = {
  createRedisConnection,
  testRedisConnection,
  bullMQConfig,
};
