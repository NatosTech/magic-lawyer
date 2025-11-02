import Redis from "ioredis";

import { getRedisInstance } from "./redis-singleton";

/**
 * Configuração Redis para BullMQ
 * Suporta desenvolvimento local e produção Vercel
 */
export function createRedisConnection(): Redis {
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
      maxRetriesPerRequest: null, // Necessário para BullMQ
      lazyConnect: true,
    });
  }

  // Configuração para desenvolvimento local
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Necessário para BullMQ
    lazyConnect: true,
  });
}

/**
 * Testa conexão Redis
 */
export async function testRedisConnection(): Promise<boolean> {
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
 * Usa singleton para reutilizar conexão Redis
 */
export const bullMQConfig = {
  get connection() {
    return getRedisInstance();
  },
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
