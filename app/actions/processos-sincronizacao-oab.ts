"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import { getAdvogadoIdFromSession } from "@/app/lib/advogado-access";
import prisma from "@/app/lib/prisma";
import { capturarProcessoAction, resolverCaptchaEsajAction } from "@/app/actions/juridical-capture";
import { getTribunaisScrapingDisponiveis } from "@/lib/api/juridical/config";
import logger from "@/lib/logger";

const AUDIT_ACTION_SYNC_OAB = "SINCRONIZACAO_INICIAL_OAB_PROCESSOS";
const SYNC_OAB_ALLOWED_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "ADVOGADO"]);

type SyncStatus = "SUCESSO" | "ERRO" | "PENDENTE_CAPTCHA";

type SyncActionLikeResult = {
  success: boolean;
  error?: string;
  captchaRequired?: boolean;
  captchaId?: string;
  captchaImage?: string;
  syncedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  processos?: Array<{ numeroProcesso?: string | null }>;
  persisted?: Array<{ numeroProcesso?: string | null }>;
};

export interface TribunalSincronizacaoOption {
  sigla: string;
  nome: string;
  uf: string;
}

export interface SincronizacaoInicialOabResponse {
  success: boolean;
  tribunalSigla?: string;
  oab?: string;
  syncedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  processosNumeros?: string[];
  error?: string;
  captchaRequired?: boolean;
  captchaId?: string;
  captchaImage?: string;
}

export interface SincronizacaoInicialHistoricoItem {
  id: string;
  createdAt: string;
  status: SyncStatus;
  tribunalSigla: string;
  oab: string;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  error?: string;
  executadoPor: string;
}

export interface SincronizacaoInicialHistoricoResponse {
  success: boolean;
  itens: SincronizacaoInicialHistoricoItem[];
  error?: string;
}

function sanitizeOab(value?: string | null) {
  if (!value) return "";
  return value.replace(/[^0-9A-Za-z]/g, "").toUpperCase().trim();
}

function buildDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return full || user.email;
}

function toSafeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function canSyncOabForRole(role?: string | null) {
  return typeof role === "string" && SYNC_OAB_ALLOWED_ROLES.has(role);
}

function extractProcessNumbers(result: SyncActionLikeResult) {
  if (Array.isArray(result.processos) && result.processos.length > 0) {
    return result.processos
      .map((item) => (typeof item?.numeroProcesso === "string" ? item.numeroProcesso : ""))
      .filter(Boolean);
  }

  if (Array.isArray(result.persisted) && result.persisted.length > 0) {
    return result.persisted
      .map((item) => (typeof item?.numeroProcesso === "string" ? item.numeroProcesso : ""))
      .filter(Boolean);
  }

  return [];
}

async function resolveOab(params: { tenantId: string; session: any; oab?: string }) {
  const provided = sanitizeOab(params.oab);
  if (provided) return provided;

  const advogadoId = await getAdvogadoIdFromSession(params.session);

  if (!advogadoId) {
    return "";
  }

  const advogado = await prisma.advogado.findFirst({
    where: {
      id: advogadoId,
      tenantId: params.tenantId,
    },
    select: {
      oabNumero: true,
      oabUf: true,
    },
  });

  if (!advogado?.oabNumero || !advogado.oabUf) {
    return "";
  }

  return sanitizeOab(`${advogado.oabNumero}${advogado.oabUf}`);
}

async function createSyncAudit(params: {
  tenantId: string;
  usuarioId: string;
  tribunalSigla: string;
  oab: string;
  status: SyncStatus;
  result: SyncActionLikeResult;
  origem: "INICIO" | "CAPTCHA";
}) {
  const processosNumeros = extractProcessNumbers(params.result);
  const syncedCount =
    toSafeNumber(params.result.syncedCount) ||
    processosNumeros.length;

  const createdCount = toSafeNumber(params.result.createdCount);
  const updatedCount = toSafeNumber(params.result.updatedCount);

  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      usuarioId: params.usuarioId,
      acao: AUDIT_ACTION_SYNC_OAB,
      entidade: "Processo",
      dados: {
        origem: params.origem,
        status: params.status,
        tribunalSigla: params.tribunalSigla,
        oab: params.oab,
        syncedCount,
        createdCount,
        updatedCount,
        processosNumeros: processosNumeros.slice(0, 50),
        error: params.result.error ?? null,
        captchaRequired: Boolean(params.result.captchaRequired),
      },
      changedFields: [],
    },
  });
}

function toPublicResponse(params: {
  tribunalSigla: string;
  oab: string;
  result: SyncActionLikeResult;
}): SincronizacaoInicialOabResponse {
  const processosNumeros = extractProcessNumbers(params.result);
  const syncedCount =
    toSafeNumber(params.result.syncedCount) ||
    processosNumeros.length;

  return {
    success: params.result.success,
    tribunalSigla: params.tribunalSigla,
    oab: params.oab,
    syncedCount,
    createdCount: toSafeNumber(params.result.createdCount),
    updatedCount: toSafeNumber(params.result.updatedCount),
    processosNumeros: processosNumeros.slice(0, 50),
    error: params.result.error,
    captchaRequired: Boolean(params.result.captchaRequired),
    captchaId: params.result.captchaId,
    captchaImage: params.result.captchaImage,
  };
}

function parseHistoryData(
  value: unknown,
): {
  status: SyncStatus;
  tribunalSigla: string;
  oab: string;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  error?: string;
} {
  const fallback = {
    status: "ERRO" as SyncStatus,
    tribunalSigla: "-",
    oab: "-",
    syncedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    error: "Dados de histórico indisponíveis.",
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const payload = value as Record<string, unknown>;
  const statusRaw = payload.status;
  const status: SyncStatus =
    statusRaw === "SUCESSO" || statusRaw === "PENDENTE_CAPTCHA"
      ? statusRaw
      : "ERRO";

  const tribunalSigla =
    typeof payload.tribunalSigla === "string" && payload.tribunalSigla.trim()
      ? payload.tribunalSigla.trim().toUpperCase()
      : "-";

  const oab =
    typeof payload.oab === "string" && payload.oab.trim()
      ? payload.oab.trim().toUpperCase()
      : "-";

  const error =
    typeof payload.error === "string" && payload.error.trim()
      ? payload.error.trim()
      : undefined;

  return {
    status,
    tribunalSigla,
    oab,
    syncedCount: toSafeNumber(payload.syncedCount),
    createdCount: toSafeNumber(payload.createdCount),
    updatedCount: toSafeNumber(payload.updatedCount),
    error,
  };
}

export async function listarTribunaisSincronizacaoOab(): Promise<{
  success: boolean;
  tribunais: TribunalSincronizacaoOption[];
  error?: string;
}> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    return {
      success: false,
      tribunais: [],
      error: "Não autorizado.",
    };
  }

  if (!canSyncOabForRole((session.user as any).role)) {
    return {
      success: false,
      tribunais: [],
      error: "Você não tem permissão para sincronizar processos por OAB.",
    };
  }

  const tribunais = getTribunaisScrapingDisponiveis()
    .map((tribunal) => ({
      sigla: tribunal.sigla,
      nome: tribunal.nome,
      uf: tribunal.uf,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    success: true,
    tribunais,
  };
}

export async function sincronizarProcessosIniciaisPorOab(params: {
  tribunalSigla: string;
  oab?: string;
  clienteNome?: string;
}): Promise<SincronizacaoInicialOabResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId || !session.user.id) {
      return {
        success: false,
        error: "Não autorizado.",
      };
    }

    if (!canSyncOabForRole((session.user as any).role)) {
      return {
        success: false,
        error: "Você não tem permissão para sincronizar processos por OAB.",
      };
    }

    const tenantId = session.user.tenantId;
    const usuarioId = session.user.id;
    const tribunalSigla = (params.tribunalSigla || "").trim().toUpperCase();

    if (!tribunalSigla) {
      return {
        success: false,
        error: "Selecione o tribunal para iniciar a sincronização.",
      };
    }

    const tribunaisSuportados = getTribunaisScrapingDisponiveis().map(
      (item) => item.sigla,
    );

    if (!tribunaisSuportados.includes(tribunalSigla)) {
      return {
        success: false,
        error: `Tribunal ${tribunalSigla} não está habilitado para sincronização por OAB.`,
      };
    }

    const oab = await resolveOab({
      tenantId,
      session,
      oab: params.oab,
    });

    if (!oab) {
      return {
        success: false,
        tribunalSigla,
        error: "Informe a OAB ou complete o cadastro de OAB do advogado logado.",
      };
    }

    const resultado = (await capturarProcessoAction({
      tribunalSigla,
      oab,
      clienteNome: params.clienteNome?.trim() || undefined,
    })) as SyncActionLikeResult;

    const status: SyncStatus = resultado.success
      ? "SUCESSO"
      : resultado.captchaRequired
        ? "PENDENTE_CAPTCHA"
        : "ERRO";

    await createSyncAudit({
      tenantId,
      usuarioId,
      tribunalSigla,
      oab,
      status,
      result: resultado,
      origem: "INICIO",
    });

    if (resultado.success) {
      revalidatePath("/processos");
    }

    return toPublicResponse({
      tribunalSigla,
      oab,
      result: resultado,
    });
  } catch (error) {
    logger.error("[Processos Sync OAB] Erro ao sincronizar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function resolverCaptchaSincronizacaoOab(params: {
  tribunalSigla: string;
  captchaId: string;
  captchaText: string;
  oab?: string;
  clienteNome?: string;
}): Promise<SincronizacaoInicialOabResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId || !session.user.id) {
      return {
        success: false,
        error: "Não autorizado.",
      };
    }

    if (!canSyncOabForRole((session.user as any).role)) {
      return {
        success: false,
        error: "Você não tem permissão para sincronizar processos por OAB.",
      };
    }

    const tenantId = session.user.tenantId;
    const usuarioId = session.user.id;
    const tribunalSigla = (params.tribunalSigla || "").trim().toUpperCase();

    if (!tribunalSigla) {
      return {
        success: false,
        error: "Tribunal não informado para validação do captcha.",
      };
    }

    const oab = await resolveOab({
      tenantId,
      session,
      oab: params.oab,
    });

    if (!oab) {
      return {
        success: false,
        tribunalSigla,
        error: "Informe a OAB para concluir a sincronização com captcha.",
      };
    }

    const resultado = (await resolverCaptchaEsajAction({
      captchaId: params.captchaId,
      captchaText: params.captchaText,
      clienteNome: params.clienteNome?.trim() || undefined,
    })) as SyncActionLikeResult;

    const status: SyncStatus = resultado.success ? "SUCESSO" : "ERRO";

    await createSyncAudit({
      tenantId,
      usuarioId,
      tribunalSigla,
      oab,
      status,
      result: resultado,
      origem: "CAPTCHA",
    });

    if (resultado.success) {
      revalidatePath("/processos");
    }

    return toPublicResponse({
      tribunalSigla,
      oab,
      result: resultado,
    });
  } catch (error) {
    logger.error("[Processos Sync OAB] Erro ao resolver captcha:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function listarHistoricoSincronizacaoOab(
  limit = 12,
): Promise<SincronizacaoInicialHistoricoResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return {
        success: false,
        itens: [],
        error: "Não autorizado.",
      };
    }

    if (!canSyncOabForRole((session.user as any).role)) {
      return {
        success: false,
        itens: [],
        error: "Você não tem permissão para acessar o histórico de sincronização por OAB.",
      };
    }

    const tenantId = session.user.tenantId;
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 30);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        acao: AUDIT_ACTION_SYNC_OAB,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: safeLimit,
      select: {
        id: true,
        createdAt: true,
        dados: true,
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const itens: SincronizacaoInicialHistoricoItem[] = logs.map((entry) => {
      const parsed = parseHistoryData(entry.dados);

      return {
        id: entry.id,
        createdAt: entry.createdAt.toISOString(),
        status: parsed.status,
        tribunalSigla: parsed.tribunalSigla,
        oab: parsed.oab,
        syncedCount: parsed.syncedCount,
        createdCount: parsed.createdCount,
        updatedCount: parsed.updatedCount,
        error: parsed.error,
        executadoPor: entry.usuario
          ? buildDisplayName(entry.usuario)
          : "Usuário removido",
      };
    });

    return {
      success: true,
      itens,
    };
  } catch (error) {
    logger.error("[Processos Sync OAB] Erro ao listar histórico:", error);
    return {
      success: false,
      itens: [],
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}
