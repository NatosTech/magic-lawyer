/**
 * Serviço de Web Scraping para consultas processuais públicas
 * 
 * Foco inicial: Tribunais com e-SAJ que permitem consulta pública
 * sem necessidade de certificado digital
 */

import { ProcessoJuridico, MovimentacaoProcesso, ParteProcesso, CapturaResult, TribunalSistema, EsferaTribunal } from "./types";
import { getTribunalConfig } from "./config";
import logger from "@/lib/logger";

interface ScrapingOptions {
  timeout?: number;
  retries?: number;
  delayBetweenRequests?: number;
  userAgent?: string;
}

const DEFAULT_OPTIONS: ScrapingOptions = {
  timeout: 30000, // 30 segundos
  retries: 3,
  delayBetweenRequests: 1000, // 1 segundo entre requisições
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

/**
 * Normaliza número de processo para formato CNJ
 */
export function normalizarNumeroProcesso(numero: string): string {
  // Remove caracteres não numéricos
  const apenasNumeros = numero.replace(/\D/g, "");

  // Se já está no formato CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO), retorna
  if (apenasNumeros.length === 20) {
    return `${apenasNumeros.slice(0, 7)}-${apenasNumeros.slice(7, 9)}.${apenasNumeros.slice(9, 13)}.${apenasNumeros.slice(13, 14)}.${apenasNumeros.slice(14, 16)}.${apenasNumeros.slice(16, 20)}`;
  }

  // Se tem menos de 20 dígitos, tenta completar ou retorna como está
  return numero;
}

/**
 * Consulta processo no TJBA (e-SAJ)
 */
export async function consultarTJBA(
  numeroProcesso: string,
  options: ScrapingOptions = {},
): Promise<CapturaResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);

  try {
    logger.info(`[Scraping TJBA] Consultando processo: ${numeroNormalizado}`);

    // TODO: Implementar scraping real do TJBA
    // Por enquanto, retorna estrutura base
    // Quando implementado, usar biblioteca como Cheerio ou Puppeteer

    const processo: ProcessoJuridico = {
      numeroProcesso: numeroNormalizado,
      tribunalNome: "Tribunal de Justiça da Bahia",
      tribunalSigla: "TJBA",
      sistema: TribunalSistema.ESAJ,
      esfera: EsferaTribunal.ESTADUAL,
      uf: "BA",
      fonte: "SCRAPING",
      capturadoEm: new Date(),
    };

    return {
      success: true,
      processo,
      tempoResposta: 0,
    };
  } catch (error) {
    logger.error(`[Scraping TJBA] Erro ao consultar processo ${numeroNormalizado}:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      tentativas: opts.retries,
    };
  }
}

/**
 * Consulta processo no TJSP (e-SAJ)
 */
export async function consultarTJSP(
  numeroProcesso: string,
  options: ScrapingOptions = {},
): Promise<CapturaResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);

  try {
    logger.info(`[Scraping TJSP] Consultando processo: ${numeroNormalizado}`);

    // TODO: Implementar scraping real do TJSP
    // Por enquanto, retorna estrutura base

    const processo: ProcessoJuridico = {
      numeroProcesso: numeroNormalizado,
      tribunalNome: "Tribunal de Justiça de São Paulo",
      tribunalSigla: "TJSP",
      sistema: TribunalSistema.ESAJ,
      esfera: EsferaTribunal.ESTADUAL,
      uf: "SP",
      fonte: "SCRAPING",
      capturadoEm: new Date(),
    };

    return {
      success: true,
      processo,
      tempoResposta: 0,
    };
  } catch (error) {
    logger.error(`[Scraping TJSP] Erro ao consultar processo ${numeroNormalizado}:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      tentativas: opts.retries,
    };
  }
}

/**
 * Consulta processo genérica - detecta tribunal e chama função apropriada
 */
export async function consultarProcesso(
  numeroProcesso: string,
  tribunalSigla?: string,
  options: ScrapingOptions = {},
): Promise<CapturaResult> {
  const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);

  // Se não especificou tribunal, tenta detectar pelo número
  if (!tribunalSigla) {
    // Lógica de detecção pelo número do processo
    // Por enquanto, tenta TJBA se for Bahia
    tribunalSigla = "TJBA";
  }

  const tribunalConfig = getTribunalConfig({ sigla: tribunalSigla });

  if (!tribunalConfig) {
    return {
      success: false,
      error: `Tribunal não encontrado: ${tribunalSigla}`,
    };
  }

  if (!tribunalConfig.scrapingDisponivel) {
    return {
      success: false,
      error: `Scraping não disponível para ${tribunalConfig.nome}`,
    };
  }

  // Chama função específica baseada no tribunal
  switch (tribunalSigla) {
    case "TJBA":
      return consultarTJBA(numeroNormalizado, options);
    case "TJSP":
      return consultarTJSP(numeroNormalizado, options);
    default:
      return {
        success: false,
        error: `Scraping não implementado para ${tribunalSigla}`,
      };
  }
}

/**
 * Extrai partes do processo a partir do HTML/texto
 */
export function extrairPartes(html: string): ParteProcesso[] {
  // TODO: Implementar parsing real do HTML
  // Por enquanto, retorna array vazio
  return [];
}

/**
 * Extrai movimentações do processo a partir do HTML/texto
 */
export function extrairMovimentacoes(html: string): MovimentacaoProcesso[] {
  // TODO: Implementar parsing real do HTML
  // Por enquanto, retorna array vazio
  return [];
}

