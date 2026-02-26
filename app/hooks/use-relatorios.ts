"use client";

import useSWR from "swr";

import {
  getRelatoriosData,
  type RelatorioPeriodo,
  type RelatoriosTenantData,
} from "@/app/actions/relatorios";

interface UseRelatoriosResult {
  data?: RelatoriosTenantData;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refresh: () => Promise<RelatoriosTenantData | undefined>;
}

export function useRelatorios(periodo: RelatorioPeriodo): UseRelatoriosResult {
  const { data, error, isLoading, mutate } = useSWR<RelatoriosTenantData>(
    ["relatorios-data", periodo],
    async () => {
      const response = await getRelatoriosData(periodo);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erro ao carregar relatórios");
      }

      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refresh: () => mutate(),
  };
}
