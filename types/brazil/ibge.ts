/**
 * Tipagens para API do IBGE (Instituto Brasileiro de Geografia e Estatística)
 * https://servicodados.ibge.gov.br/api/v1/localidades/estados
 */

export interface RegiaoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

export interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
  regiao: RegiaoIBGE;
}

export interface MicrorregiaoIBGE {
  id: number;
  nome: string;
  mesorregiao: {
    id: number;
    nome: string;
    UF: EstadoIBGE;
  };
}

export interface RegiaoImediataIBGE {
  id: number;
  nome: string;
  "regiao-intermediaria": {
    id: number;
    nome: string;
    UF: EstadoIBGE;
  };
}

export interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao: MicrorregiaoIBGE;
  "regiao-imediata": RegiaoImediataIBGE;
}

export interface DistritoIBGE {
  id: number;
  nome: string;
  municipio: MunicipioIBGE;
}

// Tipos de resposta da API
export type EstadosResponse = EstadoIBGE[];
export type MunicipiosResponse = MunicipioIBGE[];
export type DistritosResponse = DistritoIBGE[];

// Enums para facilitar o uso
export enum RegiaoSigla {
  NORTE = "N",
  NORDESTE = "NE",
  SUDESTE = "SE",
  SUL = "S",
  CENTRO_OESTE = "CO",
}

export enum RegiaoNome {
  NORTE = "Norte",
  NORDESTE = "Nordeste",
  SUDESTE = "Sudeste",
  SUL = "Sul",
  CENTRO_OESTE = "Centro-Oeste",
}
