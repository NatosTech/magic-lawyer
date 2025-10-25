import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";

/**
 * Rota PÚBLICA intermediária para validação de sessão
 *
 * Esta rota é chamada pelo cliente e internamente valida
 * a sessão contra o banco de dados, sem expor o token
 * interno ao frontend.
 */
export async function POST(request: Request) {
  try {
    // Obter sessão do NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ valid: false, reason: "NOT_AUTHENTICATED" }, { status: 401 });
    }

    const { userId, tenantId, tenantSessionVersion, userSessionVersion } = await request.json();

    // Validar que o userId da requisição corresponde ao da sessão
    if (userId !== session.user.id) {
      return NextResponse.json({ valid: false, reason: "USER_ID_MISMATCH" }, { status: 403 });
    }

    // Buscar dados atuais do banco
    const [user, tenant] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          active: true,
          sessionVersion: true,
          tenantId: true,
        },
      }),
      tenantId
        ? prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
              id: true,
              status: true,
              sessionVersion: true,
            },
          })
        : null,
    ]);

    if (!user) {
      return NextResponse.json({ valid: false, reason: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Verificar se usuário está ativo
    if (!user.active) {
      return NextResponse.json({ valid: false, reason: "USER_DISABLED" }, { status: 409 });
    }

    // Verificar se tenant existe e está ativo
    if (tenant) {
      if (tenant.status !== "ACTIVE") {
        return NextResponse.json({ valid: false, reason: tenant.status === "SUSPENDED" ? "TENANT_SUSPENDED" : "TENANT_CANCELLED" }, { status: 409 });
      }

      // Verificar versão da sessão do tenant
      if (tenant.sessionVersion !== tenantSessionVersion) {
        return NextResponse.json({ valid: false, reason: "SESSION_VERSION_MISMATCH" }, { status: 409 });
      }
    }

    // Verificar versão da sessão do usuário
    if (user.sessionVersion !== userSessionVersion) {
      return NextResponse.json({ valid: false, reason: "SESSION_VERSION_MISMATCH" }, { status: 409 });
    }

    // Tudo OK
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[session/check] Erro ao validar sessão:", error);
    return NextResponse.json({ valid: false, reason: "INTERNAL_ERROR" }, { status: 500 });
  }
}
