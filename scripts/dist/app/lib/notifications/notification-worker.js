"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationWorker = void 0;
exports.getNotificationWorker = getNotificationWorker;
exports.startNotificationWorker = startNotificationWorker;
exports.stopNotificationWorker = stopNotificationWorker;
const bullmq_1 = require("bullmq");
const redis_config_1 = require("./redis-config");
const notification_service_1 = require("./notification-service");
/**
 * Worker para processar notificações de forma assíncrona
 */
class NotificationWorker {
    constructor() {
        this.worker = new bullmq_1.Worker("notifications", this.processNotificationJob.bind(this), {
            connection: redis_config_1.bullMQConfig.connection,
            concurrency: 10,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        });
        this.setupEventHandlers();
    }
    /**
     * Processa job de notificação
     */
    async processNotificationJob(job) {
        const { type, tenantId, userId, payload, urgency, channels } = job.data;
        console.log(`[NotificationWorker] Processing job ${job.id}: ${type} for user ${userId}`);
        try {
            // Publicar notificação usando o método síncrono
            await notification_service_1.NotificationService.processNotificationSync({
                type,
                tenantId,
                userId,
                payload,
                urgency,
                channels,
            });
            console.log(`[NotificationWorker] Job ${job.id} completed successfully`);
        }
        catch (error) {
            console.error(`[NotificationWorker] Job ${job.id} failed:`, error);
            throw error; // Re-throw para que o BullMQ possa fazer retry
        }
    }
    /**
     * Configura event handlers do worker
     */
    setupEventHandlers() {
        this.worker.on("completed", (job) => {
            console.log(`[NotificationWorker] Job ${job.id} completed`);
        });
        this.worker.on("failed", (job, err) => {
            console.error(`[NotificationWorker] Job ${job?.id} failed:`, err);
        });
        this.worker.on("error", (err) => {
            console.error("[NotificationWorker] Worker error:", err);
        });
        this.worker.on("ready", () => {
            console.log("[NotificationWorker] Worker ready");
        });
    }
    /**
     * Inicia o worker
     */
    async start() {
        console.log("[NotificationWorker] Starting worker...");
        // Worker já inicia automaticamente quando criado
    }
    /**
     * Para o worker
     */
    async stop() {
        console.log("[NotificationWorker] Stopping worker...");
        await this.worker.close();
    }
    /**
     * Obtém estatísticas do worker
     */
    async getStats() {
        // Worker não tem acesso direto à queue, retornar stats básicos
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
        };
    }
}
exports.NotificationWorker = NotificationWorker;
// Singleton do worker
let notificationWorker = null;
/**
 * Obtém instância do worker (singleton)
 */
function getNotificationWorker() {
    if (!notificationWorker) {
        notificationWorker = new NotificationWorker();
    }
    return notificationWorker;
}
/**
 * Inicia o worker de notificações
 */
async function startNotificationWorker() {
    const worker = getNotificationWorker();
    await worker.start();
}
/**
 * Para o worker de notificações
 */
async function stopNotificationWorker() {
    if (notificationWorker) {
        await notificationWorker.stop();
        notificationWorker = null;
    }
}
