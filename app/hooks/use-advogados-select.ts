import useSWR from "swr";

import {
  getAdvogadosParaSelect,
  type AdvogadoSelectItem,
} from "@/app/actions/advogados";

export function useAdvogadosParaSelect() {
  const { data, error, isLoading, mutate } = useSWR<AdvogadoSelectItem[]>(
    "advogados-para-select",
    async () => {
      const result = await getAdvogadosParaSelect();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar advogados");
      }

      return result.data || [];
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
