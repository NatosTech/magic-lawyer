"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";
import { capturarProcesso, capturarAndamentos } from "@/app/lib/juridical/capture-service";
import { upsertProcessoFromCapture } from "@/app/lib/juridical/processo-persistence";
import { getAdvogadoIdFromSession } from "@/app/lib/advogado-access";
import { resolverCaptchaEsaj } from "@/lib/api/juridical/scraping";
import {
  MovimentacaoProcesso as MovimentacaoCapturada,
  ProcessoJuridico,
} from "@/lib/api/juridical/types";
import { MovimentacaoTipo } from "@/generated/prisma";
import { checkPermission } from "@/app/actions/equipe";

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

async function persistCapturedProcessos(params: {
  tenantId: string;
  processos: ProcessoJuridico[];
  clienteNome?: string;
  advogadoId?: string;
}) {
  const { tenantId, processos, clienteNome, advogadoId } = params;

  const persisted = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const processo of processos) {
    const result = await upsertProcessoFromCapture({
      tenantId,
      processo,
      clienteNome,
      advogadoId,
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

function normalizeMovementText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeMovementDate(value?: Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildMovementKey(params: {
  dataMovimentacao?: Date | null;
  titulo?: string | null;
  descricao?: string | null;
}) {
  return [
    normalizeMovementDate(params.dataMovimentacao),
    normalizeMovementText(params.titulo),
    normalizeMovementText(params.descricao),
  ].join("|");
}

function mapMovimentacaoTipo(mov: MovimentacaoCapturada): MovimentacaoTipo {
  if (mov.categoria === "PRAZO" || mov.prazoVencimento) {
    return MovimentacaoTipo.PRAZO;
  }
  if (mov.categoria === "AUDIENCIA") {
    return MovimentacaoTipo.AUDIENCIA;
  }
  if (mov.categoria === "INTIMACAO") {
    return MovimentacaoTipo.INTIMACAO;
  }

  const hint = normalizeMovementText(
    mov.tipoNormalizado || mov.tipo || mov.descricao,
  );

  if (hint.includes("AUDIENCIA")) return MovimentacaoTipo.AUDIENCIA;
  if (hint.includes("INTIMAC")) return MovimentacaoTipo.INTIMACAO;
  if (hint.includes("PRAZO")) return MovimentacaoTipo.PRAZO;

  return MovimentacaoTipo.ANDAMENTO;
}

function normalizeCapturedMovements(
  movimentacoes?: MovimentacaoCapturada[],
): MovimentacaoCapturada[] {
  if (!Array.isArray(movimentacoes) || movimentacoes.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const deduped: MovimentacaoCapturada[] = [];

  for (const mov of movimentacoes) {
    const dataMov = mov.data instanceof Date ? mov.data : new Date(mov.data);
    if (Number.isNaN(dataMov.getTime())) continue;

    const titulo = mov.tipoNormalizado || mov.tipo || "Andamento processual";
    const descricao = mov.descricao || "";
    const key = buildMovementKey({
      dataMovimentacao: dataMov,
      titulo,
      descricao,
    });

    if (!key || seen.has(key)) continue;
    seen.add(key);

    deduped.push({
      ...mov,
      data: dataMov,
      tipoNormalizado: titulo,
      descricao,
    });
  }

  return deduped;
}

async function persistCapturedMovimentacoes(params: {
  tenantId: string;
  processoId: string;
  criadoPorId: string;
  movimentacoes?: MovimentacaoCapturada[];
}) {
  const normalized = normalizeCapturedMovements(params.movimentacoes);
  if (normalized.length === 0) {
    return {
      created: 0,
      skipped: 0,
    };
  }

  const existing = await prisma.movimentacaoProcesso.findMany({
    where: {
      tenantId: params.tenantId,
      processoId: params.processoId,
    },
    select: {
      dataMovimentacao: true,
      titulo: true,
      descricao: true,
    },
  });

  const existingKeys = new Set(
    existing.map((item) =>
      buildMovementKey({
        dataMovimentacao: item.dataMovimentacao,
        titulo: item.titulo,
        descricao: item.descricao,
      }),
    ),
  );

  const dataToCreate = normalized
    .filter((mov) => {
      const key = buildMovementKey({
        dataMovimentacao: mov.data,
        titulo: mov.tipoNormalizado || mov.tipo || "Andamento processual",
        descricao: mov.descricao || "",
      });
      return key && !existingKeys.has(key);
    })
    .map((mov) => ({
      tenantId: params.tenantId,
      processoId: params.processoId,
      criadoPorId: params.criadoPorId,
      titulo: mov.tipoNormalizado || mov.tipo || "Andamento processual",
      descricao: mov.descricao || null,
      tipo: mapMovimentacaoTipo(mov),
      dataMovimentacao: mov.data,
      prazo: mov.prazoVencimento || null,
      notificarCliente: false,
      notificarEmail: false,
      notificarWhatsapp: false,
    }));

  if (dataToCreate.length === 0) {
    return {
      created: 0,
      skipped: normalized.length,
    };
  }

  await prisma.movimentacaoProcesso.createMany({
    data: dataToCreate,
  });

  return {
    created: dataToCreate.length,
    skipped: normalized.length - dataToCreate.length,
  };
}

/**
 * Captura processo via Server Action
 */
export async function capturarProcessoAction(params: {
  numeroProcesso?: string;
  tribunalId?: string;
  tribunalSigla?: string;
  certificadoId?: string;
  oab?: string;
  clienteNome?: string;
  debug?: boolean;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const podeCapturar = await checkPermission("processos", "editar");
    if (!podeCapturar) {
      return {
        success: false,
        error: "Sem permissão para capturar/sincronizar processos.",
      };
    }

    const advogadoId = await getAdvogadoIdFromSession(session);
    let oab = params.oab;

    if (!oab && !params.numeroProcesso && advogadoId) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          id: advogadoId,
          tenantId: user.tenantId,
        },
        select: {
          oabNumero: true,
          oabUf: true,
        },
      });

      if (advogado?.oabNumero && advogado.oabUf) {
        oab = `${advogado.oabNumero}${advogado.oabUf}`;
      }
    }

    const resultado = await capturarProcesso({
      numeroProcesso: params.numeroProcesso || "",
      tenantId: user.tenantId,
      tribunalId: params.tribunalId,
      tribunalSigla: params.tribunalSigla,
      certificadoId: params.certificadoId,
      oab,
    });

    if (!resultado.success) {
      return resultado;
    }

    const processosCapturados = dedupeProcessos(
      resultado.processos?.length
        ? resultado.processos
        : resultado.processo
          ? [resultado.processo]
          : [],
    );

    if (processosCapturados.length === 0) {
      return {
        success: false,
        error: "Captura retornou sucesso sem processo (inconsistência).",
      };
    }

    const persistedSummary = await persistCapturedProcessos({
      tenantId: user.tenantId,
      processos: processosCapturados,
      clienteNome: params.clienteNome,
      advogadoId: advogadoId || undefined,
    });
    const firstPersisted = persistedSummary.persisted[0];

    logger.info(
      `[Juridical Capture] ${processosCapturados.length} processo(s) sincronizado(s) para tenant ${user.tenantId} (criados: ${persistedSummary.createdCount}, atualizados: ${persistedSummary.updatedCount})`,
    );

    return {
      success: true,
      processo: processosCapturados[0],
      processos: processosCapturados,
      processoId: firstPersisted?.processoId,
      created: Boolean(firstPersisted?.created),
      createdCount: persistedSummary.createdCount,
      updatedCount: persistedSummary.updatedCount,
      syncedCount: processosCapturados.length,
      persisted: persistedSummary.persisted,
      movimentacoes: resultado.movimentacoes,
      debug: resultado.debug,
    };
  } catch (error) {
    logger.error("[Juridical Capture] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Resolve captcha do e-SAJ e repete a consulta.
 * Fluxo pensado para o /teste-captura (manual).
 */
export async function resolverCaptchaEsajAction(params: {
  captchaId: string;
  captchaText: string;
  clienteNome?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const podeCapturar = await checkPermission("processos", "editar");
    if (!podeCapturar) {
      return {
        success: false,
        error: "Sem permissão para capturar/sincronizar processos.",
      };
    }

    const advogadoId = await getAdvogadoIdFromSession(session);

    const resultado = await resolverCaptchaEsaj({
      captchaId: params.captchaId,
      captchaText: params.captchaText,
    });

    if (!resultado.success) {
      return resultado;
    }

    const processosCapturados = dedupeProcessos(
      resultado.processos?.length
        ? resultado.processos
        : resultado.processo
          ? [resultado.processo]
          : [],
    );

    if (processosCapturados.length === 0) {
      return {
        success: false,
        error: "Captcha resolvido sem processos retornados.",
      };
    }

    const persistedSummary = await persistCapturedProcessos({
      tenantId: user.tenantId,
      processos: processosCapturados,
      clienteNome: params.clienteNome,
      advogadoId: advogadoId || undefined,
    });
    const firstPersisted = persistedSummary.persisted[0];

    return {
      success: true,
      processo: processosCapturados[0],
      processos: processosCapturados,
      processoId: firstPersisted?.processoId,
      created: Boolean(firstPersisted?.created),
      createdCount: persistedSummary.createdCount,
      updatedCount: persistedSummary.updatedCount,
      syncedCount: processosCapturados.length,
      persisted: persistedSummary.persisted,
      movimentacoes: resultado.movimentacoes,
      debug: resultado.debug,
    };
  } catch (error) {
    logger.error("[Juridical Capture] Erro ao resolver captcha:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Captura apenas andamentos de um processo
 */
export async function capturarAndamentosAction(params: {
  processoId: string;
  certificadoId?: string;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const podeCapturar = await checkPermission("processos", "editar");
    if (!podeCapturar) {
      return {
        success: false,
        error: "Sem permissão para capturar andamentos.",
      };
    }

    const processo = await prisma.processo.findFirst({
      where: {
        id: params.processoId,
        tenantId: user.tenantId,
      },
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    const resultado = await capturarAndamentos({
      numeroProcesso: processo.numeroCnj || processo.numero,
      tenantId: user.tenantId,
      tribunalId: processo.tribunalId || undefined,
      certificadoId: params.certificadoId,
      processoId: params.processoId,
    });

    if (!resultado.success) {
      return resultado;
    }

    const persistSummary = await persistCapturedMovimentacoes({
      tenantId: user.tenantId,
      processoId: params.processoId,
      criadoPorId: session.user.id!,
      movimentacoes: resultado.movimentacoes,
    });

    logger.info(
      `[Juridical Capture] Andamentos do processo ${params.processoId} capturados (novos: ${persistSummary.created}, ignorados: ${persistSummary.skipped})`,
    );

    return {
      success: true,
      movimentacoes: resultado.movimentacoes,
      createdMovimentacoes: persistSummary.created,
      skippedMovimentacoes: persistSummary.skipped,
    };
  } catch (error) {
    logger.error("[Juridical Capture] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
