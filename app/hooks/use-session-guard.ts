"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

import { useRealtime } from "@/app/providers/realtime-provider";

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
  const { interval = 30, publicRoutes = ["/login", "/", "/about", "/precos"] } =
    options;

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const realtime = useRealtime();
  const currentUserId = session?.user?.id;

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

  /**
   * Função para validar a sessão contra o banco de dados
   */
  const validateSession = useCallback(async () => {
    // Se não está autenticado, está em rota pública ou já foi revogada, não precisa verificar
    if (
      sessionStatus !== "authenticated" ||
      !currentUserId ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
      return;
    }

    if (validationInFlightRef.current) {
      return;
    }

    validationInFlightRef.current = true;

    try {
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
    } catch (error) {
      // Em caso de erro de rede, não fazer nada (fail-open)
      console.warn("[useSessionGuard] Falha na validação de sessão", error);
    } finally {
      validationInFlightRef.current = false;
    }
  }, [sessionStatus, currentUserId, isPublicRoute, isRevoked, router]);

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
    if (
      sessionStatus !== "authenticated" ||
      !currentUserId ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
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
  }, [
    sessionStatus,
    currentUserId,
    isPublicRoute,
    realtime,
    forceLogout,
    isRevoked,
  ]);

  /**
   * Efeito para verificação periódica (fallback apenas quando realtime estiver desconectado)
   */
  useEffect(() => {
    const shouldSkipValidation =
      sessionStatus !== "authenticated" ||
      !currentUserId ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked;

    // Sem sessão válida, não há o que validar
    if (shouldSkipValidation) {
      return;
    }

    // Empresa grande: com realtime conectado, evita polling agressivo
    if (realtime.isConnected) {
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
    const intervalId = setInterval(runValidationIfVisible, interval * 1000);

    // Ao voltar para a aba, valida instantaneamente
    const handleVisibilityChange = () => {
      runValidationIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    sessionStatus,
    currentUserId,
    isPublicRoute,
    validateSession,
    interval,
    isRevoked,
    realtime.isConnected,
  ]);

  /**
   * Validação inicial ao autenticar (independente de polling).
   * Evita ficar com sessão inválida se houver perda de evento realtime.
   */
  useEffect(() => {
    if (
      sessionStatus !== "authenticated" ||
      !currentUserId ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
      return;
    }

    void validateSession();
  }, [sessionStatus, currentUserId, isPublicRoute, isRevoked, validateSession]);

  return {
    isChecking: sessionStatus === "loading",
    error: null,
    isRevoked, // Expor estado de revogação para componentes filhos
  };
}
