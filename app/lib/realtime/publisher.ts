import Ably from "ably";
import type { RealtimeEvent, RealtimeEventType } from "./types";

/**
 * Cliente Ably (singleton)
 */
let ablyClient: Ably.Realtime | null = null;

async function getAblyClient(): Promise<Ably.Realtime | null> {
  if (typeof window !== "undefined") {
    // Frontend - usar client key pública
    return null; // Frontend usa provider React
  }

  // Backend - usar API key
  if (!ablyClient && process.env.ABLY_API_KEY) {
    ablyClient = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

    // Aguardar conexão antes de permitir publish
    await new Promise<void>((resolve, reject) => {
      if (!ablyClient) {
        reject(new Error("Ably client not initialized"));
        return;
      }

      ablyClient.connection.once("connected", () => {
        console.log("[realtime] Cliente Ably conectado");
        resolve();
      });

      ablyClient.connection.once("failed", (stateChange) => {
        console.error("[realtime] Falha na conexão Ably:", stateChange);
        reject(stateChange);
      });

      // Timeout de 5s
      setTimeout(() => reject(new Error("Ably connection timeout")), 5000);
    });
  }

  return ablyClient;
}

/**
 * Publica evento via Ably (WebSocket)
 */
async function publishToAbly(event: RealtimeEvent): Promise<boolean> {
  try {
    const client = await getAblyClient();
    if (!client) {
      console.log("[realtime] Cliente Ably não disponível, usando fallback");
      return false;
    }

    const channelPrefix = process.env.REALTIME_CHANNEL_PREFIX || "ml-dev";

    // Determinar canal baseado no evento
    let channelName: string;
    if (event.tenantId) {
      channelName = `${channelPrefix}:tenant:${event.tenantId}`;
    } else {
      channelName = `${channelPrefix}:system`;
    }

    const channel = client.channels.get(channelName);

    // Usar Promise para garantir que publish foi concluído
    await new Promise<void>((resolve, reject) => {
      channel.publish(event.type, event, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log("[realtime] Evento publicado no Ably:", {
      channel: channelName,
      type: event.type,
      tenantId: event.tenantId,
    });

    return true;
  } catch (error) {
    console.error("[realtime] Erro ao publicar no Ably:", error);
    return false;
  }
}

/**
 * Fallback via HTTP interno
 */
async function fallbackToHttp(event: RealtimeEvent): Promise<void> {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:9192";
    const url = new URL("/api/internal/realtime/invalidate", base).toString();

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.REALTIME_INTERNAL_TOKEN || "",
      },
      body: JSON.stringify(event),
    });

    console.log("[realtime] Fallback HTTP executado para:", event.type);
  } catch (error) {
    console.error("[realtime] Erro no fallback HTTP:", error);
  }
}

/**
 * Salva evento no outbox (banco de dados) para reprocessamento
 * @note TODO: Implementar quando tivermos tabela RealtimeOutbox
 */
async function saveToOutbox(event: RealtimeEvent): Promise<void> {
  // Função preparada para futuro - tabela RealtimeOutbox ainda não criada
  // await prisma.realtimeOutbox.create({
  //   data: {
  //     type: event.type,
  //     tenantId: event.tenantId,
  //     payload: event.payload,
  //     processed: false,
  //   },
  // });
  console.log("[realtime] Outbox não implementado ainda - pulando salvar evento");
}

/**
 * Publica evento de tempo real
 * Tenta Ably primeiro, faz fallback para HTTP, salva no outbox se ambos falharem
 */
export async function publishRealtimeEvent(
  type: RealtimeEventType,
  params: {
    tenantId?: string | null;
    userId?: string | null;
    payload: Record<string, any>;
  }
): Promise<void> {
  const event: RealtimeEvent = {
    type,
    tenantId: params.tenantId ?? null,
    userId: params.userId ?? null,
    payload: params.payload,
    timestamp: new Date().toISOString(),
    // TODO: Passar version dinâmica baseada em tenantSoftVersion/sessionVersion
    // Por enquanto usa version fixo 1
    version: params.payload.tenantSoftVersion || params.payload.sessionVersion || 1,
  };

  // Tentar publicar no Ably
  const published = await publishToAbly(event);

  if (!published) {
    // Fallback para HTTP se Ably não disponível
    console.log("[realtime] Ably indisponível, usando fallback HTTP");
    await fallbackToHttp(event);
  }

  // Sempre salvar no outbox para garantia de entrega
  // await saveToOutbox(event);
}

/**
 * Função legada para compatibilidade
 * @deprecated Use publishRealtimeEvent()
 */
export async function triggerRealtimeEvent(params: { type: "tenant-status" | "plan-update" | "user-status"; tenantId: string; userId?: string; sessionVersion?: number }): Promise<void> {
  await publishRealtimeEvent(params.type, {
    tenantId: params.tenantId,
    userId: params.userId,
    payload: {
      sessionVersion: params.sessionVersion,
    },
  });
}
