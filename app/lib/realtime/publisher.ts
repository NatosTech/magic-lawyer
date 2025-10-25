/**
 * Dispara eventos de invalidação em tempo real
 * MVP: Faz POST para rota interna
 * Fase 2: Publicar em Redis Pub/Sub ou WebSocket
 */
export async function triggerRealtimeEvent(params: { type: "tenant-status" | "plan-update" | "user-status"; tenantId: string; userId?: string; sessionVersion?: number }): Promise<void> {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:9192";
    const url = new URL("/api/internal/realtime/invalidate", base).toString();

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.REALTIME_INTERNAL_TOKEN || "",
      },
      body: JSON.stringify(params),
    });

    // TODO: Fase 2 - Publicar em Redis Pub/Sub
    // await redis.publish(`tenant:${params.tenantId}`, JSON.stringify(params));
  } catch (error) {
    console.error("Erro ao disparar evento realtime:", error);
    // Não falhar a operação principal se o evento falhar
  }
}
