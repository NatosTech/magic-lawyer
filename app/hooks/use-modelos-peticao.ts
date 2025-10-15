import useSWR from "swr";

import {
  listModelosPeticao,
  getModeloPeticao,
  getCategoriasModeloPeticao,
  getTiposModeloPeticao,
  type ModeloPeticaoFilters,
} from "@/app/actions/modelos-peticao";

/**
 * Hook para listar modelos de petição com filtros
 */
export function useModelosPeticao(filters: ModeloPeticaoFilters = {}) {
  const key = ["modelos-peticao", JSON.stringify(filters)];

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const result = await listModelosPeticao(filters);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  });

  return {
    modelos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar um modelo de petição específico
 */
export function useModeloPeticao(id: string | null) {
  const key = id ? ["modelo-peticao", id] : null;

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    if (!id) return null;
    const result = await getModeloPeticao(id);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  });

  return {
    modelo: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar categorias de modelos
 */
export function useCategoriasModeloPeticao() {
  const { data, error, isLoading, mutate } = useSWR(
    "categorias-modelo-peticao",
    async () => {
      const result = await getCategoriasModeloPeticao();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  );

  return {
    categorias: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar tipos de modelos
 */
export function useTiposModeloPeticao() {
  const { data, error, isLoading, mutate } = useSWR(
    "tipos-modelo-peticao",
    async () => {
      const result = await getTiposModeloPeticao();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  );

  return {
    tipos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook para listar modelos ativos (para selects)
 */
export function useModelosPeticaoAtivos() {
  const { data, error, isLoading, mutate } = useSWR(
    "modelos-peticao-ativos",
    async () => {
      const result = await listModelosPeticao({ ativo: true });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  );

  return {
    modelos: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
