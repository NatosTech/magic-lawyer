"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import useSWR from "swr";

import {
  getNotifications,
  setNotificationStatus,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type NotificationStatus,
  type NotificationsResponse,
} from "@/app/actions/notifications";
import { useRealtime } from "@/app/providers/realtime-provider";

export type NotificationItem = {
  id: string;
  notificacaoId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  status: NotificationStatus;
  canal: string;
  criadoEm: string;
  entregueEm?: string | null;
  lidoEm?: string | null;
  referenciaTipo?: string | null;
  referenciaId?: string | null;
  dados?: unknown;
};

type UseNotificationsOptions = {
  refreshInterval?: number;
  limit?: number;
  enablePolling?: boolean; // Habilitar polling automático quando sem WebSocket
};

/**
 * Hook para buscar notificações com fallback HTTP/polling
 *
 * Quando o Ably (WebSocket) não está conectado, aumenta automaticamente
 * a frequência de polling de 60s para 30s para garantir entrega rápida.
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit, refreshInterval = 60000, enablePolling = true } = options;

  // Detectar conexão Ably para ajustar polling
  const { isConnected } = useRealtime();
  const [pollingInterval, setPollingInterval] = useState(refreshInterval);

  // Ajustar intervalo de polling baseado na conexão WebSocket
  useEffect(() => {
    if (!enablePolling) {
      setPollingInterval(0); // Desabilitar polling se explicitamente desabilitado

      return;
    }

    // Se Ably não está conectado, usar polling mais frequente (30s)
    // Caso contrário, usar intervalo padrão (60s ou customizado)
    if (!isConnected) {
      setPollingInterval(30000); // 30 segundos (fallback HTTP quando sem socket)
    } else {
      setPollingInterval(refreshInterval);
    }
  }, [isConnected, refreshInterval, enablePolling]);

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<NotificationsResponse>(
      ["notifications", limit ?? null],
      async ([, take]) =>
        getNotifications(
          typeof take === "number" ? { limit: take } : undefined,
        ),
      {
        revalidateOnFocus: true,
        refreshInterval: pollingInterval, // Intervalo dinâmico baseado na conexão
        revalidateOnReconnect: true,
        dedupingInterval: 2000, // Evitar requisições duplicadas
      },
    );

  const notifications = useMemo<NotificationItem[]>(
    () =>
      data?.notifications.map((item) => ({
        id: item.id,
        notificacaoId: item.notificacaoId,
        titulo: item.titulo,
        mensagem: item.mensagem,
        tipo: item.tipo,
        prioridade: item.prioridade,
        status: item.status,
        canal: item.canal,
        criadoEm: item.createdAt,
        entregueEm: item.entregueEm ?? null,
        lidoEm: item.lidoEm ?? null,
        referenciaTipo: item.referenciaTipo ?? null,
        referenciaId: item.referenciaId ?? null,
        dados: item.dados,
      })) ?? [],
    [data?.notifications],
  );

  const unreadCount = data?.unreadCount ?? 0;

  const markAs = useCallback(
    async (id: string, status: NotificationStatus) => {
      await setNotificationStatus(id, status);
      await mutate();
    },
    [mutate],
  );

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    await mutate();
  }, [mutate]);

  const clearAll = useCallback(async () => {
    await clearAllNotifications();
    await mutate();
  }, [mutate]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isValidating,
    error,
    mutate,
    markAs,
    markAllAsRead,
    clearAll,
  };
}

export type { NotificationStatus };
