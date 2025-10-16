import useSWR from "swr";

import { getAllContratos, getContratoById, getContratosComParcelas } from "@/app/actions/contratos";

/**
 * Hook para buscar todos os contratos do tenant
 */
export function useAllContratos() {
  const { data, error, isLoading, mutate } = useSWR(
    "contratos-all",
    async () => {
      const result = await getAllContratos();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar contratos");
      }

      return result.contratos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contratos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar um contrato específico
 */
export function useContratoDetalhado(contratoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    contratoId ? `contrato-${contratoId}` : null,
    async () => {
      if (!contratoId) return null;

      const result = await getContratoById(contratoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar contrato");
      }

      return result.contrato || null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contrato: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar contratos com informações de parcelas
 */
export function useContratosComParcelas() {
  const { data, error, isLoading, mutate } = useSWR(
    "contratos-com-parcelas",
    async () => {
      const result = await getContratosComParcelas();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar contratos");
      }

      return result.contratos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contratos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
