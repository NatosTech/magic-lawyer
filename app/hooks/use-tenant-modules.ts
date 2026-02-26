"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { useRealtime } from "@/app/providers/realtime-provider";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

interface TenantModulesPayload {
  modules: string[];
  planRevision: number | null;
}

function isArrayEqual(current: string[], next: string[]): boolean {
  if (current.length !== next.length) {
    return false;
  }

  for (let i = 0; i < current.length; i += 1) {
    if (current[i] !== next[i]) {
      return false;
    }
  }

  return true;
}

async function fetchTenantModules(
  tenantId: string,
): Promise<TenantModulesPayload> {
  const response = await fetch(`/api/tenant-modules?tenantId=${tenantId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Erro ao buscar módulos");
  }

  if (Array.isArray(data.data)) {
    return {
      modules: data.data,
      planRevision: null,
    };
  }

  return {
    modules: (data.data?.modules as string[]) || [],
    planRevision:
      typeof data.data?.planRevision === "number"
        ? data.data.planRevision
        : null,
  };
}

export function useTenantModules() {
  const { data: session, update: updateSession } = useSession();
  const realtime = useRealtime();
  const tenantId = session?.user?.tenantId || null;
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const [pollingInterval, setPollingInterval] = useState(0);

  useEffect(() => {
    const apply = (globalEnabled = isPollingEnabled) => {
      setPollingInterval(
        resolvePollingInterval({
          isConnected: realtime.isConnected,
          enabled: globalEnabled && Boolean(tenantId),
          fallbackMs: REALTIME_POLLING.TENANT_MODULES_FALLBACK_MS,
        }),
      );
    };

    apply();

    const unsubscribe = subscribePollingControl((enabled) => {
      setIsPollingEnabled(enabled);
      apply(enabled);
    });

    return () => {
      unsubscribe();
    };
  }, [realtime.isConnected, tenantId, isPollingEnabled]);

  const { data, mutate, error, isLoading } = useSWR<TenantModulesPayload>(
    tenantId ? ["tenant-modules", tenantId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "useTenantModules",
          endpoint: tenantId ? `/api/tenant-modules?tenantId=${tenantId}` : "tenant-modules",
          source: "swr",
          intervalMs: pollingInterval,
        },
        () => fetchTenantModules(tenantId!),
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: !realtime.isConnected,
      refreshInterval: pollingInterval,
      dedupingInterval: 10000,
    },
  );

  // Atualizar o token/session do NextAuth em tempo real para refletir módulos e revisão do plano
  useEffect(() => {
    if (!tenantId || !data || !session?.user || !updateSession) {
      return;
    }

    const sessionModules = Array.isArray((session.user as any)?.tenantModules)
      ? ((session.user as any).tenantModules as string[])
      : [];
    const sessionPlanRevision =
      typeof (session.user as any)?.tenantPlanRevision === "number"
        ? ((session.user as any).tenantPlanRevision as number)
        : null;

    const modulesChanged = !isArrayEqual(sessionModules, data.modules);
    const planRevisionChanged =
      typeof data.planRevision === "number" &&
      data.planRevision !== sessionPlanRevision;

    if (!modulesChanged && !planRevisionChanged) {
      return;
    }

    const payload: Record<string, unknown> = {};

    if (modulesChanged) {
      payload.tenantModules = data.modules;
    }

    if (planRevisionChanged && data.planRevision !== null) {
      payload.tenantPlanRevision = data.planRevision;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    (async () => {
      try {
        await updateSession(payload);
      } catch (err) {
        console.error(
          "[useTenantModules] Erro ao atualizar sessão com novos módulos",
          err,
        );
      }
    })();
  }, [data, session?.user, tenantId, updateSession]);

  // Listener para eventos plan-update
  useEffect(() => {
    if (!tenantId) return;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[useTenantModules] 📡 Registrando listener WebSocket para tenant: ${tenantId}`,
      );
    }

    const unsubscribe = realtime.subscribe(
      "plan-update",
      (event: RealtimeEvent) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[useTenantModules] 📨 Evento plan-update recebido:`,
            event,
          );
        }

        if (event.tenantId === tenantId) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[useTenantModules] 🔄 Atualizando módulos para tenant ${tenantId}`,
            );
          }
          mutate(); // Revalidar cache de módulos
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [tenantId, realtime, mutate]);

  const modules = useMemo(() => data?.modules || [], [data]);

  return {
    modules,
    isLoading,
    error,
    mutate,
  };
}
