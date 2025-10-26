"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useRealtime } from "@/app/providers/realtime-provider";
import type { RealtimeEvent } from "@/app/lib/realtime/types";

async function fetchTenantModules(tenantId: string): Promise<string[]> {
  const response = await fetch(`/api/tenant-modules?tenantId=${tenantId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Erro ao buscar módulos");
  }

  return (data.data as string[]) || [];
}

export function useTenantModules() {
  const { data: session } = useSession();
  const realtime = useRealtime();

  const tenantId = session?.user?.tenantId || null;
  const { data, mutate, error, isLoading } = useSWR<string[]>(tenantId ? ["tenant-modules", tenantId] : null, () => fetchTenantModules(tenantId!), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 60000, // 1 minuto (fallback)
    dedupingInterval: 2000,
  });

  // Listener para eventos plan-update
  useEffect(() => {
    if (!tenantId) return;

    console.log(`[useTenantModules] 📡 Registrando listener WebSocket para tenant: ${tenantId}`);

    const unsubscribe = realtime.subscribe("plan-update", (event: RealtimeEvent) => {
      console.log(`[useTenantModules] 📨 Evento plan-update recebido:`, event);

      if (event.tenantId === tenantId) {
        console.log(`[useTenantModules] 🔄 Atualizando módulos para tenant ${tenantId}`);
        mutate(); // Revalidar cache de módulos
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tenantId, realtime, mutate]);

  return {
    modules: data || [],
    isLoading,
    error,
    mutate,
  };
}
