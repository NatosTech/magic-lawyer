/**
 * Serviço de captura de processos jurídicos
 * 
 * Coordena a captura de dados de diferentes fontes (API, scraping)
 * e normaliza os dados para o formato unificado
 */

import {
  ProcessoJuridico,
  CapturaResult,
  TribunalSistema,
} from "@/lib/api/juridical/types";
import { consultarProcesso } from "@/lib/api/juridical/scraping";
import { consultarPJe } from "@/lib/api/juridical/pje";
import { normalizarProcesso } from "@/lib/api/juridical/normalization";
import { getTribunalConfig } from "@/lib/api/juridical/config";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface CapturaProcessoParams {
  numeroProcesso: string;
  tenantId: string;
  tribunalId?: string;
  tribunalSigla?: string;
  certificadoId?: string;
  processoId?: string; // ID do processo no nosso sistema (se já existe)
}

/**
 * Captura processo de qualquer fonte disponível
 */
export async function capturarProcesso(
  params: CapturaProcessoParams,
): Promise<CapturaResult> {
  const { numeroProcesso, tenantId, tribunalId, tribunalSigla, certificadoId } =
    params;

  try {
    logger.info(
      `[Capture Service] Capturando processo: ${numeroProcesso} (tenant: ${tenantId})`,
    );

    // Buscar tribunal se não foi fornecido
    let tribunal;
    if (tribunalId) {
      tribunal = await prisma.tribunal.findFirst({
        where: { id: tribunalId, tenantId },
      });
    }

    const sigla = tribunalSigla || tribunal?.sigla;
    const tribunalConfig = sigla ? getTribunalConfig({ sigla }) : undefined;

    // Decidir qual método usar
    let resultado: CapturaResult;

    if (tribunalConfig?.sistema === TribunalSistema.PJE) {
      // Usar API PJe (requer certificado)
      if (!certificadoId) {
        return {
          success: false,
          error: "Certificado digital é obrigatório para PJe",
        };
      }

      resultado = await consultarPJe({
        numeroProcesso,
        tribunalId,
        certificadoId: certificadoId || undefined,
      });
    } else if (tribunalConfig?.scrapingDisponivel) {
      // Usar web scraping
      resultado = await consultarProcesso(numeroProcesso, sigla || undefined);
    } else {
      return {
        success: false,
        error: `Nenhum método de captura disponível para este tribunal`,
      };
    }

    if (!resultado.success || !resultado.processo) {
      return resultado;
    }

    // Normalizar dados
    const processoNormalizado = normalizarProcesso(resultado.processo);

    // Vincular ao nosso processo se já existe
    if (params.processoId) {
      // TODO: Atualizar processo existente com dados capturados
      logger.info(
        `[Capture Service] Processo ${params.processoId} será atualizado com dados capturados`,
      );
    }

    return {
      ...resultado,
      processo: processoNormalizado,
    };
  } catch (error) {
    logger.error("[Capture Service] Erro ao capturar processo:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Captura apenas andamentos de um processo
 */
export async function capturarAndamentos(
  params: CapturaProcessoParams,
): Promise<CapturaResult> {
  // Similar a capturarProcesso, mas foca apenas em movimentações
  const resultado = await capturarProcesso(params);

  if (!resultado.success || !resultado.processo) {
    return resultado;
  }

  // Retornar apenas movimentações
  return {
    success: true,
    movimentacoes: resultado.processo.movimentacoes || [],
    tempoResposta: resultado.tempoResposta,
  };
}



