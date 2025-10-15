import useSWR from "swr";

import {
  listParcelasContrato,
  getParcelaContrato,
  getDashboardParcelas,
  getStatusParcelas,
} from "@/app/actions/parcelas-contrato";

// Hook para listar parcelas de contrato
export function useParcelasContrato(filters?: {
  contratoId?: string;
  status?: "PENDENTE" | "PAGA" | "ATRASADA" | "CANCELADA";
  dataVencimentoInicio?: Date;
  dataVencimentoFim?: Date;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    ["parcelas-contrato", filters],
    () => listParcelasContrato(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    parcelas: data?.data || [],
    isLoading,
    error: error || data?.error,
    mutate,
  };
}

// Hook para buscar parcela específica
export function useParcelaContrato(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["parcela-contrato", id] : null,
    () => getParcelaContrato(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    parcela: data?.data,
    isLoading,
    error: error || data?.error,
    mutate,
  };
}

// Hook para dashboard de parcelas
export function useDashboardParcelas() {
  const { data, error, isLoading, mutate } = useSWR(
    "dashboard-parcelas",
    getDashboardParcelas,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Atualizar a cada 30 segundos
    },
  );

  return {
    dashboard: data?.data,
    isLoading,
    error: error || data?.error,
    mutate,
  };
}

// Hook para status de parcelas
export function useStatusParcelas() {
  const { data, error, isLoading } = useSWR(
    "status-parcelas",
    getStatusParcelas,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    status: data?.data || [],
    isLoading,
    error: error || data?.error,
  };
}
