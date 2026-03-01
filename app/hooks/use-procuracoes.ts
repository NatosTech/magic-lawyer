import useSWR from "swr";

import {
  getAllProcuracoes,
  getProcuracoesPaginated,
  getProcuracaoById,
  getProcuracoesCliente,
  type ProcuracaoListFilters,
  type ProcuracaoListPaginatedResult,
  type ProcuracaoListItem,
} from "@/app/actions/procuracoes";

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar todas as procurações
 */
export function useAllProcuracoes() {
  const { data, error, isLoading, mutate } = useSWR<ProcuracaoListItem[]>(
    "all-procuracoes",
    async () => {
      const result = await getAllProcuracoes();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procurações");
      }

      return result.procuracoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    procuracoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar procurações com paginação server-side
 */
export function useProcuracoesPaginated(params: {
  page: number;
  pageSize: number;
  filtros?: ProcuracaoListFilters;
}) {
  const { page, pageSize, filtros } = params;

  const key = [
    "procuracoes-paginated",
    page,
    pageSize,
    filtros?.search ?? "",
    filtros?.status ?? "",
    filtros?.clienteId ?? "",
    filtros?.advogadoId ?? "",
    filtros?.emitidaPor ?? "",
  ];

  const { data, error, isLoading, mutate } =
    useSWR<ProcuracaoListPaginatedResult>(key, async () => {
      const result = await getProcuracoesPaginated({
        page,
        pageSize,
        filtros,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Erro ao carregar procurações");
      }

      return result.data;
    }, {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    });

  return {
    data,
    procuracoes: data?.items ?? [],
    metrics: data?.metrics,
    pagination: data
      ? {
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        }
      : undefined,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar uma procuração específica
 */
export function useProcuracao(procuracaoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcuracaoListItem | null>(
    procuracaoId ? `procuracao-${procuracaoId}` : null,
    async () => {
      if (!procuracaoId) return null;
      const result = await getProcuracaoById(procuracaoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procuração");
      }

      return result.procuracao ?? null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    procuracao: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar procurações de um cliente
 */
export function useProcuracoesCliente(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcuracaoListItem[]>(
    clienteId ? `procuracoes-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return [];
      const result = await getProcuracoesCliente(clienteId);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar procurações do cliente",
        );
      }

      return result.procuracoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    procuracoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
