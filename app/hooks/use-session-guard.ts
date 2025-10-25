"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

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
export function useSessionGuard(options: SessionGuardOptions = {}): SessionGuardResult {
  const { interval = 5, publicRoutes = ["/login", "/", "/about", "/precos"] } = options; // Reduzido para 5s

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
    if (sessionStatus !== "authenticated" || !session?.user || isPublicRoute || revokedRef.current || isRevoked) {
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

        console.log("[useSessionGuard] ⚠️ Sessão inválida detectada:", { reason });

        // Prevenir revalidações repetidas
        if (revokedRef.current) {
          console.log("[useSessionGuard] ⚠️ Revalidação ignorada (já revogada)");
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
          console.log(`[useSessionGuard] 🔄 Redirecionando para /login?reason=${reason}`);
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
   * Efeito para configurar verificação periódica
   */
  useEffect(() => {
    // Não fazer verificação se não estiver autenticado ou em rota pública
    if (sessionStatus !== "authenticated" || !session?.user || isPublicRoute || revokedRef.current || isRevoked) {
      console.log("[useSessionGuard] useEffect: Verificação não iniciada:", {
        sessionStatus,
        hasUser: !!session?.user,
        isPublicRoute,
        revokedRef: revokedRef.current,
        isRevoked,
      });
      return;
    }

    console.log(`[useSessionGuard] 🔄 Iniciando verificação periódica (intervalo: ${interval}s)`);

    // Executar verificação imediatamente na primeira vez
    validateSession();

    // Configurar intervalo para verificação periódica
    const intervalId = setInterval(() => {
      console.log(`[useSessionGuard] ⏰ Intervalo disparado (a cada ${interval}s)`);
      validateSession();
    }, interval * 1000);

    // Adicionar listener para validar quando a aba recebe foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !revokedRef.current && !isRevoked) {
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
  }, [session, sessionStatus, isPublicRoute, validateSession, interval, isRevoked]);

  return {
    isChecking: sessionStatus === "loading",
    error: null,
    isRevoked, // Expor estado de revogação para componentes filhos
  };
}
