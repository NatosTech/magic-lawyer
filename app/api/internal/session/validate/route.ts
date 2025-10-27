import { NextResponse } from "next/server";

import prisma from "@/app/lib/prisma";
import { TenantStatus } from "@/app/generated/prisma";

/**
 * Valida se a sessão do tenant/usuário ainda é válida
 * Compara sessionVersion do JWT com o valor atual no banco
 */
export async function POST(request: Request) {
  try {
    // Verificar se o token interno está configurado corretamente
    const expectedToken = process.env.REALTIME_INTERNAL_TOKEN;
    if (!expectedToken || expectedToken.trim() === "") {
      return NextResponse.json({ success: false, error: "Configuração ausente: REALTIME_INTERNAL_TOKEN não definido" }, { status: 500 });
    }

    // Verificar token de autenticação interno
    const token = request.headers.get("x-internal-token");

    if (!token || token !== expectedToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, userId, tenantVersion, userVersion } = await request.json();

    if (!tenantId || !tenantVersion) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validar tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        status: true,
        sessionVersion: true,
        statusReason: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        {
          status: "revoked",
          entity: "TENANT",
          reason: "TENANT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      return NextResponse.json(
        {
          status: "revoked",
          entity: "TENANT",
          reason: tenant.status,
          details: { statusReason: tenant.statusReason },
        },
        { status: 409 }
      );
    }

    if (tenant.sessionVersion !== tenantVersion) {
      return NextResponse.json(
        {
          status: "revoked",
          entity: "TENANT",
          reason: "SESSION_VERSION_MISMATCH",
          details: {
            storedVersion: tenant.sessionVersion,
            providedVersion: tenantVersion,
          },
        },
        { status: 409 }
      );
    }

    // Validar usuário se informado
    if (userId && userVersion !== undefined) {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          active: true,
          sessionVersion: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            status: "revoked",
            entity: "USER",
            reason: "USER_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      if (!user.active) {
        return NextResponse.json(
          {
            status: "revoked",
            entity: "USER",
            reason: "USER_DISABLED",
          },
          { status: 409 }
        );
      }

      if (user.sessionVersion !== userVersion) {
        return NextResponse.json(
          {
            status: "revoked",
            entity: "USER",
            reason: "SESSION_VERSION_MISMATCH",
            details: {
              storedVersion: user.sessionVersion,
              providedVersion: userVersion,
            },
          },
          { status: 409 }
        );
      }
    }

    // Tudo OK
    return NextResponse.json(
      { status: "ok" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao validar sessão:", error);

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
