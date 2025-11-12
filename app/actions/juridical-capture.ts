"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";
import { capturarProcesso, capturarAndamentos } from "@/app/lib/juridical/capture-service";

/**
 * Captura processo via Server Action
 */
export async function capturarProcessoAction(params: {
  numeroProcesso: string;
  tribunalId?: string;
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

    // Verificar permissão
    // TODO: Verificar se usuário tem permissão para capturar processos

    const resultado = await capturarProcesso({
      numeroProcesso: params.numeroProcesso,
      tenantId: user.tenantId,
      tribunalId: params.tribunalId,
      certificadoId: params.certificadoId,
    });

    if (!resultado.success) {
      return resultado;
    }

    // TODO: Salvar processo no banco de dados
    // Criar ou atualizar Processo com dados capturados

    logger.info(
      `[Juridical Capture] Processo ${params.numeroProcesso} capturado com sucesso`,
    );

    return {
      success: true,
      processo: resultado.processo,
      movimentacoes: resultado.movimentacoes,
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

    // Buscar processo
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

    // TODO: Salvar movimentações no banco
    // Criar ou atualizar MovimentacaoProcesso

    logger.info(
      `[Juridical Capture] Andamentos do processo ${params.processoId} capturados`,
    );

    return {
      success: true,
      movimentacoes: resultado.movimentacoes,
    };
  } catch (error) {
    logger.error("[Juridical Capture] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

