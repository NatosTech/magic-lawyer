import useSWR from "swr";

import { getEstadosBrasilAction } from "@/app/actions/brazil-apis";

export function useEstadosBrasil() {
  const { data, error, isLoading } = useSWR(
    "estados-brasil",
    async () => {
      const result = await getEstadosBrasilAction();

      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar estados do Brasil");
      }

      return (result.estados || []).map((estado) => estado.sigla);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000,
      // Cache permanente - estados não mudam
    },
  );

  return {
    ufs: data || [],
    isLoading,
    error,
  };
}
