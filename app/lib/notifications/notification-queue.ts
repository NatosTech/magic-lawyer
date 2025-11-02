import type { NotificationJobData } from "./notification-worker";

import { Queue } from "bullmq";

import { bullMQConfig } from "./redis-config";

/**
 * Queue para adicionar jobs de notificação
 */
export class NotificationQueue {
  private queue: Queue<NotificationJobData>;

  constructor() {
    this.queue = new Queue<NotificationJobData>("notifications", {
      connection: bullMQConfig.connection,
      defaultJobOptions: bullMQConfig.defaultJobOptions,
    });
  }

  /**
   * Adiciona job de notificação à fila
   * @param priority Prioridade opcional (se não fornecida, calcula baseado na urgência)
   */
  async addNotificationJob(
    data: NotificationJobData,
    priority?: number,
  ): Promise<void> {
    try {
      const jobPriority = priority ?? this.getPriority(data.urgency);

      const job = await this.queue.add("notification", data, {
        priority: jobPriority,
        delay: 0,
      });

      console.log(
        `[NotificationQueue] Job ${job.id} added to queue: ${data.type} (priority: ${jobPriority})`,
      );
    } catch (error) {
      console.error("[NotificationQueue] Failed to add job:", error);
      throw error;
    }
  }

  /**
   * Adiciona job com delay (para notificações agendadas)
   */
  async addScheduledNotificationJob(
    data: NotificationJobData,
    delayMs: number,
  ): Promise<void> {
    try {
      const job = await this.queue.add("scheduled-notification", data, {
        priority: this.getPriority(data.urgency),
        delay: delayMs,
      });

      console.log(
        `[NotificationQueue] Scheduled job ${job.id} added: ${data.type} (delay: ${delayMs}ms)`,
      );
    } catch (error) {
      console.error("[NotificationQueue] Failed to add scheduled job:", error);
      throw error;
    }
  }

  /**
   * Adiciona job recorrente (para cron jobs)
   */
  async addRecurringNotificationJob(
    data: NotificationJobData,
    cronPattern: string,
  ): Promise<void> {
    try {
      const job = await this.queue.add("recurring-notification", data, {
        priority: this.getPriority(data.urgency),
        repeat: { pattern: cronPattern },
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      console.log(
        `[NotificationQueue] Recurring job ${job.id} added: ${data.type} (cron: ${cronPattern})`,
      );
    } catch (error) {
      console.error("[NotificationQueue] Failed to add recurring job:", error);
      throw error;
    }
  }

  /**
   * Converte urgência em prioridade do BullMQ
   */
  private getPriority(urgency: string): number {
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
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
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
  async cleanOldJobs(): Promise<void> {
    await this.queue.clean(24 * 60 * 60 * 1000, 100, "completed"); // 24h
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 50, "failed"); // 7 dias
  }

  /**
   * Pausa a fila
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume a fila
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Fecha a conexão da fila
   */
  async close(): Promise<void> {
    await this.queue.close();
  }
}

// Singleton da queue
let notificationQueue: NotificationQueue | null = null;

/**
 * Obtém instância da queue (singleton)
 */
export function getNotificationQueue(): NotificationQueue {
  if (!notificationQueue) {
    notificationQueue = new NotificationQueue();
  }

  return notificationQueue;
}
