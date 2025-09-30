"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

import {
  getNotifications,
  setNotificationStatus,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type NotificationStatus,
  type NotificationsResponse,
} from "@/app/actions/notifications";

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
};

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit, refreshInterval = 60000 } = options;

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<NotificationsResponse>(
      ["notifications", limit ?? null],
      async ([, take]) =>
        getNotifications(
          typeof take === "number" ? { limit: take } : undefined,
        ),
      {
        revalidateOnFocus: true,
        refreshInterval,
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
