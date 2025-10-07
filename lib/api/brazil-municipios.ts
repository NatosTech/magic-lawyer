import { type MunicipioIBGE } from "@/types/brazil";

/**
 * Busca todos os municípios de um estado específico via API do IBGE
 */
export async function getMunicipiosPorEstado(
  estadoId: number,
): Promise<MunicipioIBGE[]> {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios?orderBy=nome`,
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar municípios: ${response.status}`);
    }

    const municipios: MunicipioIBGE[] = await response.json();

    return municipios;
  } catch (error) {
    console.error("Erro ao buscar municípios do estado:", error);
    throw error;
  }
}

/**
 * Busca municípios por estado com cache
 */
const municipiosCache = new Map<number, MunicipioIBGE[]>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export async function getMunicipiosPorEstadoCached(
  estadoId: number,
): Promise<MunicipioIBGE[]> {
  const now = Date.now();

  // Verificar se o cache ainda é válido
  const cached = municipiosCache.get(estadoId);

  if (cached && now - (cached as any).timestamp < CACHE_DURATION) {
    return cached;
  }

  // Buscar novos dados
  const municipios = await getMunicipiosPorEstado(estadoId);

  // Adicionar timestamp ao cache
  (municipios as any).timestamp = now;
  municipiosCache.set(estadoId, municipios);

  return municipios;
}

/**
 * Busca municípios por sigla do estado
 */
export async function getMunicipiosPorSiglaEstado(
  siglaEstado: string,
): Promise<MunicipioIBGE[]> {
  // Mapear sigla para ID do estado
  const estadoIdMap: Record<string, number> = {
    AC: 12,
    AL: 27,
    AP: 16,
    AM: 13,
    BA: 29,
    CE: 23,
    DF: 53,
    ES: 32,
    GO: 52,
    MA: 21,
    MT: 51,
    MS: 50,
    MG: 31,
    PA: 15,
    PB: 25,
    PR: 41,
    PE: 26,
    PI: 22,
    RJ: 33,
    RN: 24,
    RS: 43,
    RO: 11,
    RR: 14,
    SC: 42,
    SP: 35,
    SE: 28,
    TO: 17,
  };

  const estadoId = estadoIdMap[siglaEstado.toUpperCase()];

  if (!estadoId) {
    throw new Error(`Estado não encontrado: ${siglaEstado}`);
  }

  return getMunicipiosPorEstadoCached(estadoId);
}
