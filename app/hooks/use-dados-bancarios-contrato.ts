"use client";

import useSWR from "swr";

import {
  getDadosBancariosContrato,
  getContasDisponiveisContrato,
} from "@/app/actions/dados-bancarios-contrato";

// ============================================
// TYPES
// ============================================

export interface DadosBancariosContrato {
  id: string;
  banco: {
    codigo: string;
    nome: string;
  };
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoContaBancaria: "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
  chavePix?: string;
  tipoChavePix?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  titularNome: string;
  titularDocumento: string;
  titularEmail?: string;
  titularTelefone?: string;
  principal: boolean;
  ativo: boolean;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar dados bancários de um contrato específico
 */
export function useDadosBancariosContrato(contratoId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    contratoId ? `dados-bancarios-contrato-${contratoId}` : null,
    async () => {
      if (!contratoId) return null;

      const result = await getDadosBancariosContrato(contratoId);

      if (!result.success)
        throw new Error(result.error || "Erro ao buscar dados bancários");

      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    },
  );

  return {
    dadosBancarios: data?.dadosBancarios as DadosBancariosContrato | null,
    isLoading,
    isError: !!error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook para buscar todas as contas bancárias disponíveis para um contrato
 */
export function useContasDisponiveisContrato(contratoId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    contratoId ? `contas-disponiveis-contrato-${contratoId}` : null,
    async () => {
      if (!contratoId) return null;

      const result = await getContasDisponiveisContrato(contratoId);

      if (!result.success)
        throw new Error(result.error || "Erro ao buscar contas disponíveis");

      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    },
  );

  return {
    contas: (data?.contas as DadosBancariosContrato[]) || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    mutate,
  };
}
