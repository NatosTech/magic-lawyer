import { type CnpjData, type ReceitaWSResponse } from "@/types/brazil";
import logger from "@/lib/logger";

export type CnpjResponse = ReceitaWSResponse;

/**
 * Busca dados do CNPJ via API pública
 */
export async function buscarCnpj(cnpj: string): Promise<CnpjData | null> {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  // Valida se o CNPJ tem 14 dígitos
  if (cnpjLimpo.length !== 14) {
    throw new Error("CNPJ deve ter 14 dígitos");
  }

  try {
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`,
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar CNPJ: ${response.status}`);
    }

    const data: CnpjResponse = await response.json();

    // Verifica se o CNPJ foi encontrado
    if (data.status === "ERROR") {
      throw new Error("CNPJ não encontrado");
    }

    return {
      cnpj: data.cnpj,
      identificador_matriz_filial: 0, // Não disponível na API
      descricao_matriz_filial: data.tipo,
      razao_social: data.nome,
      nome_fantasia: data.fantasia || "",
      situacao_cadastral: data.situacao === "ATIVA" ? 2 : 8,
      descricao_situacao_cadastral: data.situacao,
      data_situacao_cadastral: data.data_situacao,
      motivo_situacao_cadastral: 0,
      nome_cidade_exterior: "",
      codigo_natureza_juridica: 0,
      data_inicio_atividade: data.abertura,
      cnae_fiscal: parseInt(data.atividade_principal[0]?.code || "0"),
      cnae_fiscal_descricao: data.atividade_principal[0]?.text || "",
      descricao_tipo_logradouro: "",
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: "",
      bairro: data.bairro,
      cep: data.cep,
      uf: data.uf,
      codigo_municipio: 0,
      municipio: data.municipio,
      ddd_telefone_1: data.telefone ?? "",
      ddd_telefone_2: "",
      ddd_fax: "",
      qualificacao_do_responsavel: 0,
      capital_social: parseFloat(
        data.capital_social?.replace(/[^\d,]/g, "").replace(",", ".") || "0",
      ),
      porte: data.porte,
      descricao_porte: data.porte,
      opcao_pelo_simples: false,
      data_opcao_pelo_simples: "",
      data_exclusao_do_simples: "",
      opcao_pelo_mei: false,
      situacao_especial: data.situacao_especial || "",
      data_situacao_especial: data.data_situacao_especial || "",
      qsa:
        data.qsa?.map((socio) => ({
          identificador_de_socio: 0,
          nome_socio: socio.nome,
          cnpj_cpf_do_socio: "",
          codigo_qualificacao_socio: 0,
          percentual_capital_social: 0,
          data_entrada_sociedade: "",
          cpf_representante_legal: "",
          nome_representante_legal: socio.nome_rep_legal || "",
          codigo_qualificacao_representante_legal: 0,
        })) || [],
    };
  } catch (error) {
    logger.error("Erro ao buscar CNPJ:", error);
    throw error;
  }
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatarCnpj(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length === 14) {
    return `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8, 12)}-${cnpjLimpo.slice(12)}`;
  }

  return cnpj;
}

/**
 * Valida se o CNPJ está no formato correto
 */
export function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  return cnpjLimpo.length === 14;
}

/**
 * Busca CNPJ com cache para evitar requisições desnecessárias
 */
const cnpjCache = new Map<string, CnpjData>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export async function buscarCnpjCached(cnpj: string): Promise<CnpjData | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  const now = Date.now();

  // Verificar cache
  const cached = cnpjCache.get(cnpjLimpo);

  if (cached && now - (cached as any).timestamp < CACHE_DURATION) {
    return cached;
  }

  // Buscar novo dado
  const data = await buscarCnpj(cnpj);

  if (data) {
    (data as any).timestamp = now;
    cnpjCache.set(cnpjLimpo, data);
  }

  return data;
}
