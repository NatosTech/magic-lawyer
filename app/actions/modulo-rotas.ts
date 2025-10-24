"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export interface ModuloRotaCreateInput {
  moduloId: string;
  rota: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface ModuloRotaUpdateInput {
  rota?: string;
  descricao?: string | null;
  ativo?: boolean;
}

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

    const where: Prisma.ModuloRotaWhereInput = {};

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

// ==================== CRIAR ROTA ====================

export async function createModuloRota(input: ModuloRotaCreateInput): Promise<{
  success: boolean;
  data?: any;
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

    // Verificar se o módulo existe
    const modulo = await prisma.modulo.findUnique({
      where: { id: input.moduloId },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    // Verificar se já existe uma rota com o mesmo path para o mesmo módulo
    const existingRota = await prisma.moduloRota.findFirst({
      where: {
        moduloId: input.moduloId,
        rota: input.rota,
      },
    });

    if (existingRota) {
      return { success: false, error: "Já existe uma rota com este path para este módulo" };
    }

    const rota = await prisma.moduloRota.create({
      data: {
        moduloId: input.moduloId,
        rota: input.rota,
        descricao: input.descricao,
        ativo: input.ativo ?? true,
      },
    });

    logger.info(`Rota de módulo criada: ${rota.rota} para módulo ${modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/modulo-rotas");

    return { success: true, data: rota };
  } catch (error) {
    logger.error("Erro ao criar rota de módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== ATUALIZAR ROTA ====================

export async function updateModuloRota(
  id: string,
  input: ModuloRotaUpdateInput
): Promise<{
  success: boolean;
  data?: any;
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

    // Verificar se a rota existe
    const existingRota = await prisma.moduloRota.findUnique({
      where: { id },
      include: {
        modulo: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!existingRota) {
      return { success: false, error: "Rota não encontrada" };
    }

    // Se está alterando a rota, verificar se não conflita
    if (input.rota && input.rota !== existingRota.rota) {
      const conflictingRota = await prisma.moduloRota.findFirst({
        where: {
          moduloId: existingRota.moduloId,
          rota: input.rota,
          id: { not: id },
        },
      });

      if (conflictingRota) {
        return { success: false, error: "Já existe uma rota com este path para este módulo" };
      }
    }

    const rota = await prisma.moduloRota.update({
      where: { id },
      data: {
        rota: input.rota,
        descricao: input.descricao,
        ativo: input.ativo,
      },
    });

    logger.info(`Rota de módulo atualizada: ${rota.rota} para módulo ${existingRota.modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/modulo-rotas");

    return { success: true, data: rota };
  } catch (error) {
    logger.error("Erro ao atualizar rota de módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== DELETAR ROTA ====================

export async function deleteModuloRota(id: string): Promise<{
  success: boolean;
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

    // Verificar se a rota existe
    const existingRota = await prisma.moduloRota.findUnique({
      where: { id },
      include: {
        modulo: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!existingRota) {
      return { success: false, error: "Rota não encontrada" };
    }

    // Deletar a rota
    await prisma.moduloRota.delete({
      where: { id },
    });

    logger.info(`Rota de módulo deletada: ${existingRota.rota} do módulo ${existingRota.modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/modulo-rotas");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar rota de módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== TOGGLE STATUS ====================

export async function toggleModuloRotaStatus(id: string): Promise<{
  success: boolean;
  data?: any;
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
    });

    if (!rota) {
      return { success: false, error: "Rota não encontrada" };
    }

    const updatedRota = await prisma.moduloRota.update({
      where: { id },
      data: { ativo: !rota.ativo },
    });

    logger.info(`Status da rota alterado: ${rota.rota} para ${updatedRota.ativo ? "ativa" : "inativa"} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/modulo-rotas");

    return { success: true, data: updatedRota };
  } catch (error) {
    logger.error("Erro ao alterar status da rota:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== BULK OPERATIONS ====================

export async function createBulkModuloRotas(
  moduloId: string,
  rotas: string[]
): Promise<{
  success: boolean;
  data?: any[];
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

    // Verificar se o módulo existe
    const modulo = await prisma.modulo.findUnique({
      where: { id: moduloId },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    // Filtrar rotas que já existem
    const existingRotas = await prisma.moduloRota.findMany({
      where: {
        moduloId,
        rota: { in: rotas },
      },
      select: { rota: true },
    });

    const existingRotasSet = new Set(existingRotas.map((r) => r.rota));
    const newRotas = rotas.filter((rota) => !existingRotasSet.has(rota));

    if (newRotas.length === 0) {
      return { success: false, error: "Todas as rotas já existem para este módulo" };
    }

    // Criar as novas rotas
    const createdRotas = await prisma.moduloRota.createMany({
      data: newRotas.map((rota) => ({
        moduloId,
        rota,
        ativo: true,
      })),
    });

    logger.info(`${createdRotas.count} rotas criadas para módulo ${modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/modulo-rotas");

    return { success: true, data: newRotas };
  } catch (error) {
    logger.error("Erro ao criar rotas em lote:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}
