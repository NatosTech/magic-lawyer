/**
 * Tipagens para APIs brasileiras
 * 
 * Este módulo centraliza todas as tipagens relacionadas às APIs oficiais do Brasil:
 * - IBGE: Estados, municípios e regiões
 * - ViaCEP: Consulta de CEP
 * - ReceitaWS: Consulta de CNPJ
 */

// Re-exportações do IBGE
export type {
  EstadoIBGE,
  RegiaoIBGE,
  MunicipioIBGE,
  DistritoIBGE,
  EstadosResponse,
  MunicipiosResponse,
  DistritosResponse
} from "./ibge";

export {
  RegiaoSigla,
  RegiaoNome
} from "./ibge";

// Re-exportações do ViaCEP
export type {
  ViaCepResponse,
  ViaCepError,
  ViaCepApiResponse,
  CepData
} from "./viacep";

export {
  RegiaoBrasil,
  UfBrasil
} from "./viacep";

// Re-exportações do ReceitaWS
export type {
  ReceitaWSResponse,
  ReceitaWSError,
  ReceitaWSApiResponse,
  CnpjData,
  SocioCnpj,
  AtividadeReceitaWS,
  SocioReceitaWS
} from "./receitaws";

export {
  SituacaoCadastral,
  TipoEmpresa,
  PorteEmpresa,
  QualificacaoSocio
} from "./receitaws";

// Tipos comuns para todas as APIs
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

// Tipos para cache
export interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Tipos para paginação (quando aplicável)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
