import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getTenantAccessibleModules } from "@/app/lib/tenant-modules";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const tenantId = (session.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant não encontrado" }, { status: 400 });
    }

    const modules = await getTenantAccessibleModules(tenantId);

    return NextResponse.json({ success: true, data: modules });
  } catch (error) {
    logger.error("Erro ao buscar módulos do tenant", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
