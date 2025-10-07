import useSWR from "swr";
import {
  getClientesAdvogado,
  getAllClientesTenant,
  getClienteComProcessos,
  searchClientes,
  getContratosCliente,
  getDocumentosCliente,
  getProcuracoesCliente,
  type Cliente,
  type ClienteComProcessos,
  type ClientesFiltros,
} from "@/app/actions/clientes";

/**
 * Hook para buscar clientes do advogado logado
 */
export function useClientesAdvogado() {
  const { data, error, isLoading, mutate } = useSWR(
    "clientes-advogado",
    async () => {
      const result = await getClientesAdvogado();
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar clientes");
      }
      return result.clientes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    clientes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar todos os clientes do tenant (ADMIN)
 */
export function useAllClientes() {
  const { data, error, isLoading, mutate } = useSWR(
    "clientes-tenant",
    async () => {
      const result = await getAllClientesTenant();
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar clientes");
      }
      return result.clientes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    clientes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar detalhes de um cliente com seus processos
 */
export function useClienteComProcessos(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clienteId ? `cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return null;
      const result = await getClienteComProcessos(clienteId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar cliente");
      }
      return result.cliente || null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    cliente: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar clientes com filtros
 */
export function useClientesFiltrados(filtros: ClientesFiltros) {
  const key = `clientes-filtrados-${JSON.stringify(filtros)}`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const result = await searchClientes(filtros);
      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar clientes");
      }
      return result.clientes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Evita chamadas duplicadas em 2 segundos
    }
  );

  return {
    clientes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar contratos de um cliente
 */
export function useContratosCliente(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clienteId ? `contratos-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return null;
      const result = await getContratosCliente(clienteId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar contratos");
      }
      return result.contratos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    contratos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar documentos de um cliente
 */
export function useDocumentosCliente(clienteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clienteId ? `documentos-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return null;
      const result = await getDocumentosCliente(clienteId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar documentos");
      }
      return result.documentos || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    documentos: data,
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
  const { data, error, isLoading, mutate } = useSWR(
    clienteId ? `procuracoes-cliente-${clienteId}` : null,
    async () => {
      if (!clienteId) return null;
      const result = await getProcuracoesCliente(clienteId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar procurações");
      }
      return result.procuracoes || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    procuracoes: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
