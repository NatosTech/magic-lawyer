/**
 * Configuração de tribunais e sistemas disponíveis
 */

import { TribunaisConfig, TribunalSistema, EsferaTribunal } from "./types";

export const TRIBUNAIS_CONFIG: TribunaisConfig[] = [
  // Tribunais com PJe
  {
    nome: "Tribunal Regional Federal da 1ª Região",
    sigla: "TRF1",
    esfera: EsferaTribunal.FEDERAL,
    uf: "DF",
    sistema: TribunalSistema.PJE,
    urlBase: "https://pje.trf1.jus.br",
    requerCertificado: true,
    apiDisponivel: true,
    scrapingDisponivel: false,
  },
  {
    nome: "Tribunal Regional do Trabalho da 5ª Região",
    sigla: "TRT5",
    esfera: EsferaTribunal.TRABALHISTA,
    uf: "BA",
    sistema: TribunalSistema.PJE,
    urlBase: "https://pje.trt5.jus.br",
    requerCertificado: true,
    apiDisponivel: true,
    scrapingDisponivel: false,
  },
  // Tribunais com e-SAJ (web scraping)
  {
    nome: "Tribunal de Justiça da Bahia",
    sigla: "TJBA",
    esfera: EsferaTribunal.ESTADUAL,
    uf: "BA",
    sistema: TribunalSistema.ESAJ,
    urlBase: "https://www5.tjba.jus.br",
    urlConsulta: "https://www5.tjba.jus.br/esaj/consultas/consulta_processual",
    requerCertificado: false,
    apiDisponivel: false,
    scrapingDisponivel: true,
    observacoes: "Sistema e-SAJ, permite consulta pública sem certificado",
  },
  {
    nome: "Tribunal de Justiça de São Paulo",
    sigla: "TJSP",
    esfera: EsferaTribunal.ESTADUAL,
    uf: "SP",
    sistema: TribunalSistema.ESAJ,
    urlBase: "https://www.tjsp.jus.br",
    urlConsulta: "https://esaj.tjsp.jus.br/cjsg/consultaCompleta.do",
    requerCertificado: false,
    apiDisponivel: false,
    scrapingDisponivel: true,
  },
  // Adicione mais tribunais conforme necessário
];

/**
 * Busca configuração de tribunal por diferentes critérios
 */
export function getTribunalConfig(
  criteria: Partial<TribunaisConfig>,
): TribunaisConfig | undefined {
  return TRIBUNAIS_CONFIG.find((tribunal) => {
    if (criteria.sigla && tribunal.sigla !== criteria.sigla) return false;
    if (criteria.uf && tribunal.uf !== criteria.uf) return false;
    if (criteria.esfera && tribunal.esfera !== criteria.esfera) return false;
    if (criteria.sistema && tribunal.sistema !== criteria.sistema) return false;
    return true;
  });
}

/**
 * Lista tribunais disponíveis para scraping (não requerem certificado)
 */
export function getTribunaisScrapingDisponiveis(): TribunaisConfig[] {
  return TRIBUNAIS_CONFIG.filter((t) => t.scrapingDisponivel === true);
}

/**
 * Lista tribunais disponíveis via API (podem requerer certificado)
 */
export function getTribunaisApiDisponiveis(): TribunaisConfig[] {
  return TRIBUNAIS_CONFIG.filter((t) => t.apiDisponivel === true);
}








