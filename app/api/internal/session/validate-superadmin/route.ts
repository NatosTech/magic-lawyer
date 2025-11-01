import { NextResponse } from "next/server";

import prisma from "@/app/lib/prisma";

/**
 * Valida se a sessão do SuperAdmin ainda é válida
 * Verifica se o SuperAdmin ainda existe e está ativo
 */
export async function POST(request: Request) {
  try {
    // Verificar token interno
    const expectedToken = process.env.REALTIME_INTERNAL_TOKEN;

    if (!expectedToken || expectedToken.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração ausente: REALTIME_INTERNAL_TOKEN não definido",
        },
        { status: 500 },
      );
    }

    const token = request.headers.get("x-internal-token");

    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { superAdminId } = await request.json();

    if (!superAdminId) {
      return NextResponse.json(
        { success: false, error: "Missing superAdminId" },
        { status: 400 },
      );
    }

    // Validar SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!superAdmin) {
      return NextResponse.json(
        {
          status: "revoked",
          entity: "SUPER_ADMIN",
          reason: "SUPER_ADMIN_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (superAdmin.status !== "ACTIVE") {
      return NextResponse.json(
        {
          status: "revoked",
          entity: "SUPER_ADMIN",
          reason: superAdmin.status,
        },
        { status: 409 },
      );
    }

    // Tudo OK
    return NextResponse.json(
      { status: "ok" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao validar sessão do SuperAdmin:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
