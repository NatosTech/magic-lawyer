"use client";

import type {
  RealtimeEvent,
  RealtimeEventType,
} from "@/app/lib/realtime/types";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Ably from "ably";

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (
    eventType: RealtimeEventType,
    handler: (event: RealtimeEvent) => void,
  ) => () => void;
  publishLocal: (
    eventType: RealtimeEventType,
    payload: Record<string, any>,
  ) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, Ably.RealtimeChannel>>(new Map());
  const subscriptionsRef = useRef<
    Map<string, ((event: RealtimeEvent) => void)[]>
  >(new Map());

  useEffect(() => {
    // Só conectar se tiver sessão e as keys configuradas
    const clientKey = process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY;

    if (!clientKey) {
      console.warn(
        "[RealtimeProvider] NEXT_PUBLIC_ABLY_CLIENT_KEY não configurado",
      );

      return;
    }

    if (!session?.user) {
      return;
    }

    // Criar cliente Ably
    const client = new Ably.Realtime({
      key: clientKey,
      clientId: session.user.id,
    });

    clientRef.current = client;

    // Listener para conexão
    client.connection.on((stateChange) => {
      setIsConnected(stateChange.current === "connected");

      if (stateChange.current === "connected") {
        subscribeToTenantChannel(session.user);
      }

      if (
        stateChange.current === "disconnected" ||
        stateChange.current === "failed"
      ) {
        console.warn("[RealtimeProvider] ⚠️ Desconectado do Ably");
      }
    });

    // Cleanup ao desmontar
    return () => {
      client.close();
      channelsRef.current.clear();
      subscriptionsRef.current.clear();
    };
  }, [session]);

  /**
   * Subscribe ao canal do tenant
   */
  function subscribeToTenantChannel(user: any) {
    const tenantId = user.tenantId;

    if (!tenantId) {
      return;
    }

    const channelPrefix =
      process.env.NEXT_PUBLIC_REALTIME_CHANNEL_PREFIX || "ml-dev";
    const channelName = `${channelPrefix}:tenant:${tenantId}`;

    // Se já está subscribed, não fazer de novo (evitar duplicados em reconexão)
    if (channelsRef.current.has(channelName)) {
      return;
    }

    const channel = clientRef.current!.channels.get(channelName);

    channelsRef.current.set(channelName, channel);

    // Subscribe em todos os tipos de eventos
    const eventTypes: RealtimeEventType[] = [
      "tenant-status",
      "tenant-soft-update",
      "plan-update",
      "user-status",
      "notification.new",
      "cargo-update",
      "usuario-update",
    ];

    eventTypes.forEach((eventType) => {
      channel.subscribe(eventType, (message) => {
        // Notificar listeners
        const handlers = subscriptionsRef.current.get(eventType) || [];

        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            console.error(
              "[RealtimeProvider] Erro ao executar handler:",
              error,
            );
          }
        });
      });
    });
  }

  /**
   * Subscribe a um tipo de evento
   */
  function subscribe(
    eventType: RealtimeEventType,
    handler: (event: RealtimeEvent) => void,
  ): () => void {
    // Adicionar handler à lista
    const handlers = subscriptionsRef.current.get(eventType) || [];

    handlers.push(handler);
    subscriptionsRef.current.set(eventType, handlers);

    // Retornar função de unsubscribe
    return () => {
      const currentHandlers = subscriptionsRef.current.get(eventType) || [];
      const index = currentHandlers.indexOf(handler);

      if (index > -1) {
        currentHandlers.splice(index, 1);
        subscriptionsRef.current.set(eventType, currentHandlers);
      }
    };
  }

  /**
   * Publicar evento localmente (não envia ao servidor)
   */
  function publishLocal(
    eventType: RealtimeEventType,
    payload: Record<string, any>,
  ): void {
    const handlers = subscriptionsRef.current.get(eventType) || [];
    const event: RealtimeEvent = {
      type: eventType,
      tenantId: session?.user?.tenantId || null,
      userId: session?.user?.id || null,
      payload,
      timestamp: new Date().toISOString(),
      version: 1,
    };

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(
          "[RealtimeProvider] Erro ao executar publishLocal:",
          error,
        );
      }
    });
  }

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribe, publishLocal }}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook para usar o contexto realtime
 */
export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error("useRealtime deve ser usado dentro de RealtimeProvider");
  }

  return context;
}
