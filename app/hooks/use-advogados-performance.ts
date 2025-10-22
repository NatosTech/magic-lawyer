import useSWR from "swr";

import {
  getAdvogadosPerformance,
  getAdvogadoPerformance,
  getPerformanceGeral,
  type AdvogadoPerformanceData,
  type PerformanceFilters,
} from "@/app/actions/advogados-performance";

export function useAdvogadosPerformance(filters?: PerformanceFilters) {
  const { data, error, isLoading, mutate } = useSWR<AdvogadoPerformanceData[]>(
    filters
      ? `advogados-performance-${JSON.stringify(filters)}`
      : "advogados-performance",
    async () => {
      const result = await getAdvogadosPerformance(filters);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar performance dos advogados",
        );
      }

      return result.data || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Atualizar a cada 30 segundos
    },
  );

  return {
    performance: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

export function useAdvogadoPerformance(
  advogadoId: string,
  filters?: PerformanceFilters,
) {
  const { data, error, isLoading, mutate } = useSWR<AdvogadoPerformanceData>(
    advogadoId
      ? `advogado-performance-${advogadoId}-${JSON.stringify(filters || {})}`
      : null,
    async () => {
      const result = await getAdvogadoPerformance(advogadoId, filters);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar performance do advogado",
        );
      }

      return result.data!;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
    },
  );

  return {
    performance: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

export function usePerformanceGeral(filters?: PerformanceFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    filters
      ? `performance-geral-${JSON.stringify(filters)}`
      : "performance-geral",
    async () => {
      const result = await getPerformanceGeral(filters);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar performance geral");
      }

      return result.data!;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
    },
  );

  return {
    performance: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
