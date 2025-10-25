"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Ably from "ably/promises";
import type { RealtimeEvent, RealtimeEventType } from "@/app/lib/realtime/types";

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (eventType: RealtimeEventType, handler: (event: RealtimeEvent) => void) => () => void;
  publishLocal: (eventType: RealtimeEventType, payload: Record<string, any>) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, Ably.RealtimeChannel>>(new Map());
  const subscriptionsRef = useRef<Map<string, Ably.RealtimeChannelCallbacks[]>>(new Map());

  useEffect(() => {
    // Só conectar se tiver sessão e as keys configuradas
    const clientKey = process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY;
    if (!clientKey) {
      console.warn("[RealtimeProvider] NEXT_PUBLIC_ABLY_CLIENT_KEY não configurado");
      return;
    }

    if (!session?.user) {
      return;
    }

    console.log("[RealtimeProvider] Inicializando cliente Ably...");

    // Criar cliente Ably
    const client = new Ably.Realtime({
      key: clientKey,
      clientId: session.user.id,
    });

    clientRef.current = client;

    // Listener para conexão
    client.connection.on((stateChange) => {
      console.log("[RealtimeProvider] Estado da conexão:", stateChange.current);
      setIsConnected(stateChange.current === "connected");

      if (stateChange.current === "connected") {
        console.log("[RealtimeProvider] ✅ Conectado ao Ably");
        subscribeToTenantChannel(session.user);
      }

      if (stateChange.current === "disconnected" || stateChange.current === "failed") {
        console.warn("[RealtimeProvider] ⚠️ Desconectado do Ably");
      }
    });

    // Cleanup ao desmontar
    return () => {
      console.log("[RealtimeProvider] Desconectando...");
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
      console.log("[RealtimeProvider] Usuário sem tenant, pulando subscribe");
      return;
    }

    const channelPrefix = process.env.NEXT_PUBLIC_REALTIME_CHANNEL_PREFIX || "ml-dev";
    const channelName = `${channelPrefix}:tenant:${tenantId}`;

    // Se já está subscribed, não fazer de novo (evitar duplicados em reconexão)
    if (channelsRef.current.has(channelName)) {
      console.log("[RealtimeProvider] Já está subscribed ao canal, pulando");
      return;
    }

    console.log("[RealtimeProvider] Subscribing ao canal:", channelName);

    const channel = clientRef.current!.channels.get(channelName);
    channelsRef.current.set(channelName, channel);

    // Subscribe em todos os tipos de eventos
    const eventTypes: RealtimeEventType[] = ["tenant-status", "tenant-soft-update", "plan-update", "user-status"];

    eventTypes.forEach((eventType) => {
      channel.subscribe(eventType, (message) => {
        console.log("[RealtimeProvider] Evento recebido:", eventType, message.data);

        // Notificar listeners
        const handlers = subscriptionsRef.current.get(eventType) || [];
        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            console.error("[RealtimeProvider] Erro ao executar handler:", error);
          }
        });
      });
    });

    console.log("[RealtimeProvider] ✅ Subscribed aos eventos do tenant");
  }

  /**
   * Subscribe a um tipo de evento
   */
  function subscribe(eventType: RealtimeEventType, handler: (event: RealtimeEvent) => void): () => void {
    // Adicionar handler à lista
    const handlers = subscriptionsRef.current.get(eventType) || [];
    handlers.push(handler);
    subscriptionsRef.current.set(eventType, handlers);

    console.log(`[RealtimeProvider] Handler registrado para: ${eventType}`);

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
  function publishLocal(eventType: RealtimeEventType, payload: Record<string, any>): void {
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
        console.error("[RealtimeProvider] Erro ao executar publishLocal:", error);
      }
    });
  }

  return <RealtimeContext.Provider value={{ isConnected, subscribe, publishLocal }}>{children}</RealtimeContext.Provider>;
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
