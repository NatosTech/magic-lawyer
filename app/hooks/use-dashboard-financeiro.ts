import useSWR from "swr";

import {
  getMetricasFinanceiras,
  getGraficoParcelas,
  getHonorariosPorAdvogado,
  getDadosBancariosAtivos,
  getAdvogadosAtivos,
  getClientesAtivos,
  type MetricasFinanceiras,
  type GraficoParcelas,
  type HonorariosPorAdvogado,
  type FiltrosDashboard,
} from "@/app/actions/dashboard-financeiro";

// ============================================
// HOOKS PARA MÉTRICAS FINANCEIRAS
// ============================================

export function useMetricasFinanceiras(filtros?: FiltrosDashboard) {
  const { data, error, isLoading, mutate } = useSWR<MetricasFinanceiras>(
    ["metricas-financeiras", filtros],
    () => getMetricasFinanceiras(filtros),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 segundos
    },
  );

  return {
    metricas: data,
    isLoading,
    error,
    mutate,
  };
}

export function useGraficoParcelas(filtros?: FiltrosDashboard) {
  const { data, error, isLoading, mutate } = useSWR<GraficoParcelas[]>(
    ["grafico-parcelas", filtros],
    () => getGraficoParcelas(filtros),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 segundos
    },
  );

  return {
    grafico: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useHonorariosPorAdvogado(filtros?: FiltrosDashboard) {
  const { data, error, isLoading, mutate } = useSWR<HonorariosPorAdvogado[]>(
    ["honorarios-advogado", filtros],
    () => getHonorariosPorAdvogado(filtros),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 segundos
    },
  );

  return {
    honorarios: data || [],
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// HOOKS PARA DADOS AUXILIARES
// ============================================

export function useDadosBancariosAtivos() {
  const { data, error, isLoading, mutate } = useSWR(
    "dados-bancarios-ativos",
    getDadosBancariosAtivos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minuto
    },
  );

  return {
    dadosBancarios: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useAdvogadosAtivos() {
  const { data, error, isLoading, mutate } = useSWR(
    "advogados-ativos",
    getAdvogadosAtivos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minuto
    },
  );

  return {
    advogados: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useClientesAtivos() {
  const { data, error, isLoading, mutate } = useSWR(
    "clientes-ativos",
    getClientesAtivos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minuto
    },
  );

  return {
    clientes: data || [],
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// HOOK COMPOSTO PARA DASHBOARD COMPLETO
// ============================================

export function useDashboardFinanceiro(filtros?: FiltrosDashboard) {
  const metricas = useMetricasFinanceiras(filtros);
  const grafico = useGraficoParcelas(filtros);
  const honorarios = useHonorariosPorAdvogado(filtros);
  const dadosBancarios = useDadosBancariosAtivos();
  const advogados = useAdvogadosAtivos();
  const clientes = useClientesAtivos();

  const isLoading =
    metricas.isLoading ||
    grafico.isLoading ||
    honorarios.isLoading ||
    dadosBancarios.isLoading ||
    advogados.isLoading ||
    clientes.isLoading;

  const error =
    metricas.error ||
    grafico.error ||
    honorarios.error ||
    dadosBancarios.error ||
    advogados.error ||
    clientes.error;

  const mutate = () => {
    metricas.mutate();
    grafico.mutate();
    honorarios.mutate();
    dadosBancarios.mutate();
    advogados.mutate();
    clientes.mutate();
  };

  return {
    // Dados
    metricas: metricas.metricas,
    grafico: grafico.grafico,
    honorarios: honorarios.honorarios,
    dadosBancarios: dadosBancarios.dadosBancarios,
    advogados: advogados.advogados,
    clientes: clientes.clientes,

    // Estados
    isLoading,
    error,
    mutate,
  };
}
