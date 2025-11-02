"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import {
  getCargos,
  getUsuariosEquipe,
  getDashboardEquipe,
  listModulosPorTenant,
  type CargoData,
  type UsuarioEquipeData,
  type ModuloInfo,
} from "@/app/actions/equipe";
import { useRealtime } from "@/app/providers/realtime-provider";

/**
 * Hook para buscar cargos da equipe
 */
export function useCargos() {
  const { data: session } = useSession();
  const realtime = useRealtime();

  const tenantId = session?.user?.tenantId || null;

  const { data, error, isLoading, mutate } = useSWR<CargoData[]>(
    tenantId ? ["equipe-cargos", tenantId] : null,
    async () => {
      try {
        const cargos = await getCargos();

        return cargos;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Erro ao carregar cargos",
        );
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache por 2 segundos
    },
  );

  // Listener para eventos de atualização de cargos via realtime
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = realtime.subscribe(
      "equipe.cargo.updated",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          mutate(); // Revalidar cache de cargos
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [tenantId, realtime, mutate]);

  return {
    cargos: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar usuários da equipe
 */
export function useUsuariosEquipe() {
  const { data: session } = useSession();
  const realtime = useRealtime();

  const tenantId = session?.user?.tenantId || null;

  const { data, error, isLoading, mutate } = useSWR<UsuarioEquipeData[]>(
    tenantId ? ["equipe-usuarios", tenantId] : null,
    async () => {
      try {
        const usuarios = await getUsuariosEquipe();

        return usuarios;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : "Erro ao carregar usuários da equipe",
        );
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  );

  // Listener para eventos de atualização de usuários via realtime
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = realtime.subscribe(
      "equipe.usuario.updated",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          mutate(); // Revalidar cache de usuários
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [tenantId, realtime, mutate]);

  return {
    usuarios: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar dashboard da equipe
 */
export function useDashboardEquipe() {
  const { data: session } = useSession();

  const tenantId = session?.user?.tenantId || null;

  const { data, error, isLoading, mutate } = useSWR(
    tenantId ? ["equipe-dashboard", tenantId] : null,
    async () => {
      try {
        const dashboard = await getDashboardEquipe();

        return dashboard;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : "Erro ao carregar dashboard da equipe",
        );
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
      dedupingInterval: 5000,
    },
  );

  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para buscar módulos acessíveis do tenant
 */
export function useModulosTenant() {
  const { data: session } = useSession();
  const realtime = useRealtime();

  const tenantId = session?.user?.tenantId || null;

  const { data, error, isLoading, mutate } = useSWR<ModuloInfo[]>(
    tenantId ? ["equipe-modulos", tenantId] : null,
    async () => {
      try {
        const modulos = await listModulosPorTenant();

        return modulos;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Erro ao carregar módulos",
        );
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  // Listener para eventos de atualização de plano/módulos via realtime
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = realtime.subscribe(
      "plan-update",
      (event: RealtimeEvent) => {
        if (event.tenantId === tenantId) {
          mutate(); // Revalidar cache de módulos
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [tenantId, realtime, mutate]);

  return {
    modulos: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

