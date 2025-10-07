import useSWR from "swr";

import { getAllContratos } from "@/app/actions/contratos";

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
