"use client";

import useSWR from "swr";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

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

// Server action mock - será substituído pela ação real
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
  const [statusChanged, setStatusChanged] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Só buscar se tivermos tenantId e sessão válida
  const { data, error, isLoading, isValidating, mutate } = useSWR<TenantStatusData>(tenantId ? ["tenant-status", tenantId] : null, () => fetchTenantStatus(tenantId!), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 5000, // 5 segundos
    dedupingInterval: 2000, // Evitar duplicatas
    onSuccess: (data) => {
      // Marcar última atualização bem-sucedida
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`tenant-${tenantId}-last-update`, new Date().toISOString());
      }
    },
  });

  // Detectar mudança de status
  useEffect(() => {
    if (!data?.status) return;

    // Se o status mudou em relação ao anterior
    if (prevStatusRef.current !== null && prevStatusRef.current !== data.status) {
      setStatusChanged(true);
      setLastStatus(data.status);

      // CRÍTICO: Atualizar referência ANTES de retornar
      prevStatusRef.current = data.status;

      // Auto-reset após 3 segundos
      const timer = setTimeout(() => setStatusChanged(false), 3000);
      return () => clearTimeout(timer);
    }

    // Atualizar referência para o estado inicial também
    prevStatusRef.current = data.status;
  }, [data?.status]);

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
    if (tenantSessionVersion !== data.sessionVersion || tenantPlanRevision !== data.planRevision) {
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
