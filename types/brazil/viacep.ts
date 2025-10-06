/**
 * Tipagens para API ViaCEP
 * https://viacep.com.br/ws/{cep}/json/
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface ViaCepError {
  erro: true;
}

// Tipo união para resposta da API
export type ViaCepApiResponse = ViaCepResponse | ViaCepError;

// Tipos para uso interno (normalizados)
export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

// Enums para facilitar o uso
export enum RegiaoBrasil {
  NORTE = "Norte",
  NORDESTE = "Nordeste", 
  SUDESTE = "Sudeste",
  SUL = "Sul",
  CENTRO_OESTE = "Centro-Oeste"
}

export enum UfBrasil {
  AC = "AC", // Acre
  AL = "AL", // Alagoas
  AP = "AP", // Amapá
  AM = "AM", // Amazonas
  BA = "BA", // Bahia
  CE = "CE", // Ceará
  DF = "DF", // Distrito Federal
  ES = "ES", // Espírito Santo
  GO = "GO", // Goiás
  MA = "MA", // Maranhão
  MT = "MT", // Mato Grosso
  MS = "MS", // Mato Grosso do Sul
  MG = "MG", // Minas Gerais
  PA = "PA", // Pará
  PB = "PB", // Paraíba
  PR = "PR", // Paraná
  PE = "PE", // Pernambuco
  PI = "PI", // Piauí
  RJ = "RJ", // Rio de Janeiro
  RN = "RN", // Rio Grande do Norte
  RS = "RS", // Rio Grande do Sul
  RO = "RO", // Rondônia
  RR = "RR", // Roraima
  SC = "SC", // Santa Catarina
  SP = "SP", // São Paulo
  SE = "SE", // Sergipe
  TO = "TO"  // Tocantins
}
