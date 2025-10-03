import useSWR from "swr";
import { getEventos, getEventoById, getEventoFormData } from "@/app/actions/eventos";

// Hook para buscar eventos
export function useEventos(filters?: { dataInicio?: Date; dataFim?: Date; status?: string; tipo?: string }) {
  const { data, error, isLoading, mutate } = useSWR(["eventos", filters], () => getEventos(filters), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Revalidar a cada 30 segundos
  });

  return {
    eventos: data?.success ? data.data : [],
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  };
}

// Hook para buscar evento específico
export function useEvento(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["evento", id] : null, () => getEventoById(id), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    evento: data?.success ? data.data : null,
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  };
}

// Hook para dados do formulário
export function useEventoFormData() {
  const { data, error, isLoading, mutate } = useSWR("evento-form-data", getEventoFormData, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    formData: data?.success ? data.data : { processos: [], clientes: [], advogados: [] },
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  };
}

// Hook para eventos do dia atual
export function useEventosHoje() {
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

  return useEventos({
    dataInicio: inicioDia,
    dataFim: fimDia,
  });
}

// Hook para eventos da semana atual
export function useEventosSemana() {
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
  inicioSemana.setHours(0, 0, 0, 0);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7); // Próximo domingo

  return useEventos({
    dataInicio: inicioSemana,
    dataFim: fimSemana,
  });
}

// Hook para eventos do mês atual
export function useEventosMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  return useEventos({
    dataInicio: inicioMes,
    dataFim: fimMes,
  });
}
