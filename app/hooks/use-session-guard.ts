"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

import { useRealtime } from "@/app/providers/realtime-provider";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

interface SessionGuardOptions {
  /**
   * Intervalo em segundos para verificar a sessão (fallback quando realtime cair)
   */
  interval?: number;
  /**
   * Rotas que não devem ser protegidas
   */
  publicRoutes?: string[];
}

interface SessionGuardResult {
  /**
   * Indica se a verificação está em andamento
   */
  isChecking: boolean;
  /**
   * Último erro encontrado, se houver
   */
  error: string | null;
  /**
   * Indica se a sessão foi revogada
   */
  isRevoked: boolean;
}

/**
 * Hook para guarda de sessão com verificação periódica
 *
 * Monitora o sessionVersion do usuário e tenant, validando
 * se a sessão ainda é válida através da API interna de validação.
 *
 * Se a sessão estiver invalidada, redireciona para /login com o motivo.
 */
export function useSessionGuard(
  options: SessionGuardOptions = {},
): SessionGuardResult {
  const { interval = REALTIME_POLLING.SESSION_GUARD_FALLBACK_MS / 1000, publicRoutes = ["/login", "/", "/about", "/precos"] } =
    options;

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const realtime = useRealtime();
  const currentUserId = session?.user?.id;
  const fallbackMs = interval * 1000;
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const [pollingInterval, setPollingInterval] = useState(() =>
    resolvePollingInterval({
      isConnected: true,
      enabled: false,
      fallbackMs,
    }),
  );

  // Flag para impedir revalidações repetidas
  const revokedRef = useRef(false);
  const validationInFlightRef = useRef(false);
  const [isRevoked, setIsRevoked] = useState(false);

  // Verificar se a rota atual é pública
  // IMPORTANTE: "/" não deve fazer match com "/dashboard", apenas com exatamente "/"
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname?.startsWith(route);
  });

  const canRunPolling =
    sessionStatus === "authenticated" &&
    Boolean(currentUserId) &&
    !isPublicRoute &&
    !revokedRef.current &&
    !isRevoked;

  useEffect(() => {
    const apply = (globalEnabled = isPollingEnabled) => {
      setPollingInterval(
        resolvePollingInterval({
          isConnected: realtime.isConnected,
          enabled: globalEnabled && canRunPolling,
          fallbackMs,
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
  }, [
    canRunPolling,
    fallbackMs,
    isPollingEnabled,
    realtime.isConnected,
  ]);

  /**
   * Função para validar a sessão contra o banco de dados
   */
  const validateSession = useCallback(async () => {
    // Se não está autenticado, está em rota pública ou já foi revogada, não precisa verificar
    if (!canRunPolling || validationInFlightRef.current) {
      return;
    }

    validationInFlightRef.current = true;

    try {
      await tracePollingAttempt(
        {
          hookName: "useSessionGuard",
          endpoint: "/api/session/check",
          source: "manual",
          intervalMs: pollingInterval,
        },
        async () => {
          // Usar rota pública intermediária que valida no servidor sem expor token interno
          const response = await fetch("/api/session/check", {
            method: "POST",
            credentials: "same-origin", // Garantir envio de cookies
            headers: {
              "Content-Type": "application/json",
            },
            body: "{}",
          });

          const data = await response.json();

          // Se a sessão foi invalidada (qualquer resposta que não seja válida)
          if (!data.valid) {
            const reason = data.reason || "SESSION_REVOKED";

            // Prevenir revalidações repetidas
            if (revokedRef.current) {
              return;
            }

            revokedRef.current = true;
            setIsRevoked(true);

            // Forçar logout do NextAuth para limpar token
            await signOut({ redirect: false });

            // Dar tempo para limpar UI antes de redirecionar
            setTimeout(() => {
              router.replace(`/login?reason=${reason}`);
            }, 100);
          }
        },
      );
    } catch (error) {
      // Em caso de erro de rede, não fazer nada (fail-open)
      console.warn("[useSessionGuard] Falha na validação de sessão", error);
    } finally {
      validationInFlightRef.current = false;
    }
  }, [canRunPolling, pollingInterval, router]);

  /**
   * Função para forçar logout quando evento hard é recebido
   */
  const forceLogout = useCallback(
    async (reason: string) => {
      if (revokedRef.current) {
        return;
      }

      revokedRef.current = true;
      setIsRevoked(true);

      await signOut({ redirect: false });

      setTimeout(() => {
        router.replace(`/login?reason=${reason}`);
      }, 100);
    },
    [router],
  );

  /**
   * Listener para eventos WebSocket (realtime)
   */
  useEffect(() => {
    if (!canRunPolling) {
      return;
    }

    // Subscribe em eventos tenant-status (hard logout para todos do tenant)
    const unsubscribeTenant = realtime.subscribe(
      "tenant-status",
      (event: RealtimeEvent) => {
        const payload = event.payload as any;

        // Se tenant ou usuário foi desativado, fazer logout
        if (payload.status === "SUSPENDED" || payload.status === "CANCELLED") {
          forceLogout(
            payload.status === "SUSPENDED"
              ? "TENANT_SUSPENDED"
              : "TENANT_CANCELLED",
          );
        }
      },
    );

    // Subscribe em eventos user-status (logout individual)
    const unsubscribeUser = realtime.subscribe(
      "user-status",
      (event: RealtimeEvent) => {
        const payload = event.payload as any;
        const targetUserId = payload.userId || event.userId;

        if (targetUserId === currentUserId && payload.active === false) {
          forceLogout("USER_DEACTIVATED");
        }
      },
    );

    // Cleanup
    return () => {
      unsubscribeTenant();
      unsubscribeUser();
    };
  }, [canRunPolling, currentUserId, forceLogout, realtime]);

  /**
   * Efeito para verificação periódica (fallback apenas quando realtime estiver desconectado)
   */
  useEffect(() => {
    // Sem sessão válida, não há o que validar
    if (!canRunPolling) {
      return;
    }

    // Empresa grande: com realtime conectado, evita polling
    if (realtime.isConnected) {
      return;
    }

    if (pollingInterval <= 0) {
      return;
    }

    const runValidationIfVisible = () => {
      if (
        document.visibilityState === "visible" &&
        !revokedRef.current &&
        !isRevoked
      ) {
        void validateSession();
      }
    };

    // Valida imediatamente ao entrar em modo fallback
    runValidationIfVisible();

    // Polling apenas em fallback
    const intervalId = setInterval(runValidationIfVisible, pollingInterval);

    // Ao voltar para a aba, valida instantaneamente
    const handleVisibilityChange = () => {
      runValidationIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canRunPolling, isRevoked, pollingInterval, realtime.isConnected, validateSession]);

  /**
   * Validação inicial ao autenticar (independente de polling).
   * Evita ficar com sessão inválida se houver perda de evento realtime.
   */
  useEffect(() => {
    if (!canRunPolling) {
      return;
    }

    void validateSession();
  }, [canRunPolling, validateSession]);

  return {
    isChecking: sessionStatus === "loading",
    error: null,
    isRevoked, // Expor estado de revogação para componentes filhos
  };
}
