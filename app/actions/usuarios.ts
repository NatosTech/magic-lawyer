"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

/**
 * Buscar usuários do tenant para seleção
 */
export async function getUsuariosParaSelect(): Promise<{
  success: boolean;
  usuarios?: any[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        tenantId: user.tenantId,
        active: true, // Apenas usuários ativos
        role: {
          in: ["ADVOGADO", "SECRETARIA", "SUPER_ADMIN", "ADMIN"], // Apenas roles que podem ser responsáveis
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    return {
      success: true,
      usuarios,
    };
  } catch (error) {
    logger.error("Erro ao buscar usuários para seleção:", error);

    return {
      success: false,
      error: "Erro ao buscar usuários",
    };
  }
}
