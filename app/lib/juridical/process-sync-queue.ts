import { Queue } from "bullmq";

import { bullMQConfig } from "@/app/lib/notifications/redis-config";

import { PortalProcessSyncJobData } from "./process-sync-types";

const PROCESS_SYNC_QUEUE_NAME = "portal-process-sync";

export class PortalProcessSyncQueue {
  private queue: Queue<PortalProcessSyncJobData>;

  constructor() {
    this.queue = new Queue<PortalProcessSyncJobData>(PROCESS_SYNC_QUEUE_NAME, {
      connection: bullMQConfig.connection,
      defaultJobOptions: {
        ...bullMQConfig.defaultJobOptions,
        attempts: 1,
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    });
  }

  async addJob(data: PortalProcessSyncJobData): Promise<string> {
    const job = await this.queue.add("portal-process-sync-job", data, {
      priority: data.mode === "CAPTCHA" ? 1 : 2,
      delay: 0,
    });

    return String(job.id);
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async close() {
    await this.queue.close();
  }
}

let processSyncQueue: PortalProcessSyncQueue | null = null;

export function getPortalProcessSyncQueue() {
  if (!processSyncQueue) {
    processSyncQueue = new PortalProcessSyncQueue();
  }

  return processSyncQueue;
}

export { PROCESS_SYNC_QUEUE_NAME };
