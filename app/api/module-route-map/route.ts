import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getModuleRouteMap } from "@/app/lib/module-map";
import logger from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const moduleMap = await getModuleRouteMap();

    return NextResponse.json({
      success: true,
      data: moduleMap,
    });
  } catch (error) {
    logger.error("Erro ao obter module route map público", error);

    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}
