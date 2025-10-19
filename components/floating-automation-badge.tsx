"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Bell, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface SystemNotification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function FloatingAutomationBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Só mostrar em desenvolvimento
    if (process.env.NODE_ENV !== "development") return;

    // Simular algumas notificações do sistema
    const initialNotifications: SystemNotification[] = [
      {
        id: "1",
        type: "success",
        title: "Sistema Iniciado",
        message: "Magic Lawyer rodando em modo desenvolvimento",
        timestamp: new Date(),
        read: false,
      },
      {
        id: "2",
        type: "info",
        title: "ngrok Ativo",
        message: "Túnel público disponível para webhooks",
        timestamp: new Date(Date.now() - 30000),
        read: false,
      },
      {
        id: "3",
        type: "warning",
        title: "Webhook Config",
        message: "Configure o webhook no painel do Asaas",
        timestamp: new Date(Date.now() - 60000),
        read: false,
      },
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter((n) => !n.read).length);

    // Mostrar após 2 segundos
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("Todas as notificações marcadas como lidas");
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case "warning":
        return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case "info":
        return <Clock className="w-3 h-3 text-blue-400" />;
    }
  };

  const getColor = (type: SystemNotification["type"]) => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      case "info":
        return "primary";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <div className="relative">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="relative">
            <Bell className="w-4 h-4 text-white" />
            {unreadCount > 0 && (
              <Badge content={unreadCount} color="danger" size="sm" className="absolute -top-1 -right-1">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-white">Sistema</span>
            <span className="text-xs text-white/60">{unreadCount} não lidas</span>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button size="sm" variant="light" className="text-white/60 hover:text-white text-xs" onPress={markAllAsRead}>
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Lista de notificações */}
        <div className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-white/60 text-sm">Nenhuma notificação</div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <div key={notification.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${notification.read ? "bg-white/5" : "bg-primary/10"}`}>
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${notification.read ? "text-white/60" : "text-white"}`}>{notification.title}</span>
                      {!notification.read && <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>}
                    </div>
                    <p className="text-xs text-white/60 mt-1">{notification.message}</p>
                    <p className="text-xs text-white/40 mt-1">{notification.timestamp.toLocaleTimeString()}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button isIconOnly size="sm" variant="light" className="text-white/40 hover:text-white" onPress={() => markAsRead(notification.id)}>
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    <Button isIconOnly size="sm" variant="light" className="text-white/40 hover:text-red-400" onPress={() => dismissNotification(notification.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
