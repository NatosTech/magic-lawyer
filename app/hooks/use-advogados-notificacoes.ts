import useSWR from "swr";

import {
  getNotificacoesAdvogado,
  getEstatisticasNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  NotificacaoData,
} from "@/app/actions/advogados-notificacoes";

interface HookOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

export function useNotificacoesAdvogado(
  advogadoId: string,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR<NotificacaoData[]>(
    enabled && advogadoId ? `notificacoes-advogado-${advogadoId}` : null,
    async () => {
      const result = await getNotificacoesAdvogado(advogadoId);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar notificações do advogado",
        );
      }

      return result.data || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval,
    },
  );

  const marcarComoLida = async (notificacaoId: string) => {
    const result = await marcarNotificacaoComoLida(notificacaoId);

    if (result.success) {
      mutate();
    }

    return result;
  };

  const marcarTodasComoLidas = async () => {
    const result = await marcarTodasNotificacoesComoLidas(advogadoId);

    if (result.success) {
      mutate();
    }

    return result;
  };

  return {
    notificacoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}

export function useEstatisticasNotificacoes(
  advogadoId: string,
  options?: HookOptions,
) {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 0;

  const { data, error, isLoading, mutate } = useSWR(
    enabled && advogadoId ? `estatisticas-notificacoes-${advogadoId}` : null,
    async () => {
      const result = await getEstatisticasNotificacoes(advogadoId);

      if (!result.success) {
        throw new Error(
          result.error || "Erro ao carregar estatísticas de notificações",
        );
      }

      return result.data!;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval,
    },
  );

  return {
    estatisticas: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}
