import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { isRouteAllowedByModulesEdge } from "@/app/lib/module-map-edge";

// Função para extrair tenant do domínio
function extractTenantFromDomain(host: string): string | null {
  // Remove porta se existir
  const cleanHost = host.split(":")[0];

  // Para domínios Vercel: subdomain.magiclawyer.vercel.app
  if (cleanHost.endsWith(".magiclawyer.vercel.app")) {
    const subdomain = cleanHost.replace(".magiclawyer.vercel.app", "");

    // Se não é o domínio principal, retorna o subdomínio
    if (subdomain && subdomain !== "magiclawyer") {
      return subdomain;
    }
  }

  // Para domínios customizados: subdomain.magiclawyer.com.br
  if (cleanHost.endsWith(".magiclawyer.com.br")) {
    const subdomain = cleanHost.replace(".magiclawyer.com.br", "");

    if (subdomain) {
      return subdomain;
    }
  }

  // Para domínios diretos: sandra.com.br
  // Neste caso, o domínio completo é o identificador do tenant
  if (!cleanHost.includes("magiclawyer") && !cleanHost.includes("vercel.app")) {
    return cleanHost;
  }

  return null;
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    let sessionChecked = false; // Controlar se verificou sessão nesta execução

    // Validar sessão periodicamente (a cada 15 segundos)
    if (token && (token as any).tenantId) {
      const lastCheck = req.cookies.get("ml-last-session-check");
      const shouldCheck =
        !lastCheck || Date.now() - Number(lastCheck.value) > 15000;

      if (shouldCheck) {
        try {
          const base = process.env.NEXTAUTH_URL || "http://localhost:9192";
          const url = new URL(
            "/api/internal/session/validate",
            base,
          ).toString();

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-token": process.env.REALTIME_INTERNAL_TOKEN || "",
            },
            body: JSON.stringify({
              tenantId: (token as any).tenantId,
              userId: (token as any).id,
              tenantVersion: (token as any).tenantSessionVersion || 1,
              userVersion: (token as any).sessionVersion || 1,
            }),
          });

          if (response.status === 409) {
            const data = await response.json();
            const logoutUrl = new URL("/login", req.url);

            logoutUrl.searchParams.set(
              "reason",
              data.reason || "SESSION_REVOKED",
            );

            const res = NextResponse.redirect(logoutUrl);

            res.cookies.delete("next-auth.session-token");
            res.cookies.set("ml-session-revoked", "1", { path: "/" });

            return res;
          }

          // Marcar que verificou nesta execução
          sessionChecked = true;
        } catch (error) {
          console.error("Erro ao validar sessão:", error);
          // Em caso de erro, continuar normalmente (fail-safe)
        }
      }
    }

    // Continuar com o fluxo normal do middleware...
    // cookie será setado no final se sessionChecked for true

    // Detectar tenant baseado no domínio
    const host = req.headers.get("host") || "";
    const tenantFromDomain = extractTenantFromDomain(host);

    // Se detectamos um tenant pelo domínio, adicionar aos headers
    if (tenantFromDomain) {
      const response = NextResponse.next();

      response.headers.set("x-tenant-from-domain", tenantFromDomain);
    }

    // Se não está logado e não está na página de login, redireciona para login
    if (!isAuth && !isAuthPage) {
      // Se está tentando acessar rota protegida, redireciona para login
      if (
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/processos") ||
        req.nextUrl.pathname.startsWith("/documentos") ||
        req.nextUrl.pathname.startsWith("/financeiro") ||
        req.nextUrl.pathname.startsWith("/relatorios") ||
        req.nextUrl.pathname.startsWith("/equipe") ||
        req.nextUrl.pathname.startsWith("/help") ||
        req.nextUrl.pathname.startsWith("/configuracoes") ||
        req.nextUrl.pathname.startsWith("/usuario") ||
        req.nextUrl.pathname.startsWith("/admin")
      ) {
        // Se está tentando acessar área administrativa, redireciona para login normal
        // O redirecionamento para admin será feito após o login baseado no role do usuário
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Se está logado e está na página de login, redireciona baseado no role do usuário
    if (isAuth && isAuthPage) {
      const userRole = (token as any)?.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Se está logado e está na página inicial, redireciona baseado no role do usuário
    if (isAuth && req.nextUrl.pathname === "/") {
      const userRole = (token as any)?.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Verificar se usuário comum está tentando acessar área administrativa
    if (isAuth && req.nextUrl.pathname.startsWith("/admin")) {
      const userRole = (token as any)?.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Verificar se SuperAdmin está tentando acessar área comum (PROIBIR)
    if (
      isAuth &&
      !req.nextUrl.pathname.startsWith("/admin") &&
      !req.nextUrl.pathname.startsWith("/api") &&
      !req.nextUrl.pathname.startsWith("/login")
    ) {
      const userRole = (token as any)?.role;
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      // SuperAdmin NÃO pode acessar rotas de usuário comum
      if (isSuperAdmin) {
        // Rotas que SuperAdmin NÃO pode acessar
        const rotasProibidas = [
          "/dashboard",
          "/processos",
          "/documentos",
          "/agenda",
          "/financeiro",
          "/juizes",
          "/relatorios",
          "/equipe",
          "/help",
          "/configuracoes",
          "/usuario",
        ];

        const isRotaProibida = rotasProibidas.some((rota) =>
          req.nextUrl.pathname.startsWith(rota),
        );

        if (isRotaProibida) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }
    }

    // Verificar permissões de módulos para usuários comuns
    if (
      isAuth &&
      !req.nextUrl.pathname.startsWith("/admin") &&
      !req.nextUrl.pathname.startsWith("/api")
    ) {
      const modules = (token as any)?.tenantModules as string[] | undefined;
      const role = (token as any)?.role;

      if (role !== "SUPER_ADMIN") {
        try {
          const allowed = await isRouteAllowedByModulesEdge(
            req.nextUrl.pathname,
            modules,
            req.nextUrl.origin,
          );

          if (!allowed) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        } catch (error) {
          console.error("Erro ao verificar permissões de módulos:", error);
          // Em caso de erro, permitir acesso (fail-safe)
        }
      }
    }

    // Retornar resposta com cookie de verificação se necessário
    const response = NextResponse.next();

    if (sessionChecked) {
      response.cookies.set("ml-last-session-check", Date.now().toString(), {
        httpOnly: false,
        path: "/",
        maxAge: 60, // 1 minuto
      });
    }

    return response;
  },
  {
    callbacks: {
      authorized: () => {
        // Para rotas protegidas, verifica se tem token
        return true; // Deixamos o middleware acima fazer a lógica
      },
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
