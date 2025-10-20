"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

import { getDevInfo } from "@/app/actions/dev-info";

interface DevNotification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useDevNotifications() {
  const [notifications, setNotifications] = useState<DevNotification[]>([]);

  // SWR para buscar dados de desenvolvimento
  const { data: devInfo } = useSWR(
    process.env.NODE_ENV === "development" ? "dev-info" : null,
    getDevInfo,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    },
  );

  useEffect(() => {
    // Só funcionar em desenvolvimento
    if (process.env.NODE_ENV !== "development") return;

    const generateDevNotifications = (): DevNotification[] => {
      const notifications: DevNotification[] = [];

      // Sistema iniciado
      notifications.push({
        id: "dev-system-started",
        type: "success",
        title: "Sistema Iniciado",
        message: "Magic Lawyer rodando em modo desenvolvimento",
        timestamp: new Date(),
        read: false,
      });

      // ngrok status
      if (devInfo?.ngrok) {
        notifications.push({
          id: "dev-ngrok-active",
          type: "info",
          title: "ngrok Ativo",
          message: `Túnel público: ${devInfo.ngrok}`,
          timestamp: new Date(Date.now() - 30000),
          read: false,
        });
      } else {
        notifications.push({
          id: "dev-ngrok-inactive",
          type: "warning",
          title: "ngrok Inativo",
          message: "Túnel público não disponível para webhooks",
          timestamp: new Date(Date.now() - 30000),
          read: false,
        });
      }

      // Webhook config
      if (devInfo?.ngrok) {
        notifications.push({
          id: "dev-webhook-config",
          type: "warning",
          title: "Webhook Config",
          message: `Configure o webhook no Asaas: ${devInfo.ngrok}/api/webhooks/asaas`,
          timestamp: new Date(Date.now() - 60000),
          read: false,
        });
      }

      // Tenants ativos
      if (devInfo?.tenants && devInfo.tenants.length > 0) {
        notifications.push({
          id: "dev-tenants-active",
          type: "info",
          title: "Tenants Ativos",
          message: `${devInfo.tenants.length} tenants disponíveis para teste`,
          timestamp: new Date(Date.now() - 90000),
          read: false,
        });
      }

      return notifications;
    };

    const newNotifications = generateDevNotifications();

    setNotifications(newNotifications);
  }, [devInfo]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    devInfo,
  };
}
