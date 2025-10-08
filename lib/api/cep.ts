import { type CepData, type ViaCepResponse } from "@/types/brazil";

export type CepResponse = ViaCepResponse;

/**
 * Busca dados do CEP via ViaCEP
 */
export async function buscarCep(cep: string): Promise<CepData | null> {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, "");

  // Valida se o CEP tem 8 dígitos
  if (cepLimpo.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar CEP: ${response.status}`);
    }

    const data: CepResponse = await response.json();

    // Verifica se o CEP foi encontrado
    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
      estado: data.uf, // Mapear UF para estado
      regiao: "", // ViaCEP não fornece região, deixar vazio
      ibge: data.ibge,
      gia: data.gia,
      ddd: data.ddd,
      siafi: data.siafi,
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    throw error;
  }
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length === 8) {
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }

  return cep;
}

/**
 * Valida se o CEP está no formato correto
 */
export function validarCep(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, "");

  return cepLimpo.length === 8;
}

/**
 * Busca CEP com cache para evitar requisições desnecessárias
 */
const cepCache = new Map<string, CepData>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export async function buscarCepCached(cep: string): Promise<CepData | null> {
  const cepLimpo = cep.replace(/\D/g, "");
  const now = Date.now();

  // Verificar cache
  const cached = cepCache.get(cepLimpo);

  if (cached && now - (cached as any).timestamp < CACHE_DURATION) {
    return cached;
  }

  // Buscar novo dado
  const data = await buscarCep(cep);

  if (data) {
    (data as any).timestamp = now;
    cepCache.set(cepLimpo, data);
  }

  return data;
}
