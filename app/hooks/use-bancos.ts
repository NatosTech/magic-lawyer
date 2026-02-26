import useSWR from "swr";

import {
  listBancos,
  getBanco,
  getBancosAtivos,
  getDashboardBancos,
  type BancoListFilters,
} from "@/app/actions/bancos";

// Hook para listar bancos
export function useBancos(filters?: BancoListFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    ["bancos", filters],
    () => listBancos(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    bancos: data?.bancos || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// Hook para buscar banco específico
export function useBanco(codigo: string) {
  const { data, error, isLoading, mutate } = useSWR(
    codigo ? ["banco", codigo] : null,
    () => getBanco(codigo),
    {
      revalidateOnFocus: false,
    },
  );

  return {
    banco: data?.banco,
    isLoading,
    error,
    mutate,
  };
}

// Hook para bancos ativos (para selects)
export function useBancosAtivos(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? "bancos-ativos" : null,
    () => getBancosAtivos(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    bancos: data?.bancos || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook para bancos disponíveis (alias para bancos ativos)
export function useBancosDisponiveis(enabled = true) {
  return useBancosAtivos(enabled);
}

// Hook para dashboard de bancos
export function useDashboardBancos() {
  const { data, error, isLoading, mutate } = useSWR(
    "dashboard-bancos",
    getDashboardBancos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    dashboard: data?.dashboard,
    isLoading,
    error,
    mutate,
  };
}
