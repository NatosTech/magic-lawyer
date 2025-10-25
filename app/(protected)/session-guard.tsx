"use client";

import { useSessionGuard } from "@/app/hooks/use-session-guard";

/**
 * Componente wrapper que aplica a guarda de sessão
 *
 * Este componente é usado no layout protegido para garantir
 * que a sessão seja validada periodicamente (a cada 5s).
 *
 * Se a sessão for invalidada, redireciona automaticamente
 * para /login com o motivo.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  // Aplicar a guarda de sessão com verificação a cada 5s
  const { isRevoked } = useSessionGuard({
    interval: 5, // Verificar a cada 5 segundos
    publicRoutes: ["/login", "/", "/about", "/precos"],
  });

  // Se a sessão foi revogada, mostrar overlay ou nada (redirecionamento em andamento)
  if (isRevoked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-semibold">Encerrando sessão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
