import useSWR from "swr";

import {
  getAdvogadosPerformance,
  getAdvogadoPerformance,
  getPerformanceGeral,
  type AdvogadoPerformanceData,
  type PerformanceFilters,
} from "@/app/actions/advogados-performance";

interface HookOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

export function useAdvogadosPerformance(
  filters?: PerformanceFilters,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR<AdvogadoPerformanceData[]>(
    enabled
      ? filters
        ? `advogados-performance-${JSON.stringify(filters)}`
        : "advogados-performance"
      : null,
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
      refreshInterval,
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
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR<AdvogadoPerformanceData>(
    enabled && advogadoId
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
      refreshInterval,
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

export function usePerformanceGeral(
  filters?: PerformanceFilters,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR(
    enabled
      ? filters
        ? `performance-geral-${JSON.stringify(filters)}`
        : "performance-geral"
      : null,
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
      refreshInterval,
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
