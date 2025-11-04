import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { autoDetectModulesCore } from "@/lib/module-detection-core";
import { clearModuleMapCache } from "@/app/lib/module-map";
import { clearModuleMapCacheEdge } from "@/app/lib/module-map-edge";

export async function POST(request: Request) {
  const expectedToken =
    process.env.MODULE_DETECT_INTERNAL_TOKEN ||
    process.env.REALTIME_INTERNAL_TOKEN ||
    "";

  if (!expectedToken) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Configuração ausente: defina MODULE_DETECT_INTERNAL_TOKEN ou REALTIME_INTERNAL_TOKEN",
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

  try {
    const result = await autoDetectModulesCore();

    // Limpar caches em memória
    clearModuleMapCache();
    clearModuleMapCacheEdge();

    // Revalidar páginas afetadas
    revalidatePath("/admin/modulos");
    revalidatePath("/admin/planos");

    return NextResponse.json({
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        removed: result.removed,
        total: result.total,
        totalRoutes: result.totalRoutes,
      },
    });
  } catch (error) {
    console.error("[module-detect] Erro na detecção automática:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao executar detecção automática de módulos",
      },
      { status: 500 },
    );
  }
}
