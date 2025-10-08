import useSWR from "swr";

import {
  getAllProcessos,
  getProcessosDoClienteLogado,
  getProcessosDoCliente,
  getProcessoDetalhado,
  getDocumentosProcesso,
  getEventosProcesso,
  getMovimentacoesProcesso,
} from "@/app/actions/processos";
import type {
  Processo as ProcessoDTO,
  ProcessoDetalhado,
  ProcessoDocumento,
  ProcessoEvento,
  ProcessoMovimentacao,
} from "@/app/actions/processos";

/**
 * Hook para buscar todos os processos que o usuário pode ver
 * - ADMIN: Todos do tenant
 * - ADVOGADO: Dos clientes vinculados
 * - CLIENTE: Apenas os próprios
 */
export function useAllProcessos() {
  const { data, error, isLoading, mutate } = useSWR<ProcessoDTO[]>(
    "all-processos",
    async () => {
      const result = await getAllProcessos();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar processos");
      }

      return result.processos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    processos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar processos do cliente logado (quando usuário É um cliente)
 */
export function useProcessosClienteLogado() {
  const { data, error, isLoading, mutate } = useSWR<ProcessoDTO[]>(
    "processos-cliente-logado",
    async () => {
      const result = await getProcessosDoClienteLogado();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar processos");
      }

      return result.processos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    processos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar processos de um cliente específico (para advogados)
 */
export function useProcessosCliente(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcessoDTO[] | null>(
    clienteId ? `processos-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return null;
      const result = await getProcessosDoCliente(clienteId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar processos");
      }

      return result.processos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    processos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar detalhes completos de um processo
 */
export function useProcessoDetalhado(processoId: string | null) {
  type ProcessoDetalhadoResponse = {
    processo: ProcessoDetalhado | null;
    isCliente: boolean;
  };

  const { data, error, isLoading, mutate } = useSWR<ProcessoDetalhadoResponse | null>(
    processoId ? `processo-${processoId}` : null,
    async () => {
      if (!processoId) return null;
      const result = await getProcessoDetalhado(processoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar processo");
      }

      return {
        processo: result.processo || null,
        isCliente: result.isCliente || false,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    processo: data?.processo ?? null,
    isCliente: data?.isCliente ?? false,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar documentos de um processo
 */
export function useDocumentosProcesso(processoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcessoDocumento[] | null>(
    processoId ? `documentos-processo-${processoId}` : null,
    async () => {
      if (!processoId) return null;
      const result = await getDocumentosProcesso(processoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar documentos");
      }

      return result.documentos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    documentos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar eventos de um processo
 */
export function useEventosProcesso(processoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcessoEvento[] | null>(
    processoId ? `eventos-processo-${processoId}` : null,
    async () => {
      if (!processoId) return null;
      const result = await getEventosProcesso(processoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar eventos");
      }

      return result.eventos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    eventos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar movimentações de um processo
 */
export function useMovimentacoesProcesso(processoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProcessoMovimentacao[] | null>(
    processoId ? `movimentacoes-processo-${processoId}` : null,
    async () => {
      if (!processoId) return null;
      const result = await getMovimentacoesProcesso(processoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar movimentações");
      }

      return result.movimentacoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    movimentacoes: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
