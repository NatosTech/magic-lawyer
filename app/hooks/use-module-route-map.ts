"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

import { useRealtime } from "@/app/providers/realtime-provider";

type ModuleRouteMap = Record<string, string[]>;

async function fetchModuleRouteMap(): Promise<ModuleRouteMap> {
  const response = await fetch("/api/module-route-map", {
    method: "GET",
    headers: {
      "cache-control": "no-store",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar module map");
  }

  const payload = await response.json();

  if (!payload?.success) {
    throw new Error(payload?.error || "Erro ao buscar module map");
  }

  return payload.data || {};
}

export function useModuleRouteMap() {
  const { data: session } = useSession();
  const realtime = useRealtime();
  const tenantId = session?.user?.tenantId || null;

  const {
    data,
    error,
    isLoading,
    mutate: mutateModuleMap,
  } = useSWR<ModuleRouteMap>(
    tenantId ? ["module-route-map", tenantId] : null,
    fetchModuleRouteMap,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  // Revalidar quando houver atualização de plano/módulos
  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const unsubscribePlan = realtime.subscribe(
      "plan-update",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          mutateModuleMap();
        }
      },
    );

    const unsubscribeSoft = realtime.subscribe(
      "tenant-soft-update",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          mutateModuleMap();
        }
      },
    );

    return () => {
      unsubscribePlan();
      unsubscribeSoft();
    };
  }, [tenantId, realtime, mutateModuleMap]);

  const moduleRouteMap = useMemo<ModuleRouteMap>(() => data || {}, [data]);

  return {
    moduleRouteMap,
    isLoading,
    error,
    refresh: mutateModuleMap,
  };
}
