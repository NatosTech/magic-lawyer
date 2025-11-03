"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import useSWR from "swr";

/**
 * Hook para verificar permissão específica (módulo + ação)
 * Considera override individual → cargo → role padrão
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
  },
) {
  const { data: session } = useSession();
  const enabled = options?.enabled ?? true;

  const key = modulo && acao ? ["permission-check", modulo, acao, options?.usuarioId] : null;

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

  return {
    hasPermission: data?.hasPermission ?? false,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,
  };
}

/**
 * Hook para verificar múltiplas permissões de uma vez
 * Retorna um objeto com todas as permissões verificadas
 */
export function usePermissionsCheck(
  checks: Array<{ modulo: string; acao: string; usuarioId?: string }>,
  options?: {
    enabled?: boolean;
  },
) {
  const enabled = options?.enabled ?? true;

  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !session?.user || checks.length === 0) {
      setIsLoading(false);
      return;
    }

    async function checkAll() {
      setIsLoading(true);
      try {
        const results: Record<string, boolean> = {};

        await Promise.all(
          checks.map(async ({ modulo, acao, usuarioId }) => {
            const key = `${modulo}.${acao}`;
            try {
              const response = await fetch("/api/permissions/check", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  modulo,
                  acao,
                  usuarioId,
                }),
              });

              if (!response.ok) {
                throw new Error("Erro ao verificar permissão");
              }

              const data = await response.json();
              results[key] = data.hasPermission ?? false;
            } catch (error) {
              console.error(`Erro ao verificar ${key}:`, error);
              results[key] = false;
            }
          }),
        );

        setPermissions(results);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAll();
  }, [enabled, session, JSON.stringify(checks)]);

  const hasPermission = (modulo: string, acao: string): boolean => {
    return permissions[`${modulo}.${acao}`] ?? false;
  };

  return {
    permissions,
    hasPermission,
    isLoading,
  };
}

