"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationQueue = void 0;
exports.getNotificationQueue = getNotificationQueue;
const bullmq_1 = require("bullmq");
const redis_config_1 = require("./redis-config");
/**
 * Queue para adicionar jobs de notificação
 */
class NotificationQueue {
    constructor() {
        this.queue = new bullmq_1.Queue("notifications", {
            connection: redis_config_1.bullMQConfig.connection,
            defaultJobOptions: redis_config_1.bullMQConfig.defaultJobOptions,
        });
    }
    /**
     * Adiciona job de notificação à fila
     * @param priority Prioridade opcional (se não fornecida, calcula baseado na urgência)
     */
    async addNotificationJob(data, priority) {
        try {
            const jobPriority = priority ?? this.getPriority(data.urgency);
            const job = await this.queue.add("notification", data, {
                priority: jobPriority,
                delay: 0,
            });
            console.log(`[NotificationQueue] Job ${job.id} added to queue: ${data.type} (priority: ${jobPriority})`);
        }
        catch (error) {
            console.error("[NotificationQueue] Failed to add job:", error);
            throw error;
        }
    }
    /**
     * Adiciona job com delay (para notificações agendadas)
     */
    async addScheduledNotificationJob(data, delayMs) {
        try {
            const job = await this.queue.add("scheduled-notification", data, {
                priority: this.getPriority(data.urgency),
                delay: delayMs,
            });
            console.log(`[NotificationQueue] Scheduled job ${job.id} added: ${data.type} (delay: ${delayMs}ms)`);
        }
        catch (error) {
            console.error("[NotificationQueue] Failed to add scheduled job:", error);
            throw error;
        }
    }
    /**
     * Adiciona job recorrente (para cron jobs)
     */
    async addRecurringNotificationJob(data, cronPattern) {
        try {
            const job = await this.queue.add("recurring-notification", data, {
                priority: this.getPriority(data.urgency),
                repeat: { pattern: cronPattern },
                removeOnComplete: 10,
                removeOnFail: 5,
            });
            console.log(`[NotificationQueue] Recurring job ${job.id} added: ${data.type} (cron: ${cronPattern})`);
        }
        catch (error) {
            console.error("[NotificationQueue] Failed to add recurring job:", error);
            throw error;
        }
    }
    /**
     * Converte urgência em prioridade do BullMQ
     */
    getPriority(urgency) {
        switch (urgency) {
            case "CRITICAL":
                return 1; // Maior prioridade
            case "HIGH":
                return 2;
            case "MEDIUM":
                return 3;
            case "INFO":
                return 4;
            default:
                return 3;
        }
    }
    /**
     * Obtém estatísticas da fila
     */
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaiting(),
            this.queue.getActive(),
            this.queue.getCompleted(),
            this.queue.getFailed(),
            this.queue.getDelayed(),
        ]);
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
        };
    }
    /**
     * Limpa jobs antigos
     */
    async cleanOldJobs() {
        await this.queue.clean(24 * 60 * 60 * 1000, 100, "completed"); // 24h
        await this.queue.clean(7 * 24 * 60 * 60 * 1000, 50, "failed"); // 7 dias
    }
    /**
     * Pausa a fila
     */
    async pause() {
        await this.queue.pause();
    }
    /**
     * Resume a fila
     */
    async resume() {
        await this.queue.resume();
    }
    /**
     * Fecha a conexão da fila
     */
    async close() {
        await this.queue.close();
    }
}
exports.NotificationQueue = NotificationQueue;
// Singleton da queue
let notificationQueue = null;
/**
 * Obtém instância da queue (singleton)
 */
function getNotificationQueue() {
    if (!notificationQueue) {
        notificationQueue = new NotificationQueue();
    }
    return notificationQueue;
}
