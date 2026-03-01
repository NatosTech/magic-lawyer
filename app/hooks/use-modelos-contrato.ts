import useSWR from "swr";

import {
  getModeloContratoById,
  listModelosContrato,
  type ModeloContratoFilters,
  type ModeloContratoListItem,
} from "@/app/actions/modelos-contrato";
import { listTiposContrato } from "@/app/actions/tipos-contrato";

export interface TipoContratoParaModelo {
  id: string;
  nome: string;
  tenantId: string | null;
  ativo: boolean;
}

/**
 * Lista modelos de contrato com filtros.
 */
export function useModelosContrato(filters: ModeloContratoFilters = {}) {
  const key = ["modelos-contrato", JSON.stringify(filters)];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const result = await listModelosContrato(filters);

      if (!result.success) {
        throw new Error(result.error || "Erro ao listar modelos de contrato");
      }

      return result.data || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    modelos: (data || []) as ModeloContratoListItem[],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Busca um modelo de contrato específico.
 */
export function useModeloContratoById(modeloId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    modeloId ? `modelo-contrato-${modeloId}` : null,
    async () => {
      if (!modeloId) return null;

      const result = await getModeloContratoById(modeloId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar modelo de contrato");
      }

      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    modelo: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Lista tipos de contrato disponíveis para seleção.
 */
export function useTiposModeloContrato() {
  const { data, error, isLoading, mutate } = useSWR(
    "tipos-contrato-ativos-para-modelos",
    async () => {
      const result = await listTiposContrato({ ativo: true });

      if (!result.success) {
        throw new Error(result.error || "Erro ao listar tipos de contrato");
      }

      return (result.tipos || []) as TipoContratoParaModelo[];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    tipos: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
