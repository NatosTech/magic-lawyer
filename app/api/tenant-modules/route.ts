import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getTenantAccessibleModules } from "@/app/lib/tenant-modules";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const tenantId = (session.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 400 },
      );
    }

    const [modules, tenant] = await Promise.all([
      getTenantAccessibleModules(tenantId),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { planRevision: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        modules,
        planRevision: tenant?.planRevision ?? null,
      },
    });
  } catch (error) {
    logger.error("Erro ao buscar módulos do tenant", error);

    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}
