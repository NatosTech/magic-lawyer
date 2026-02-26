import useSWR from "swr";

import {
  listParcelasContrato,
  getParcelaContrato,
  getDashboardParcelas,
  getStatusParcelas,
  getProcessosComParcelas,
} from "@/app/actions/parcelas-contrato";

// Hook para listar parcelas de contrato
export function useParcelasContrato(filters?: {
  contratoId?: string;
  status?: "PENDENTE" | "PAGA" | "ATRASADA" | "CANCELADA";
  dataVencimentoInicio?: Date;
  dataVencimentoFim?: Date;
  processoId?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  formaPagamento?: string;
  apenasVencidas?: boolean;
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
    error: error,
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
    error: error,
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
      refreshInterval: 0,
    },
  );

  return {
    dashboard: data?.data,
    isLoading,
    error: error,
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
    error: error,
  };
}

// Hook para buscar processos que têm parcelas
export function useProcessosComParcelas() {
  const { data, error, isLoading, mutate } = useSWR(
    "processos-com-parcelas",
    getProcessosComParcelas,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    processos: data?.data || [],
    isLoading,
    isError: !!error,
    error: error,
    mutate,
    refresh: mutate,
  };
}
