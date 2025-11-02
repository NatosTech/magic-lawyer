"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullMQConfig = void 0;
exports.createRedisConnection = createRedisConnection;
exports.testRedisConnection = testRedisConnection;
const ioredis_1 = __importDefault(require("ioredis"));
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
        return new ioredis_1.default(redisUrl, {
            tls: {
                rejectUnauthorized: false,
            },
            maxRetriesPerRequest: null, // Necessário para BullMQ
            lazyConnect: true,
        });
    }
    // Configuração para desenvolvimento local
    return new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null, // Necessário para BullMQ
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
    }
    catch (error) {
        console.error("Redis connection failed:", error);
        return false;
    }
}
/**
 * Configuração BullMQ
 * Usa singleton para reutilizar conexão Redis
 */
exports.bullMQConfig = {
    get connection() {
        const { getRedisInstance } = require("./redis-singleton");
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
