import useSWR from "swr";
import { getAdvogadosComissoes, getAdvogadoComissoes, getComissoesGeral, ComissaoData, ComissaoFilters } from "@/app/actions/advogados-comissoes";

export function useAdvogadosComissoes(filters?: ComissaoFilters) {
  const { data, error, isLoading, mutate } = useSWR<ComissaoData[]>(
    filters ? `advogados-comissoes-${JSON.stringify(filters)}` : "advogados-comissoes",
    async () => {
      const result = await getAdvogadosComissoes(filters);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar comissões dos advogados");
      }

      return result.data || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Atualizar a cada 30 segundos
    }
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

export function useAdvogadoComissoes(advogadoId: string, filters?: ComissaoFilters) {
  const { data, error, isLoading, mutate } = useSWR<ComissaoData>(
    advogadoId ? `advogado-comissoes-${advogadoId}-${JSON.stringify(filters || {})}` : null,
    async () => {
      const result = await getAdvogadoComissoes(advogadoId, filters);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar comissões do advogado");
      }

      return result.data!;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
    }
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

export function useComissoesGeral(filters?: ComissaoFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    filters ? `comissoes-geral-${JSON.stringify(filters)}` : "comissoes-geral",
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
      refreshInterval: 30000,
    }
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
