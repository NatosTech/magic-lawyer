"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export interface ModuloRotaWithModulo {
  id: string;
  moduloId: string;
  rota: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  modulo: {
    id: string;
    nome: string;
    slug: string;
  };
}

// ==================== LISTAR ROTAS ====================

export async function listModuloRotas(params?: { moduloId?: string; search?: string; ativo?: boolean; limit?: number; offset?: number }): Promise<{
  success: boolean;
  data?: {
    rotas: ModuloRotaWithModulo[];
    total: number;
  };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    const { moduloId, search, ativo, limit = 50, offset = 0 } = params || {};

    const where: any = {};

    if (moduloId) {
      where.moduloId = moduloId;
    }

    if (search) {
      where.OR = [{ rota: { contains: search, mode: "insensitive" } }, { descricao: { contains: search, mode: "insensitive" } }, { modulo: { nome: { contains: search, mode: "insensitive" } } }];
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    const [rotas, total] = await Promise.all([
      prisma.moduloRota.findMany({
        where,
        include: {
          modulo: {
            select: {
              id: true,
              nome: true,
              slug: true,
            },
          },
        },
        orderBy: [{ modulo: { nome: "asc" } }, { rota: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.moduloRota.count({ where }),
    ]);

    return {
      success: true,
      data: {
        rotas,
        total,
      },
    };
  } catch (error) {
    logger.error("Erro ao listar rotas de módulos:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== OBTER ROTA ====================

export async function getModuloRota(id: string): Promise<{
  success: boolean;
  data?: ModuloRotaWithModulo;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    const rota = await prisma.moduloRota.findUnique({
      where: { id },
      include: {
        modulo: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    if (!rota) {
      return { success: false, error: "Rota não encontrada" };
    }

    return {
      success: true,
      data: rota,
    };
  } catch (error) {
    logger.error("Erro ao obter rota de módulo:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}
