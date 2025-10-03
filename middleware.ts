import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

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
        req.nextUrl.pathname.startsWith("/usuario")
      ) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Se está logado e está na página de login, redireciona para dashboard
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Se está logado e está na página inicial, redireciona para dashboard
    if (isAuth && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Para rotas protegidas, verifica se tem token
        return true; // Deixamos o middleware acima fazer a lógica
      },
    },
  }
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
