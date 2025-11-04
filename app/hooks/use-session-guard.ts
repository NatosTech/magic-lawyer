"use client";

import type { RealtimeEvent } from "@/app/lib/realtime/types";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

import { useRealtime } from "@/app/providers/realtime-provider";

interface SessionGuardOptions {
  /**
   * Intervalo em segundos para verificar a sessão (padrão: 15s)
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
    options; // Aumentado para 30s (fallback se WebSocket falhar)

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const realtime = useRealtime();

  // Flag para impedir revalidações repetidas
  const revokedRef = useRef(false);
  const [isRevoked, setIsRevoked] = useState(false);

  // Verificar se a rota atual é pública
  // IMPORTANTE: "/" não deve fazer match com "/dashboard", apenas com exatamente "/"
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname?.startsWith(route);
  });

  console.log("[useSessionGuard] Configuração:", {
    pathname,
    isPublicRoute,
    publicRoutes,
  });

  /**
   * Função para validar a sessão contra o banco de dados
   */
  const validateSession = useCallback(async () => {
    // Se não está autenticado, está em rota pública ou já foi revogada, não precisa verificar
    if (
      sessionStatus !== "authenticated" ||
      !session?.user ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
      console.log("[useSessionGuard] Verificação pulada:", {
        sessionStatus,
        hasUser: !!session?.user,
        isPublicRoute,
        revokedRef: revokedRef.current,
        isRevoked,
      });

      return;
    }

    try {
      const tenantSessionVersion = (session.user as any)?.tenantSessionVersion;
      const userSessionVersion = (session.user as any)?.sessionVersion;

      console.log("[useSessionGuard] Iniciando validação:", {
        userId: session.user.id,
        tenantId: (session.user as any)?.tenantId,
        tenantSessionVersion,
        userSessionVersion,
      });

      // Usar rota pública intermediária que valida no servidor sem expor token interno
      const response = await fetch("/api/session/check", {
        method: "POST",
        credentials: "same-origin", // Garantir envio de cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          tenantId: (session.user as any)?.tenantId,
          tenantSessionVersion,
          userSessionVersion,
        }),
      });

      const data = await response.json();

      console.log("[useSessionGuard] Resposta recebida:", {
        status: response.status,
        valid: data.valid,
        reason: data.reason,
      });

      // Se a sessão foi invalidada (qualquer resposta que não seja válida)
      if (!data.valid) {
        const reason = data.reason || "SESSION_REVOKED";

        console.log("[useSessionGuard] ⚠️ Sessão inválida detectada:", {
          reason,
        });

        // Prevenir revalidações repetidas
        if (revokedRef.current) {
          console.log(
            "[useSessionGuard] ⚠️ Revalidação ignorada (já revogada)",
          );

          return;
        }

        console.log("[useSessionGuard] 🔒 Iniciando logout forçado...");
        revokedRef.current = true;
        setIsRevoked(true);

        // Forçar logout do NextAuth para limpar token
        await signOut({ redirect: false });

        // Dar tempo para limpar UI antes de redirecionar
        setTimeout(() => {
          // Usar replace para não permitir voltar
          console.log(
            `[useSessionGuard] 🔄 Redirecionando para /login?reason=${reason}`,
          );
          router.replace(`/login?reason=${reason}`);
        }, 100);

        return;
      }

      console.log("[useSessionGuard] ✅ Sessão válida");

      // Tudo OK, sessão válida
    } catch (error) {
      // Em caso de erro de rede, não fazer nada (fail-open)
      console.warn("[useSessionGuard] Erro ao validar sessão", error);
    }
  }, [session, sessionStatus, isPublicRoute, router]);

  /**
   * Função para forçar logout quando evento hard é recebido
   */
  const forceLogout = useCallback(
    async (reason: string) => {
      if (revokedRef.current) {
        console.log("[useSessionGuard] ⚠️ Logout ignorado (já revogada)");

        return;
      }

      console.log(
        "[useSessionGuard] 🔒 Evento WebSocket detectou revogação:",
        reason,
      );
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
      !session?.user ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
      return;
    }

    console.log(
      "[useSessionGuard] 📡 Registrando listener WebSocket para tenant-status",
    );

    // Subscribe em eventos tenant-status (hard logout para todos do tenant)
    const unsubscribeTenant = realtime.subscribe(
      "tenant-status",
      (event: RealtimeEvent) => {
        console.log(
          "[useSessionGuard] 📨 Evento tenant-status recebido:",
          event,
        );

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
        console.log(
          "[useSessionGuard] 📨 Evento user-status recebido:",
          event,
        );

        const payload = event.payload as any;
        const targetUserId = payload.userId || event.userId;

        if (
          targetUserId === session.user.id &&
          payload.active === false
        ) {
          forceLogout("USER_DEACTIVATED");
        }
      },
    );

    // Cleanup
    return () => {
      console.log("[useSessionGuard] 📡 Removendo listener WebSocket");
      unsubscribeTenant();
      unsubscribeUser();
    };
  }, [sessionStatus, session, isPublicRoute, realtime, forceLogout, isRevoked]);

  /**
   * Efeito para configurar verificação periódica (fallback se WebSocket falhar)
   */
  useEffect(() => {
    // Não fazer verificação se não estiver autenticado ou em rota pública
    if (
      sessionStatus !== "authenticated" ||
      !session?.user ||
      isPublicRoute ||
      revokedRef.current ||
      isRevoked
    ) {
      console.log("[useSessionGuard] useEffect: Verificação não iniciada:", {
        sessionStatus,
        hasUser: !!session?.user,
        isPublicRoute,
        revokedRef: revokedRef.current,
        isRevoked,
      });

      return;
    }

    console.log(
      `[useSessionGuard] 🔄 Iniciando verificação periódica (intervalo: ${interval}s)`,
    );

    // Executar verificação imediatamente na primeira vez
    validateSession();

    // Configurar intervalo para verificação periódica
    const intervalId = setInterval(() => {
      console.log(
        `[useSessionGuard] ⏰ Intervalo disparado (a cada ${interval}s)`,
      );
      validateSession();
    }, interval * 1000);

    // Adicionar listener para validar quando a aba recebe foco
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !revokedRef.current &&
        !isRevoked
      ) {
        validateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup ao desmontar
    return () => {
      console.log("[useSessionGuard] 🧹 Limpando intervalo e listeners");
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    session,
    sessionStatus,
    isPublicRoute,
    validateSession,
    interval,
    isRevoked,
  ]);

  return {
    isChecking: sessionStatus === "loading",
    error: null,
    isRevoked, // Expor estado de revogação para componentes filhos
  };
}
