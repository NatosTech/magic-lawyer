import useSWR from "swr";

import { getEstadosBrasilCached } from "@/lib/api/brazil-states";

export function useEstadosBrasil() {
  const { data, error, isLoading } = useSWR(
    "estados-brasil",
    async () => {
      const estados = await getEstadosBrasilCached();
      return estados.map((e) => e.sigla);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache permanente - estados não mudam
    }
  );

  return {
    ufs: data || [],
    isLoading,
    error,
  };
}
