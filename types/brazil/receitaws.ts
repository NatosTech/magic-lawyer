/**
 * Tipagens para API ReceitaWS (Consulta CNPJ)
 * https://www.receitaws.com.br/v1/cnpj/{cnpj}
 */

export interface AtividadeReceitaWS {
  code: string;
  text: string;
}

export interface SocioReceitaWS {
  nome: string;
  qual: string;
  pais_origem?: string;
  nome_pais_origem?: string;
  qual_rep_legal?: string;
  nome_rep_legal?: string;
}

export interface ReceitaWSResponse {
  abertura: string;
  situacao: string;
  tipo: string;
  nome: string;
  fantasia?: string;
  porte: string;
  natureza_juridica: string;
  atividade_principal: AtividadeReceitaWS[];
  atividades_secundarias?: AtividadeReceitaWS[];
  qsa?: SocioReceitaWS[];
  logradouro: string;
  numero: string;
  municipio: string;
  bairro: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
  data_situacao: string;
  cnpj: string;
  ultima_atualizacao: string;
  status: string;
  efr?: string;
  motivo_situacao?: string;
  situacao_especial?: string;
  data_situacao_especial?: string;
  capital_social?: string;
  extra?: any;
  billing: {
    free: boolean;
    database: boolean;
  };
}

export interface ReceitaWSError {
  status: "ERROR";
  message: string;
}

// Tipo união para resposta da API
export type ReceitaWSApiResponse = ReceitaWSResponse | ReceitaWSError;

// Tipos para uso interno (normalizados)
export interface CnpjData {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_exterior: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  qualificacao_do_responsavel: number;
  capital_social: number;
  porte: string;
  descricao_porte: string;
  opcao_pelo_simples: boolean;
  data_opcao_pelo_simples: string;
  data_exclusao_do_simples: string;
  opcao_pelo_mei: boolean;
  situacao_especial: string;
  data_situacao_especial: string;
  qsa: SocioCnpj[];
}

export interface SocioCnpj {
  identificador_de_socio: number;
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  codigo_qualificacao_socio: number;
  percentual_capital_social: number;
  data_entrada_sociedade: string;
  cpf_representante_legal: string;
  nome_representante_legal: string;
  codigo_qualificacao_representante_legal: number;
}

// Enums para facilitar o uso
export enum SituacaoCadastral {
  ATIVA = 2,
  SUSPENSA = 3,
  INAPTA = 4,
  BAIXADA = 8,
}

export enum TipoEmpresa {
  MATRIZ = "MATRIZ",
  FILIAL = "FILIAL",
}

export enum PorteEmpresa {
  MICROEMPRESA = "MICROEMPRESA",
  PEQUENO_PORTE = "PEQUENO_PORTE",
  MEDIO_PORTE = "MEDIO_PORTE",
  GRANDE_PORTE = "GRANDE_PORTE",
  DEMAIS = "DEMAIS",
}

export enum QualificacaoSocio {
  ADMINISTRADOR = 5,
  PRESIDENTE = 8,
  DIRETOR = 16,
  SOCIO = 49,
}
