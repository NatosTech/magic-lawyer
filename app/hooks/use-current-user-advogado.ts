import useSWR from "swr";

import { getCurrentUserAdvogado } from "@/app/actions/advogados";

export function useCurrentUserAdvogado() {
  const { data, error, isLoading, mutate } = useSWR(
    "current-user-advogado",
    async () => {
      const result = await getCurrentUserAdvogado();

      return result.success ? result.data : null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    advogado: data,
    isLoading,
    error,
    mutate,
    refresh: mutate,
  };
}
