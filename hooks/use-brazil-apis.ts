"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { getEstadosBrasilAction, getMunicipiosPorEstadoAction, buscarCepAction, buscarCnpjAction } from "@/app/actions/brazil-apis";
import { type EstadoIBGE, type MunicipioIBGE, type CepData, type CnpjData } from "@/types/brazil";

/**
 * Hook para buscar estados do Brasil com SWR
 */
export function useEstadosBrasil() {
  const { data, error, isLoading, mutate } = useSWR(
    "estados-brasil",
    async () => {
      const result = await getEstadosBrasilAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.estados;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 horas
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    estados: data as EstadoIBGE[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar estados do Brasil com paginação
 */
export function useEstadosBrasilInfinite() {
  const [items, setItems] = useState<EstadoIBGE[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10; // Número de itens por página

  const loadEstados = useCallback(async (currentOffset: number) => {
    try {
      setIsLoading(true);

      const result = await getEstadosBrasilAction();
      if (!result.success) {
        throw new Error(result.error);
      }

      const allEstados = result.estados || [];
      const startIndex = currentOffset;
      const endIndex = startIndex + limit;
      const newItems = allEstados.slice(startIndex, endIndex);

      setHasMore(endIndex < allEstados.length);
      setItems((prevItems) => (currentOffset === 0 ? newItems : [...prevItems, ...newItems]));
    } catch (error) {
      console.error("Erro ao carregar estados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstados(offset);
  }, [loadEstados, offset]);

  const onLoadMore = useCallback(() => {
    const newOffset = offset + limit;
    setOffset(newOffset);
  }, [offset, limit]);

  return {
    items,
    hasMore,
    isLoading,
    onLoadMore,
  };
}

/**
 * Hook para buscar municípios por estado com SWR
 */
export function useMunicipiosPorEstado(siglaEstado: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    siglaEstado ? `municipios-${siglaEstado}` : null,
    async () => {
      if (!siglaEstado) return null;
      const result = await getMunicipiosPorEstadoAction(siglaEstado);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.municipios;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 horas
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    municipios: data as MunicipioIBGE[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar municípios por estado com paginação
 */
export function useMunicipiosPorEstadoInfinite(siglaEstado: string | null) {
  const [items, setItems] = useState<MunicipioIBGE[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20; // Número de itens por página

  const loadMunicipios = useCallback(
    async (currentOffset: number) => {
      if (!siglaEstado) return;

      try {
        setIsLoading(true);

        const result = await getMunicipiosPorEstadoAction(siglaEstado);
        if (!result.success) {
          throw new Error(result.error);
        }

        const allMunicipios = result.municipios || [];
        const startIndex = currentOffset;
        const endIndex = startIndex + limit;
        const newItems = allMunicipios.slice(startIndex, endIndex);

        setHasMore(endIndex < allMunicipios.length);
        setItems((prevItems) => (currentOffset === 0 ? newItems : [...prevItems, ...newItems]));
      } catch (error) {
        console.error("Erro ao carregar municípios:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [siglaEstado]
  );

  useEffect(() => {
    if (siglaEstado) {
      setOffset(0);
      setItems([]);
      setHasMore(true);
      loadMunicipios(0);
    }
  }, [siglaEstado, loadMunicipios]);

  const onLoadMore = useCallback(() => {
    if (siglaEstado) {
      const newOffset = offset + limit;
      setOffset(newOffset);
    }
  }, [offset, limit, siglaEstado]);

  return {
    items,
    hasMore,
    isLoading,
    onLoadMore,
  };
}

/**
 * Hook para buscar dados do CEP com SWR
 */
export function useCep(cep: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    cep && cep.replace(/\D/g, "").length === 8 ? `cep-${cep.replace(/\D/g, "")}` : null,
    async () => {
      if (!cep) return null;
      const result = await buscarCepAction(cep);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.cepData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60 * 60 * 1000, // 1 hora
      errorRetryCount: 2,
      errorRetryInterval: 3000,
    }
  );

  return {
    cepData: data as CepData | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar dados do CNPJ com SWR
 */
export function useCnpj(cnpj: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    cnpj && cnpj.replace(/\D/g, "").length === 14 ? `cnpj-${cnpj.replace(/\D/g, "")}` : null,
    async () => {
      if (!cnpj) return null;
      const result = await buscarCnpjAction(cnpj);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.cnpjData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60 * 60 * 1000, // 1 hora
      errorRetryCount: 2,
      errorRetryInterval: 3000,
    }
  );

  return {
    cnpjData: data as CnpjData | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar CEP manualmente (sem SWR automático)
 */
export function useCepSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCep = async (cep: string): Promise<CepData | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await buscarCepAction(cep);

      if (!result.success) {
        setError(result.error || "Erro ao buscar CEP");
        return null;
      }

      return result.cepData || null;
    } catch (err) {
      setError("Erro ao buscar CEP");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCep,
    loading,
    error,
  };
}

/**
 * Hook para buscar CNPJ manualmente (sem SWR automático)
 */
export function useCnpjSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCnpj = async (cnpj: string): Promise<CnpjData | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await buscarCnpjAction(cnpj);

      if (!result.success) {
        setError(result.error || "Erro ao buscar CNPJ");
        return null;
      }

      return result.cnpjData || null;
    } catch (err) {
      setError("Erro ao buscar CNPJ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCnpj,
    loading,
    error,
  };
}
