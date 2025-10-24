"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export interface ModuloCreateInput {
  slug: string;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number | null;
  ativo?: boolean;
}

export interface ModuloUpdateInput {
  nome?: string;
  categoria?: string | null;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number | null;
  ativo?: boolean;
}

export interface ModuloWithStats {
  id: string;
  slug: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  icone: string | null;
  ordem: number | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    planos: number;
    rotas: number;
  };
}

export interface ModuloListResponse {
  success: boolean;
  data?: {
    modulos: ModuloWithStats[];
    total: number;
    categorias: string[];
  };
  error?: string;
}

export interface ModuloDetailResponse {
  success: boolean;
  data?: ModuloWithStats & {
    planos: Array<{
      id: string;
      nome: string;
      slug: string;
      ativo: boolean;
    }>;
    rotas: string[];
  };
  error?: string;
}

// ==================== LISTAR MÓDULOS ====================

export async function listModulos(params?: { search?: string; categoria?: string; ativo?: boolean; limit?: number; offset?: number }): Promise<ModuloListResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    const { search, categoria, ativo, limit = 50, offset = 0 } = params || {};

    const where: Prisma.ModuloWhereInput = {};

    if (search) {
      where.OR = [{ nome: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }, { descricao: { contains: search, mode: "insensitive" } }];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    const [modulos, total, categorias] = await Promise.all([
      prisma.modulo.findMany({
        where,
        include: {
          _count: {
            select: {
              planoModulos: true,
              rotas: true,
            },
          },
        },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.modulo.count({ where }),
      prisma.modulo.findMany({
        select: { categoria: true },
        distinct: ["categoria"],
        where: { categoria: { not: null } },
      }),
    ]);

    return {
      success: true,
      data: {
        modulos,
        total,
        categorias: categorias.map((c) => c.categoria).filter(Boolean),
      },
    };
  } catch (error) {
    logger.error("Erro ao listar módulos:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== OBTER MÓDULO ====================

export async function getModulo(id: string): Promise<ModuloDetailResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    const modulo = await prisma.modulo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            planoModulos: true,
            rotas: true,
          },
        },
        planoModulos: {
          select: {
            plano: {
              select: {
                id: true,
                nome: true,
                slug: true,
                ativo: true,
              },
            },
          },
        },
        rotas: {
          select: {
            rota: true,
          },
        },
      },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    return {
      success: true,
      data: {
        ...modulo,
        planos: modulo.planoModulos.map((pm) => pm.plano),
        rotas: modulo.rotas.map((r) => r.rota),
      },
    };
  } catch (error) {
    logger.error("Erro ao obter módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== CRIAR MÓDULO ====================

export async function createModulo(input: ModuloCreateInput): Promise<{
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

    // Verificar se o slug já existe
    const existingModulo = await prisma.modulo.findUnique({
      where: { slug: input.slug },
    });

    if (existingModulo) {
      return { success: false, error: "Já existe um módulo com este slug" };
    }

    // Se não foi informada a ordem, pegar a próxima
    let ordem = input.ordem;
    if (!ordem) {
      const ultimoModulo = await prisma.modulo.findFirst({
        orderBy: { ordem: "desc" },
        select: { ordem: true },
      });
      ordem = (ultimoModulo?.ordem || 0) + 1;
    }

    const modulo = await prisma.modulo.create({
      data: {
        slug: input.slug,
        nome: input.nome,
        categoria: input.categoria,
        descricao: input.descricao,
        icone: input.icone,
        ordem,
        ativo: input.ativo ?? true,
      },
    });

    logger.info(`Módulo criado: ${modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");

    return { success: true, data: modulo };
  } catch (error) {
    logger.error("Erro ao criar módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== ATUALIZAR MÓDULO ====================

export async function updateModulo(
  id: string,
  input: ModuloUpdateInput
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

    // Verificar se o módulo existe
    const existingModulo = await prisma.modulo.findUnique({
      where: { id },
    });

    if (!existingModulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    const modulo = await prisma.modulo.update({
      where: { id },
      data: {
        nome: input.nome,
        categoria: input.categoria,
        descricao: input.descricao,
        icone: input.icone,
        ordem: input.ordem,
        ativo: input.ativo,
      },
    });

    logger.info(`Módulo atualizado: ${modulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");
    revalidatePath(`/admin/modulos/${id}`);

    return { success: true, data: modulo };
  } catch (error) {
    logger.error("Erro ao atualizar módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== DELETAR MÓDULO ====================

export async function deleteModulo(id: string): Promise<{
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

    // Verificar se o módulo existe
    const existingModulo = await prisma.modulo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            planos: true,
            rotas: true,
          },
        },
      },
    });

    if (!existingModulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    // Verificar se está sendo usado em planos
    if (existingModulo._count.planoModulos > 0) {
      return {
        success: false,
        error: `Não é possível excluir este módulo pois ele está sendo usado por ${existingModulo._count.planoModulos} plano(s)`,
      };
    }

    // Deletar rotas associadas primeiro
    await prisma.moduloRota.deleteMany({
      where: { moduloId: id },
    });

    // Deletar o módulo
    await prisma.modulo.delete({
      where: { id },
    });

    logger.info(`Módulo deletado: ${existingModulo.slug} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== TOGGLE STATUS ====================

export async function toggleModuloStatus(id: string): Promise<{
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

    const modulo = await prisma.modulo.findUnique({
      where: { id },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    const updatedModulo = await prisma.modulo.update({
      where: { id },
      data: { ativo: !modulo.ativo },
    });

    logger.info(`Status do módulo alterado: ${modulo.slug} para ${updatedModulo.ativo ? "ativo" : "inativo"} por usuário ${user.email}`);

    revalidatePath("/admin/modulos");

    return { success: true, data: updatedModulo };
  } catch (error) {
    logger.error("Erro ao alterar status do módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== DASHBOARD ====================

export async function getDashboardModulos(): Promise<{
  success: boolean;
  data?: {
    total: number;
    ativos: number;
    inativos: number;
    categorias: number;
    maisUsados: Array<{
      id: string;
      nome: string;
      slug: string;
      count: number;
    }>;
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

    const [total, ativos, inativos, categorias, maisUsados] = await Promise.all([
      prisma.modulo.count(),
      prisma.modulo.count({ where: { ativo: true } }),
      prisma.modulo.count({ where: { ativo: false } }),
      prisma.modulo
        .groupBy({
          by: ["categoria"],
          _count: { id: true },
          where: { categoria: { not: null } },
        })
        .then((result) => result.length),
      prisma.modulo.findMany({
        select: {
          id: true,
          nome: true,
          slug: true,
          _count: {
            select: {
              planoModulos: true,
            },
          },
        },
        orderBy: {
          planoModulos: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        ativos,
        inativos,
        categorias,
        maisUsados: maisUsados.map((m) => ({
          id: m.id,
          nome: m.nome,
          slug: m.slug,
          count: m._count.planoModulos,
        })),
      },
    };
  } catch (error) {
    logger.error("Erro ao obter dashboard de módulos:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}
