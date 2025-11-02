"use strict";
/**
 * Singleton de conexão Redis para evitar connection leaks
 * Reutiliza a mesma conexão em todas as operações
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisInstance = getRedisInstance;
exports.closeRedisConnection = closeRedisConnection;
const ioredis_1 = __importDefault(require("ioredis"));
let redisInstance = null;
/**
 * Obtém instância singleton do Redis
 */
function getRedisInstance() {
    if (!redisInstance) {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error("REDIS_URL environment variable is required");
        }
        // Configuração para Vercel Redis (Upstash)
        if (redisUrl.startsWith("rediss://")) {
            redisInstance = new ioredis_1.default(redisUrl, {
                tls: {
                    rejectUnauthorized: false,
                },
                maxRetriesPerRequest: null, // Necessário para BullMQ
                lazyConnect: true,
            });
        }
        else {
            // Configuração para desenvolvimento local
            redisInstance = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: null,
                lazyConnect: true,
            });
        }
        // Conectar se ainda não conectado
        if (redisInstance.status !== "ready") {
            redisInstance.connect().catch((err) => {
                console.error("[RedisSingleton] Erro ao conectar:", err);
            });
        }
    }
    return redisInstance;
}
/**
 * Fecha conexão Redis (apenas em shutdown)
 */
async function closeRedisConnection() {
    if (redisInstance) {
        await redisInstance.quit();
        redisInstance = null;
    }
}
