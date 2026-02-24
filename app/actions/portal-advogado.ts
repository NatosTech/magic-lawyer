"use server";

import { randomUUID } from "crypto";

import { getSession } from "@/app/lib/auth";
import { getPortalProcessSyncQueue } from "@/app/lib/juridical/process-sync-queue";
import {
  buildInitialPortalProcessSyncState,
  getLatestPortalProcessSyncState,
  getPortalProcessSyncState,
  savePortalProcessSyncState,
} from "@/app/lib/juridical/process-sync-status-store";
import prisma from "@/app/lib/prisma";
import {
  PortalProcessSyncState,
  isPortalProcessSyncTerminalStatus,
} from "@/app/lib/juridical/process-sync-types";
import { getTribunaisScrapingDisponiveis } from "@/lib/api/juridical/config";
import logger from "@/lib/logger";

/**
 * Busca a UF principal do tenant (baseada no endereço principal)
 */
export async function getTenantUF(): Promise<string | null> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar endereço principal
  const enderecoPrincipal = await prisma.endereco.findFirst({
    where: {
      tenantId: session.user.tenantId,
      principal: true,
    },
    select: {
      estado: true,
    },
  });

  if (enderecoPrincipal?.estado) {
    return enderecoPrincipal.estado;
  }

  // Fallback: buscar o primeiro endereço se não houver principal
  const primeiroEndereco = await prisma.endereco.findFirst({
    where: {
      tenantId: session.user.tenantId,
    },
    select: {
      estado: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return primeiroEndereco?.estado || null;
}

/**
 * Lista todas as UFs onde o tenant tem processos
 */
export async function getProcessosUFs(): Promise<string[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar processos com tribunal
  const processos = await prisma.processo.findMany({
    where: {
      tenantId: session.user.tenantId,
      tribunalId: { not: null },
      deletedAt: null,
    },
    include: {
      tribunal: {
        select: {
          uf: true,
        },
      },
    },
  });

  // Extrair UFs únicas e válidas
  const ufs = new Set<string>();

  processos.forEach((processo) => {
    if (processo.tribunal?.uf) {
      ufs.add(processo.tribunal.uf);
    }
  });

  return Array.from(ufs).sort();
}

/**
 * Lista todos os tribunais de uma UF específica
 */
export async function getTribunaisPorUF(uf: string): Promise<
  Array<{
    id: string;
    nome: string;
    sigla: string | null;
    uf: string | null;
    siteUrl: string | null;
    esfera: string | null;
  }>
> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const tribunais = await prisma.tribunal.findMany({
    where: {
      tenantId: session.user.tenantId,
      uf: uf,
    },
    select: {
      id: true,
      nome: true,
      sigla: true,
      uf: true,
      siteUrl: true,
      esfera: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return tribunais;
}

/**
 * Busca todas as UFs disponíveis (tenant + processos)
 */
export async function getUFsDisponiveis(): Promise<string[]> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado");
  }

  const [tenantUF, processosUFs] = await Promise.all([
    getTenantUF(),
    getProcessosUFs(),
  ]);

  // Combinar e remover duplicatas
  const ufs = new Set<string>();

  if (tenantUF) {
    ufs.add(tenantUF);
  }
  processosUFs.forEach((uf) => ufs.add(uf));

  return Array.from(ufs).sort();
}

function sanitizeOab(value?: string | null) {
  if (!value) return "";
  return value.replace(/[^0-9A-Za-z]/g, "").toUpperCase().trim();
}

function toPublicSyncState(state: PortalProcessSyncState) {
  return {
    syncId: state.syncId,
    tribunalSigla: state.tribunalSigla,
    oab: state.oab,
    status: state.status,
    syncedCount: state.syncedCount,
    createdCount: state.createdCount,
    updatedCount: state.updatedCount,
    processosNumeros: state.processosNumeros,
    error: state.error,
    captchaId: state.captchaId,
    captchaImage: state.captchaImage,
    createdAt: state.createdAt,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    updatedAt: state.updatedAt,
  };
}

async function resolveAdvogadoContext(params: {
  tenantId: string;
  usuarioId: string;
  oab?: string;
}) {
  const providedOab = sanitizeOab(params.oab);

  const advogado = await prisma.advogado.findFirst({
    where: {
      tenantId: params.tenantId,
      usuarioId: params.usuarioId,
    },
    select: {
      id: true,
      oabNumero: true,
      oabUf: true,
    },
  });

  const advogadoOab =
    advogado?.oabNumero && advogado.oabUf
      ? sanitizeOab(`${advogado.oabNumero}${advogado.oabUf}`)
      : "";

  return {
    advogadoId: advogado?.id ?? null,
    oab: providedOab || advogadoOab,
  };
}

export async function getTribunaisSincronizacaoPortalAdvogado(): Promise<{
  success: boolean;
  tribunais: Array<{ sigla: string; nome: string; uf: string }>;
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

  const tribunais = getTribunaisScrapingDisponiveis()
    .map((item) => ({
      sigla: item.sigla,
      nome: item.nome,
      uf: item.uf,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    success: true,
    tribunais,
  };
}

export async function iniciarSincronizacaoMeusProcessos(params?: {
  tribunalSigla?: string;
  oab?: string;
  clienteNome?: string;
}): Promise<{
  success: boolean;
  syncId?: string;
  status?: ReturnType<typeof toPublicSyncState>;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId || !session.user.id) {
      return { success: false, error: "Não autorizado." };
    }

    const tenantId = session.user.tenantId;
    const usuarioId = session.user.id;
    const tribunalSigla = (params?.tribunalSigla || "TJSP").trim().toUpperCase();

    const tribunaisSuportados = getTribunaisScrapingDisponiveis().map(
      (item) => item.sigla,
    );

    if (!tribunaisSuportados.includes(tribunalSigla)) {
      return {
        success: false,
        error: `Tribunal ${tribunalSigla} não está habilitado para sincronização por OAB.`,
      };
    }

    const latestState = await getLatestPortalProcessSyncState({
      tenantId,
      usuarioId,
    });

    if (
      latestState &&
      !isPortalProcessSyncTerminalStatus(latestState.status)
    ) {
      return {
        success: false,
        syncId: latestState.syncId,
        status: toPublicSyncState(latestState),
        error:
          latestState.status === "WAITING_CAPTCHA"
            ? "Existe uma sincronização aguardando captcha. Resolva para continuar."
            : "Já existe uma sincronização em andamento.",
      };
    }

    const ctx = await resolveAdvogadoContext({
      tenantId,
      usuarioId,
      oab: params?.oab,
    });

    if (!ctx.oab) {
      return {
        success: false,
        error:
          "Não encontramos OAB válida no seu perfil. Atualize seu cadastro ou informe manualmente.",
      };
    }

    const syncId = randomUUID();
    const initialState = buildInitialPortalProcessSyncState({
      syncId,
      tenantId,
      usuarioId,
      advogadoId: ctx.advogadoId,
      tribunalSigla,
      oab: ctx.oab,
      mode: "INITIAL",
    });

    await savePortalProcessSyncState(initialState);

    const queue = getPortalProcessSyncQueue();
    const queueJobId = await queue.addJob({
      syncId,
      tenantId,
      usuarioId,
      advogadoId: ctx.advogadoId,
      tribunalSigla,
      oab: ctx.oab,
      clienteNome: params?.clienteNome?.trim() || undefined,
      mode: "INITIAL",
    });

    const queuedState: PortalProcessSyncState = {
      ...initialState,
      queueJobId,
      updatedAt: new Date().toISOString(),
    };

    await savePortalProcessSyncState(queuedState);

    return {
      success: true,
      syncId,
      status: toPublicSyncState(queuedState),
    };
  } catch (error) {
    logger.error("[Portal Advogado] Erro ao iniciar sincronização:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function getStatusSincronizacaoMeusProcessos(params?: {
  syncId?: string;
}): Promise<{
  success: boolean;
  status?: ReturnType<typeof toPublicSyncState>;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId || !session.user.id) {
      return { success: false, error: "Não autorizado." };
    }

    const tenantId = session.user.tenantId;
    const usuarioId = session.user.id;

    const state = params?.syncId
      ? await getPortalProcessSyncState(params.syncId)
      : await getLatestPortalProcessSyncState({ tenantId, usuarioId });

    if (!state) {
      return {
        success: true,
        status: undefined,
      };
    }

    if (state.tenantId !== tenantId || state.usuarioId !== usuarioId) {
      return {
        success: false,
        error: "Sincronização não pertence ao usuário atual.",
      };
    }

    return {
      success: true,
      status: toPublicSyncState(state),
    };
  } catch (error) {
    logger.error("[Portal Advogado] Erro ao buscar status da sincronização:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function resolverCaptchaSincronizacaoMeusProcessos(params: {
  syncId: string;
  captchaText: string;
}): Promise<{
  success: boolean;
  status?: ReturnType<typeof toPublicSyncState>;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId || !session.user.id) {
      return { success: false, error: "Não autorizado." };
    }

    const tenantId = session.user.tenantId;
    const usuarioId = session.user.id;
    const captchaText = (params.captchaText || "").trim();

    if (!captchaText) {
      return {
        success: false,
        error: "Informe o captcha para continuar.",
      };
    }

    const state = await getPortalProcessSyncState(params.syncId);

    if (!state) {
      return {
        success: false,
        error: "Sincronização não encontrada ou expirada.",
      };
    }

    if (state.tenantId !== tenantId || state.usuarioId !== usuarioId) {
      return {
        success: false,
        error: "Sincronização não pertence ao usuário atual.",
      };
    }

    if (state.status !== "WAITING_CAPTCHA" || !state.captchaId) {
      return {
        success: false,
        status: toPublicSyncState(state),
        error: "Esta sincronização não está aguardando captcha.",
      };
    }

    const queue = getPortalProcessSyncQueue();
    const queueJobId = await queue.addJob({
      syncId: state.syncId,
      tenantId: state.tenantId,
      usuarioId: state.usuarioId,
      advogadoId: state.advogadoId,
      tribunalSigla: state.tribunalSigla,
      oab: state.oab,
      mode: "CAPTCHA",
      captchaId: state.captchaId,
      captchaText,
    });

    const queuedState: PortalProcessSyncState = {
      ...state,
      mode: "CAPTCHA",
      status: "QUEUED",
      queueJobId,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    await savePortalProcessSyncState(queuedState);

    return {
      success: true,
      status: toPublicSyncState(queuedState),
    };
  } catch (error) {
    logger.error("[Portal Advogado] Erro ao resolver captcha:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}
