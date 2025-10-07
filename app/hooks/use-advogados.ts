import useSWR from "swr";

import {
  getAdvogadosDisponiveis,
  type AdvogadoSelectItem,
} from "@/app/actions/advogados";

export function useAdvogadosDisponiveis() {
  const { data, error, isLoading, mutate } = useSWR<AdvogadoSelectItem[]>(
    "advogados-disponiveis",
    async () => {
      const result = await getAdvogadosDisponiveis();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar advogados");
      }

      return result.advogados || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    advogados: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
