"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import useSWR from "swr";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

import { useRealtime } from "@/app/providers/realtime-provider";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

interface TenantStatusData {
  id: string;
  status: string;
  statusReason: string | null;
  statusChangedAt: string | null;
  sessionVersion: number;
  planRevision: number;
}

interface TenantStatusResponse {
  success: boolean;
  data?: TenantStatusData;
  error?: string;
}

async function fetchTenantStatus(tenantId: string): Promise<TenantStatusData> {
  const response = await fetch(`/api/admin/tenants/${tenantId}/status`);
  const data: TenantStatusResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "Erro ao buscar status do tenant");
  }

  return data.data;
}

export function useRealtimeTenantStatus(tenantId: string | null) {
  const { data: session } = useSession();
  const realtime = useRealtime();
  const [statusChanged, setStatusChanged] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState(0);
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const apply = (globalEnabled = isPollingEnabled) => {
      setPollingInterval(
        resolvePollingInterval({
          isConnected: realtime.isConnected,
          enabled: globalEnabled && Boolean(tenantId),
          fallbackMs: REALTIME_POLLING.TENANT_STATUS_FALLBACK_MS,
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

  // Só buscar se tivermos tenantId
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<TenantStatusData>(
      tenantId ? ["tenant-status", tenantId] : null,
      () =>
        tracePollingAttempt(
          {
            hookName: "useRealtimeTenantStatus",
            endpoint: tenantId ? `/api/admin/tenants/${tenantId}/status` : "tenant-status",
            source: "swr",
            intervalMs: pollingInterval,
          },
          () => fetchTenantStatus(tenantId!),
        ),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: pollingInterval > 0,
        refreshInterval: pollingInterval, // fallback de baixa frequência em caso de queda de realtime
        dedupingInterval: 2000, // Evitar duplicatas
        onSuccess: () => {
          // Marcar última atualização bem-sucedida
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              `tenant-${tenantId}-last-update`,
              new Date().toISOString(),
            );
          }
        },
      },
    );

  // Ajuste explícito de segurança: sem tenant não pode haver polling
  useEffect(() => {
    if (!tenantId) {
      setPollingInterval(0);
    }
  }, [tenantId]);

  // Detectar mudança de status
  useEffect(() => {
    if (!data?.status) return;

    if (prevStatusRef.current !== null && prevStatusRef.current !== data.status) {
      setStatusChanged(true);
      setLastStatus(data.status);
      prevStatusRef.current = data.status;

      const timer = setTimeout(() => setStatusChanged(false), 3000);

      return () => clearTimeout(timer);
    }

    prevStatusRef.current = data.status;
  }, [data?.status]);

  // Listener para eventos WebSocket (plan-update e tenant-soft-update)
  useEffect(() => {
    if (!tenantId) {
      return;
    }

    // Subscribe em plan-update (mudanças de plano/módulos)
    const unsubscribePlan = realtime.subscribe(
      "plan-update",
      (event: RealtimeEvent) => {
        // Se o evento é para este tenant, invalidar cache
        if (event.tenantId === tenantId) {
          void mutate();
        }
      },
    );

    // Subscribe em tenant-soft-update (mudanças não críticas)
    const unsubscribeSoft = realtime.subscribe(
      "tenant-soft-update",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          void mutate();
        }
      },
    );

    // Cleanup
    return () => {
      unsubscribePlan();
      unsubscribeSoft();
    };
  }, [tenantId, realtime, mutate]);

  // Invalidar automaticamente quando sessionVersion ou planRevision mudarem
  // IMPORTANTE: Só comparar quando a sessão pertence ao mesmo tenant
  useEffect(() => {
    if (!session || !data || !tenantId) return;

    const userTenantId = (session.user as any)?.tenantId;

    // Se não for o mesmo tenant (ex: super admin vendo outro tenant), não comparar
    if (userTenantId !== tenantId) return;

    const tenantSessionVersion = (session.user as any)?.tenantSessionVersion;
    const tenantPlanRevision = (session.user as any)?.tenantPlanRevision;

    // Se houver divergência, forçar revalidação
    if (
      tenantSessionVersion !== data.sessionVersion ||
      tenantPlanRevision !== data.planRevision
    ) {
      mutate();
    }
  }, [session, data, tenantId, mutate]);

  return {
    status: data,
    isLoading,
    error,
    mutate,
    invalidate: mutate,
    statusChanged, // Indica se o status mudou recentemente
    lastStatusChange: lastStatus, // Qual foi o último status
    isUpdating: isLoading && !data, // Se está carregando pela primeira vez
    isValidating, // Indica se está revalidando (incluindo chamadas subsequentes)
  };
}
