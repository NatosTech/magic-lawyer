"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { useRealtime } from "@/app/providers/realtime-provider";

/**
 * Hook para verificar permissão específica (módulo + ação)
 * Considera override individual → cargo → role padrão
 * Assina eventos realtime (usuario-update, cargo-update) para revalidação automática
 *
 * @param modulo - Slug do módulo (ex: 'processos', 'clientes')
 * @param acao - Ação desejada (ex: 'criar', 'editar', 'visualizar')
 * @param options - Opções para o hook
 */
export function usePermissionCheck(
  modulo: string | null,
  acao: string | null,
  options?: {
    enabled?: boolean;
    usuarioId?: string;
    enableEarlyAccess?: boolean; // Retornar false até carregar se true
  },
) {
  const { data: session } = useSession();
  const realtime = useRealtime();
  const enabled = options?.enabled ?? true;
  const enableEarlyAccess = options?.enableEarlyAccess ?? false;

  const tenantId = (session?.user as any)?.tenantId;
  const key = useMemo(() => {
    if (!modulo || !acao || !tenantId) return null;

    return [
      "permission-check",
      tenantId,
      modulo,
      acao,
      options?.usuarioId || session?.user?.id,
    ];
  }, [modulo, acao, tenantId, options?.usuarioId, session?.user?.id]);

  const { data, error, isLoading, mutate } = useSWR<{ hasPermission: boolean }>(
    enabled && key ? key : null,
    async () => {
      if (!modulo || !acao) return { hasPermission: false };

      try {
        const response = await fetch("/api/permissions/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modulo,
            acao,
            usuarioId: options?.usuarioId,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao verificar permissão");
        }

        return await response.json();
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);

        return { hasPermission: false };
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache por 2 segundos
    },
  );

  // Assinar eventos realtime para revalidação automática
  useEffect(() => {
    if (!realtime || !key) return;

    const unsubscribe1 = realtime.subscribe("usuario-update", () => {
      // Revalidar quando usuário é atualizado
      mutate();
    });

    const unsubscribe2 = realtime.subscribe("cargo-update", () => {
      // Revalidar quando cargo é atualizado (pode afetar permissões)
      mutate();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [realtime, key, mutate]);

  const hasPermission =
    enableEarlyAccess && isLoading ? false : (data?.hasPermission ?? false);

  return {
    hasPermission,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,
  };
}

/**
 * Hook para verificar múltiplas permissões de uma vez
 * Usa API otimizada checkPermissions para evitar N round-trips
 * Assina eventos realtime para revalidação automática
 *
 * @param checks - Array de objetos com módulo e ação a verificar
 * @param options - Opções para o hook
 */
export function usePermissionsCheck(
  checks: Array<{ modulo: string; acao: string; usuarioId?: string }>,
  options?: {
    enabled?: boolean;
    requiredAll?: boolean; // Se true, hasPermission só é true se TODAS forem true
    requiredAny?: boolean; // Se true, hasPermission é true se QUALQUER uma for true
    enableEarlyAccess?: boolean; // Retornar false até carregar se true
  },
) {
  const { data: session } = useSession();
  const realtime = useRealtime();
  const enabled = options?.enabled ?? true;
  const enableEarlyAccess = options?.enableEarlyAccess ?? false;

  const tenantId = (session?.user as any)?.tenantId;

  // Criar chave estável para cache
  const key = useMemo(() => {
    if (!tenantId || checks.length === 0) return null;
    const sortedChecks = [...checks].sort((a, b) => {
      if (a.modulo !== b.modulo) return a.modulo.localeCompare(b.modulo);

      return a.acao.localeCompare(b.acao);
    });

    return [
      "permissions-check",
      tenantId,
      JSON.stringify(sortedChecks),
      checks[0]?.usuarioId || session?.user?.id,
    ];
  }, [tenantId, checks, session?.user?.id]);

  const { data, error, isLoading, mutate } = useSWR<{
    permissions: Record<string, boolean>;
  }>(
    enabled && key ? key : null,
    async () => {
      if (checks.length === 0) return { permissions: {} };

      try {
        const response = await fetch("/api/permissions/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: checks.map(({ modulo, acao, usuarioId }) => ({
              modulo,
              acao,
              usuarioId,
            })),
            usuarioId: checks[0]?.usuarioId,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao verificar permissões");
        }

        const result = await response.json();

        return { permissions: result.permissions || {} };
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        // Retornar todas como false em caso de erro
        const permissions: Record<string, boolean> = {};

        checks.forEach(({ modulo, acao }) => {
          permissions[`${modulo}.${acao}`] = false;
        });

        return { permissions };
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache por 2 segundos
    },
  );

  // Assinar eventos realtime para revalidação automática
  useEffect(() => {
    if (!realtime || !key) return;

    const unsubscribe1 = realtime.subscribe("usuario-update", () => {
      mutate();
    });

    const unsubscribe2 = realtime.subscribe("cargo-update", () => {
      mutate();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [realtime, key, mutate]);

  const permissions = data?.permissions || {};

  const hasPermission = useMemo(() => {
    if (enableEarlyAccess && isLoading) return false;

    const values = Object.values(permissions);

    if (values.length === 0) return false;

    if (options?.requiredAll) {
      return values.every(Boolean);
    }

    if (options?.requiredAny) {
      return values.some(Boolean);
    }

    // Por padrão, retorna true se todas forem true
    return values.every(Boolean);
  }, [
    permissions,
    isLoading,
    enableEarlyAccess,
    options?.requiredAll,
    options?.requiredAny,
  ]);

  const hasPermissionFor = (modulo: string, acao: string): boolean => {
    return permissions[`${modulo}.${acao}`] ?? false;
  };

  return {
    permissions,
    hasPermission,
    hasPermissionFor,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,
  };
}
