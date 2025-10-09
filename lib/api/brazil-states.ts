import { type EstadoIBGE } from "@/types/brazil";
import logger from "@/lib/logger";

export type EstadoBrasil = EstadoIBGE;

export interface EstadosResponse {
  data: EstadoBrasil[];
}

/**
 * Busca todos os estados do Brasil via API do IBGE
 */
export async function getEstadosBrasil(): Promise<EstadoBrasil[]> {
  try {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar estados: ${response.status}`);
    }

    const estados: EstadoBrasil[] = await response.json();

    return estados;
  } catch (error) {
    logger.error("Erro ao buscar estados do Brasil:", error);

    // Fallback com estados mais comuns em caso de erro
    return [
      {
        id: 35,
        sigla: "SP",
        nome: "São Paulo",
        regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
      },
      {
        id: 33,
        sigla: "RJ",
        nome: "Rio de Janeiro",
        regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
      },
      {
        id: 31,
        sigla: "MG",
        nome: "Minas Gerais",
        regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
      },
      {
        id: 41,
        sigla: "PR",
        nome: "Paraná",
        regiao: { id: 4, sigla: "S", nome: "Sul" },
      },
      {
        id: 43,
        sigla: "RS",
        nome: "Rio Grande do Sul",
        regiao: { id: 4, sigla: "S", nome: "Sul" },
      },
      {
        id: 42,
        sigla: "SC",
        nome: "Santa Catarina",
        regiao: { id: 4, sigla: "S", nome: "Sul" },
      },
      {
        id: 53,
        sigla: "DF",
        nome: "Distrito Federal",
        regiao: { id: 5, sigla: "CO", nome: "Centro-Oeste" },
      },
      {
        id: 29,
        sigla: "BA",
        nome: "Bahia",
        regiao: { id: 2, sigla: "NE", nome: "Nordeste" },
      },
      {
        id: 23,
        sigla: "CE",
        nome: "Ceará",
        regiao: { id: 2, sigla: "NE", nome: "Nordeste" },
      },
      {
        id: 15,
        sigla: "PA",
        nome: "Pará",
        regiao: { id: 1, sigla: "N", nome: "Norte" },
      },
    ];
  }
}

/**
 * Busca estados do Brasil com cache
 */
let estadosCache: EstadoBrasil[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export async function getEstadosBrasilCached(): Promise<EstadoBrasil[]> {
  const now = Date.now();

  // Verificar se o cache ainda é válido
  if (estadosCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    return estadosCache;
  }

  // Buscar novos dados
  estadosCache = await getEstadosBrasil();
  cacheTimestamp = now;

  return estadosCache;
}
