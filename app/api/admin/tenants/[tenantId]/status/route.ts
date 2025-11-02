import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        status: true,
        statusReason: true,
        statusChangedAt: true,
        sessionVersion: true,
        planRevision: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        status: tenant.status,
        statusReason: tenant.statusReason,
        statusChangedAt: tenant.statusChangedAt?.toISOString() ?? null,
        sessionVersion: tenant.sessionVersion,
        planRevision: tenant.planRevision,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar status do tenant:", error);

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
