import { Worker, Job } from "bullmq";

import { bullMQConfig } from "./redis-config";
import { NotificationService } from "./notification-service";

/**
 * Tipos de jobs para a fila de notificações
 */
export interface NotificationJobData {
  type: string;
  tenantId: string;
  userId: string;
  payload: Record<string, any>;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  channels: ("REALTIME" | "EMAIL" | "PUSH")[];
}

/**
 * Worker para processar notificações de forma assíncrona
 */
export class NotificationWorker {
  private worker: Worker<NotificationJobData>;

  constructor() {
    this.worker = new Worker<NotificationJobData>(
      "notifications",
      this.processNotificationJob.bind(this),
      {
        connection: bullMQConfig.connection,
        concurrency: 10,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    this.setupEventHandlers();
  }

  /**
   * Processa job de notificação
   */
  private async processNotificationJob(
    job: Job<NotificationJobData>,
  ): Promise<void> {
    const { type, tenantId, userId, payload, urgency, channels } = job.data;

    console.log(
      `[NotificationWorker] Processing job ${job.id}: ${type} for user ${userId}`,
    );

    try {
      // Publicar notificação usando o método síncrono
      await NotificationService.processNotificationSync({
        type,
        tenantId,
        userId,
        payload,
        urgency,
        channels,
      });

      console.log(`[NotificationWorker] Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[NotificationWorker] Job ${job.id} failed:`, error);
      throw error; // Re-throw para que o BullMQ possa fazer retry
    }
  }

  /**
   * Configura event handlers do worker
   */
  private setupEventHandlers(): void {
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
  async start(): Promise<void> {
    console.log("[NotificationWorker] Starting worker...");
    // Worker já inicia automaticamente quando criado
  }

  /**
   * Para o worker
   */
  async stop(): Promise<void> {
    console.log("[NotificationWorker] Stopping worker...");
    await this.worker.close();
  }

  /**
   * Obtém estatísticas do worker
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    // Worker não tem acesso direto à queue, retornar stats básicos
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }
}

// Singleton do worker
let notificationWorker: NotificationWorker | null = null;

/**
 * Obtém instância do worker (singleton)
 */
export function getNotificationWorker(): NotificationWorker {
  if (!notificationWorker) {
    notificationWorker = new NotificationWorker();
  }

  return notificationWorker;
}

/**
 * Inicia o worker de notificações
 */
export async function startNotificationWorker(): Promise<void> {
  const worker = getNotificationWorker();

  await worker.start();
}

/**
 * Para o worker de notificações
 */
export async function stopNotificationWorker(): Promise<void> {
  if (notificationWorker) {
    await notificationWorker.stop();
    notificationWorker = null;
  }
}
