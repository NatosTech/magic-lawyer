import type { JuizFilters } from "@/app/actions/juizes";

import useSWR from "swr";

import { getJuizes, getJuizById, getJuizFormData } from "@/app/actions/juizes";

// Hook para buscar juízes
export function useJuizes(filters?: JuizFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    ["juizes", filters],
    () => getJuizes(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Revalidar a cada 60 segundos (juízes mudam menos frequentemente)
    },
  );

  return {
    juizes: data?.success ? data.data : [],
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  };
}

// Hook para buscar juiz específico
export function useJuiz(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["juiz", id] : null,
    () => getJuizById(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return {
    juiz: data?.success ? data.data : null,
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  };
}

// Hook para dados do formulário
export function useJuizFormData() {
  const { data, error, isLoading } = useSWR("juiz-form-data", getJuizFormData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 300000, // 5 minutos - dados estáticos
  });

  return {
    formData: data?.success ? data.data : null,
    isLoading,
    error: error || (data?.success === false ? data.error : null),
  };
}
