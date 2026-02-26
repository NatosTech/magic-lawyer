import useSWR from "swr";

import {
  getAdvogadosComissoes,
  getAdvogadoComissoes,
  getComissoesGeral,
  ComissaoData,
  ComissaoFilters,
} from "@/app/actions/advogados-comissoes";

interface HookOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

export function useAdvogadosComissoes(
  filters?: ComissaoFilters,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR<ComissaoData[]>(
    enabled
      ? filters
        ? `advogados-comissoes-${JSON.stringify(filters)}`
        : "advogados-comissoes"
      : null,
    async () => {
      const result = await getAdvogadosComissoes(filters);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar comissões dos advogados",
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
    comissoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

export function useAdvogadoComissoes(
  advogadoId: string,
  filters?: ComissaoFilters,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR<ComissaoData>(
    enabled && advogadoId
      ? `advogado-comissoes-${advogadoId}-${JSON.stringify(filters || {})}`
      : null,
    async () => {
      const result = await getAdvogadoComissoes(advogadoId, filters);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar comissões do advogado",
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
    comissoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

export function useComissoesGeral(
  filters?: ComissaoFilters,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR(
    enabled
      ? filters
        ? `comissoes-geral-${JSON.stringify(filters)}`
        : "comissoes-geral"
      : null,
    async () => {
      const result = await getComissoesGeral(filters);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar comissões gerais");
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
    comissoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
