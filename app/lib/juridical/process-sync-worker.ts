import { Job, Worker } from "bullmq";

import { capturarProcesso } from "@/app/lib/juridical/capture-service";
import prisma from "@/app/lib/prisma";
import { upsertProcessoFromCapture } from "@/app/lib/juridical/processo-persistence";
import { bullMQConfig } from "@/app/lib/notifications/redis-config";
import logger from "@/lib/logger";
import { resolverCaptchaEsaj } from "@/lib/api/juridical/scraping";
import { ProcessoJuridico } from "@/lib/api/juridical/types";

import { PROCESS_SYNC_QUEUE_NAME } from "./process-sync-queue";
import {
  buildInitialPortalProcessSyncState,
  getPortalProcessSyncState,
  savePortalProcessSyncState,
  withPortalProcessSyncStatus,
} from "./process-sync-status-store";
import { PortalProcessSyncJobData } from "./process-sync-types";

type SyncAuditStatus = "SUCESSO" | "ERRO" | "PENDENTE_CAPTCHA";

function normalizeNumeroProcesso(value?: string | null) {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

function dedupeProcessos(processos: ProcessoJuridico[]) {
  const seen = new Set<string>();
  const deduped: ProcessoJuridico[] = [];

  for (const processo of processos) {
    const key = normalizeNumeroProcesso(processo.numeroProcesso);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(processo);
  }

  return deduped;
}

function extractProcessosFromResult(result: {
  processo?: ProcessoJuridico;
  processos?: ProcessoJuridico[];
}) {
  return dedupeProcessos(
    result.processos?.length
      ? result.processos
      : result.processo
        ? [result.processo]
        : [],
  );
}

async function persistProcessos(params: {
  tenantId: string;
  processos: ProcessoJuridico[];
  clienteNome?: string;
  advogadoId?: string | null;
}) {
  const persisted = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const processo of params.processos) {
    const result = await upsertProcessoFromCapture({
      tenantId: params.tenantId,
      processo,
      clienteNome: params.clienteNome,
      advogadoId: params.advogadoId || undefined,
      updateIfExists: true,
    });

    persisted.push({
      numeroProcesso: processo.numeroProcesso,
      ...result,
    });

    if (result.created) {
      createdCount += 1;
    } else if (result.updated) {
      updatedCount += 1;
    }
  }

  return {
    persisted,
    createdCount,
    updatedCount,
  };
}

async function createSyncAudit(params: {
  tenantId: string;
  usuarioId: string;
  syncId: string;
  tribunalSigla: string;
  oab: string;
  status: SyncAuditStatus;
  origem: "BACKGROUND_INITIAL" | "BACKGROUND_CAPTCHA";
  syncedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  processosNumeros?: string[];
  error?: string;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      usuarioId: params.usuarioId,
      acao: "SINCRONIZACAO_INICIAL_OAB_PROCESSOS",
      entidade: "Processo",
      dados: {
        origem: params.origem,
        status: params.status,
        syncId: params.syncId,
        tribunalSigla: params.tribunalSigla,
        oab: params.oab,
        syncedCount: params.syncedCount ?? 0,
        createdCount: params.createdCount ?? 0,
        updatedCount: params.updatedCount ?? 0,
        processosNumeros: (params.processosNumeros ?? []).slice(0, 50),
        error: params.error ?? null,
      },
      changedFields: [],
    },
  });
}

export class PortalProcessSyncWorker {
  private worker: Worker<PortalProcessSyncJobData>;

  constructor() {
    this.worker = new Worker<PortalProcessSyncJobData>(
      PROCESS_SYNC_QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection: bullMQConfig.connection,
        concurrency: 3,
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on("completed", (job) => {
      logger.info(`[PortalProcessSyncWorker] Job ${job.id} completed`);
    });

    this.worker.on("failed", (job, error) => {
      logger.error(
        `[PortalProcessSyncWorker] Job ${job?.id} failed`,
        error,
      );
    });

    this.worker.on("ready", () => {
      logger.info("[PortalProcessSyncWorker] Worker ready");
    });
  }

  private async processJob(job: Job<PortalProcessSyncJobData>) {
    const data = job.data;
    const origem = data.mode === "CAPTCHA" ? "BACKGROUND_CAPTCHA" : "BACKGROUND_INITIAL";
    const queueJobId = String(job.id);

    let state =
      (await getPortalProcessSyncState(data.syncId)) ??
      buildInitialPortalProcessSyncState({
        syncId: data.syncId,
        tenantId: data.tenantId,
        usuarioId: data.usuarioId,
        advogadoId: data.advogadoId,
        tribunalSigla: data.tribunalSigla,
        oab: data.oab,
        mode: data.mode,
      });

    state = withPortalProcessSyncStatus(state, "RUNNING", {
      mode: data.mode,
      queueJobId,
      error: undefined,
      captchaId: undefined,
      captchaImage: undefined,
    });
    await savePortalProcessSyncState(state);

    try {
      const resultado =
        data.mode === "CAPTCHA"
          ? await resolverCaptchaEsaj({
              captchaId: data.captchaId || "",
              captchaText: data.captchaText || "",
            })
          : await capturarProcesso({
              numeroProcesso: "",
              oab: data.oab,
              tenantId: data.tenantId,
              tribunalSigla: data.tribunalSigla,
            });

      if (!resultado.success) {
        if (resultado.captchaRequired && resultado.captcha?.id) {
          state = withPortalProcessSyncStatus(state, "WAITING_CAPTCHA", {
            error:
              resultado.error ||
              "Captcha obrigatório para continuar a sincronização.",
            captchaId: resultado.captcha.id,
            captchaImage: resultado.captcha.imageDataUrl,
          });
          await savePortalProcessSyncState(state);
          await createSyncAudit({
            tenantId: data.tenantId,
            usuarioId: data.usuarioId,
            syncId: data.syncId,
            tribunalSigla: data.tribunalSigla,
            oab: data.oab,
            status: "PENDENTE_CAPTCHA",
            origem,
            error: resultado.error,
          });
          return;
        }

        state = withPortalProcessSyncStatus(state, "FAILED", {
          error: resultado.error || "Falha ao sincronizar processos no worker.",
        });
        await savePortalProcessSyncState(state);
        await createSyncAudit({
          tenantId: data.tenantId,
          usuarioId: data.usuarioId,
          syncId: data.syncId,
          tribunalSigla: data.tribunalSigla,
          oab: data.oab,
          status: "ERRO",
          origem,
          error: state.error,
        });
        return;
      }

      const processosCapturados = extractProcessosFromResult(resultado);
      if (processosCapturados.length === 0) {
        state = withPortalProcessSyncStatus(state, "FAILED", {
          error: "Captura concluída sem processos válidos.",
        });
        await savePortalProcessSyncState(state);
        await createSyncAudit({
          tenantId: data.tenantId,
          usuarioId: data.usuarioId,
          syncId: data.syncId,
          tribunalSigla: data.tribunalSigla,
          oab: data.oab,
          status: "ERRO",
          origem,
          error: state.error,
        });
        return;
      }

      const persisted = await persistProcessos({
        tenantId: data.tenantId,
        processos: processosCapturados,
        clienteNome: data.clienteNome,
        advogadoId: data.advogadoId,
      });

      const processosNumeros = processosCapturados
        .map((item) => item.numeroProcesso)
        .filter(Boolean)
        .slice(0, 50);

      state = withPortalProcessSyncStatus(state, "COMPLETED", {
        syncedCount: processosCapturados.length,
        createdCount: persisted.createdCount,
        updatedCount: persisted.updatedCount,
        processosNumeros,
        error: undefined,
      });
      await savePortalProcessSyncState(state);

      await createSyncAudit({
        tenantId: data.tenantId,
        usuarioId: data.usuarioId,
        syncId: data.syncId,
        tribunalSigla: data.tribunalSigla,
        oab: data.oab,
        status: "SUCESSO",
        origem,
        syncedCount: processosCapturados.length,
        createdCount: persisted.createdCount,
        updatedCount: persisted.updatedCount,
        processosNumeros,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado no worker.";

      state = withPortalProcessSyncStatus(state, "FAILED", {
        error: message,
      });
      await savePortalProcessSyncState(state);
      await createSyncAudit({
        tenantId: data.tenantId,
        usuarioId: data.usuarioId,
        syncId: data.syncId,
        tribunalSigla: data.tribunalSigla,
        oab: data.oab,
        status: "ERRO",
        origem,
        error: message,
      });

      logger.error("[PortalProcessSyncWorker] Erro ao processar job", error);
    }
  }

  async start() {
    logger.info("[PortalProcessSyncWorker] Starting worker...");
  }

  async stop() {
    logger.info("[PortalProcessSyncWorker] Stopping worker...");
    await this.worker.close();
  }

  async getStats() {
    return {
      running: true,
      concurrency: 3,
    };
  }
}

let processSyncWorker: PortalProcessSyncWorker | null = null;

export function getPortalProcessSyncWorker() {
  if (!processSyncWorker) {
    processSyncWorker = new PortalProcessSyncWorker();
  }
  return processSyncWorker;
}

export async function startPortalProcessSyncWorker() {
  const worker = getPortalProcessSyncWorker();
  await worker.start();
}

export async function stopPortalProcessSyncWorker() {
  if (processSyncWorker) {
    await processSyncWorker.stop();
    processSyncWorker = null;
  }
}
