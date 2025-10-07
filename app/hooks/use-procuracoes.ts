import useSWR from "swr";
import { getAllProcuracoes, getProcuracaoById, getProcuracoesCliente } from "@/app/actions/procuracoes";

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar todas as procurações
 */
export function useAllProcuracoes() {
  const { data, error, isLoading, mutate } = useSWR(
    "all-procuracoes",
    async () => {
      const result = await getAllProcuracoes();
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procurações");
      }
      return result.procuracoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    procuracoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar uma procuração específica
 */
export function useProcuracao(procuracaoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    procuracaoId ? `procuracao-${procuracaoId}` : null,
    async () => {
      if (!procuracaoId) return null;
      const result = await getProcuracaoById(procuracaoId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procuração");
      }
      return result.procuracao;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    procuracao: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar procurações de um cliente
 */
export function useProcuracoesCliente(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clienteId ? `procuracoes-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return [];
      const result = await getProcuracoesCliente(clienteId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procurações do cliente");
      }
      return result.procuracoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    procuracoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
