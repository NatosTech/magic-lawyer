import useSWR from "swr";

import {
  getAllModelosProcuracao,
  getModeloProcuracaoById,
  getModelosProcuracaoParaSelect,
} from "@/app/actions/modelos-procuracao";

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar todos os modelos de procuração
 */
export function useAllModelosProcuracao() {
  const { data, error, isLoading, mutate } = useSWR(
    "all-modelos-procuracao",
    async () => {
      const result = await getAllModelosProcuracao();

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar modelos de procuração",
        );
      }

      return result.modelos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    modelos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar um modelo específico
 */
export function useModeloProcuracao(modeloId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    modeloId ? `modelo-procuracao-${modeloId}` : null,
    async () => {
      if (!modeloId) return null;
      const result = await getModeloProcuracaoById(modeloId);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar modelo de procuração",
        );
      }

      return result.modelo;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    modelo: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar modelos para select
 */
export function useModelosProcuracaoParaSelect() {
  const { data, error, isLoading, mutate } = useSWR(
    "modelos-procuracao-select",
    async () => {
      const result = await getModelosProcuracaoParaSelect();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar modelos para select");
      }

      return result.modelos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    modelos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
