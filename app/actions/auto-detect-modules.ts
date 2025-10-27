"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";
import {
  autoDetectModulesCore,
  DetectedModule,
  scanProtectedModules,
  ScanProtectedModulesResult,
} from "@/lib/module-detection-core";
import { ActionResponse } from "@/types/action-response";

export type AutoDetectResponse = ActionResponse<{
  detectedModules: DetectedModule[];
  created: number;
  updated: number;
  removed: number;
  total: number;
  totalRoutes: number;
}>;

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "SUPER_ADMIN") {
    throw new Error("Não autorizado: Apenas SuperAdmin pode realizar esta ação.");
  }

  return session.user;
}

export async function autoDetectModules(): Promise<AutoDetectResponse> {
  try {
    const user = await checkSuperAdmin();
    logger.info(`Iniciando detecção automática de módulos por ${user.email}`);

    const result = await autoDetectModulesCore();

    logger.info(
      `Detecção automática concluída: ${result.created} criados, ${result.updated} atualizados, ${result.removed} removidos`,
    );

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/planos");

    return {
      success: true,
      data: {
        detectedModules: result.detectedModules,
        created: result.created,
        updated: result.updated,
        removed: result.removed,
        total: result.total,
        totalRoutes: result.totalRoutes,
      },
    };
  } catch (error: any) {
    logger.error("Erro na detecção automática de módulos:", error);

    return {
      success: false,
      error: error.message || "Erro na detecção automática de módulos",
    };
  }
}

export async function getAutoDetectStatus(): Promise<
  ActionResponse<{
    lastDetection: Date | null;
    totalModules: number;
    totalRoutes: number;
    needsSync: boolean;
    filesystemModules: number;
    filesystemRoutes: number;
    lastRunSummary: {
      created: number;
      updated: number;
      removed: number;
    } | null;
  }>
> {
  try {
    await checkSuperAdmin();

    const [totalModules, totalRoutes, latestDetection] = await Promise.all([
      prisma.modulo.count(),
      prisma.moduloRota.count(),
      prisma.moduleDetectionLog.findFirst({
        orderBy: { detectedAt: "desc" },
      }),
    ]);

    let scanResult: ScanProtectedModulesResult;
    let needsSync = false;

    try {
      scanResult = await scanProtectedModules();
      needsSync = !latestDetection || latestDetection.filesystemHash !== scanResult.filesystemHash;
    } catch (error) {
      logger.warn(
        "Erro ao escanear módulos para status:",
        error instanceof Error ? error.message : String(error),
      );
      scanResult = {
        detectedModules: [],
        moduleSlugs: [],
        filesystemHash: "fallback",
        totalRoutes: 0,
      };
      needsSync = false;
    }

    return {
      success: true,
      data: {
        lastDetection: latestDetection?.detectedAt ?? null,
        totalModules,
        totalRoutes,
        needsSync,
        filesystemModules: scanResult.detectedModules.length,
        filesystemRoutes: scanResult.totalRoutes,
        lastRunSummary: latestDetection
          ? {
              created: latestDetection.created,
              updated: latestDetection.updated,
              removed: latestDetection.removed,
            }
          : null,
      },
    };
  } catch (error: any) {
    logger.error("Erro ao obter status da detecção automática:", error);

    return {
      success: false,
      error: error.message || "Erro ao obter status da detecção automática",
    };
  }
}
