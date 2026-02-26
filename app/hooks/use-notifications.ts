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
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

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
 * Quando o Ably (WebSocket) não está conectado, usa polling de fallback
 * com frequência conservadora para segurança e observabilidade.
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit,
    refreshInterval = REALTIME_POLLING.NOTIFICATION_FALLBACK_MS,
    enablePolling = true,
  } = options;

  // Detectar conexão Ably para ajustar polling
  const { isConnected } = useRealtime();
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const [pollingInterval, setPollingInterval] = useState(() =>
    resolvePollingInterval({
      isConnected,
      enabled: enablePolling,
      fallbackMs: refreshInterval,
    }),
  );

  useEffect(() => {
    const recalculate = () => {
      setPollingInterval(
        resolvePollingInterval({
          isConnected,
          enabled: enablePolling && isPollingEnabled,
          fallbackMs: refreshInterval,
        }),
      );
    };

    recalculate();
    const unsubscribe = subscribePollingControl(setIsPollingEnabled);

    return () => {
      unsubscribe();
    };
  }, [isConnected, refreshInterval, enablePolling, isPollingEnabled]);

  const shouldAutoPoll = pollingInterval > 0 && enablePolling && isPollingEnabled;

  const swrFetcher = () =>
    tracePollingAttempt(
      {
        hookName: "useNotifications",
        endpoint: "/api/notifications",
        source: "swr",
        intervalMs: pollingInterval,
      },
      async () =>
        getNotifications(typeof limit === "number" ? { limit } : undefined),
    );

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<NotificationsResponse>(
      ["notifications", limit],
      swrFetcher,
      {
        revalidateOnFocus: false,
        refreshInterval: shouldAutoPoll ? pollingInterval : 0,
        revalidateOnReconnect: shouldAutoPoll,
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
    unreadCount: data?.unreadCount ?? 0,
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
