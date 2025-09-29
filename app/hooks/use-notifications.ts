"use client";

import useSWR from "swr";

export type NotificationStatus = "NAO_LIDA" | "LIDA" | "ARQUIVADA";

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

type NotificationsResponse = {
  notifications: Array<
    Omit<NotificationItem, "criadoEm"> & {
      createdAt: string;
    }
  >;
  unreadCount: number;
};

const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || "Não foi possível carregar as notificações.");
  }

  return response.json();
};

export function useNotifications() {
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<NotificationsResponse>("/api/notifications", fetcher, {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    });

  const notifications: NotificationItem[] =
    data?.notifications.map((item) => ({
      id: item.id,
      notificacaoId: item.notificacaoId,
      titulo: item.titulo,
      mensagem: item.mensagem,
      tipo: item.tipo,
      prioridade: item.prioridade,
      status: item.status as NotificationStatus,
      canal: item.canal,
      criadoEm: item.createdAt,
      entregueEm: item.entregueEm ?? undefined,
      lidoEm: item.lidoEm ?? undefined,
      referenciaTipo: item.referenciaTipo ?? undefined,
      referenciaId: item.referenciaId ?? undefined,
      dados: item.dados,
    })) ?? [];

  const unreadCount = data?.unreadCount ?? 0;

  const markAs = async (id: string, status: NotificationStatus) => {
    const response = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const message = await response.text();

      throw new Error(message || "Falha ao atualizar notificação.");
    }

    await mutate();
  };

  const clearAll = async () => {
    const response = await fetch("/api/notifications", {
      method: "DELETE",
    });

    if (!response.ok) {
      const message = await response.text();

      throw new Error(message || "Falha ao limpar notificações.");
    }

    await mutate();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isValidating,
    error,
    markAs,
    clearAll,
    mutate,
  };
}
