"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export interface ModuloWithStats {
  id: string;
  slug: string;
  nome: string;
  categoria: string | null;
  categoriaId: string | null;
  categoriaInfo: {
    id: string;
    nome: string;
    slug: string;
    cor: string | null;
    icone: string | null;
  } | null;
  descricao: string | null;
  icone: string | null;
  ordem: number | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  rotas: Array<{
    id: string;
    rota: string;
    descricao: string | null;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
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
    categorias: Array<{
      id: string;
      nome: string;
      slug: string;
      cor: string | null;
      icone: string | null;
      ativo: boolean;
    }>;
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
    rotas: Array<{
      id: string;
      rota: string;
      descricao: string | null;
      ativo: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
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
      where.categoriaId = categoria;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    const [rawModulos, total, categorias] = await Promise.all([
      prisma.modulo.findMany({
        where,
        include: {
          categoria: {
            select: {
              id: true,
              nome: true,
              slug: true,
              cor: true,
              icone: true,
            },
          },
          rotas: {
            select: {
              id: true,
              rota: true,
              descricao: true,
              ativo: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { rota: "asc" },
          },
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
      prisma.moduloCategoria.findMany({
        select: {
          id: true,
          nome: true,
          slug: true,
          cor: true,
          icone: true,
          ativo: true,
        },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
    ]);

    const modulos: ModuloWithStats[] = rawModulos.map((modulo) => ({
      id: modulo.id,
      slug: modulo.slug,
      nome: modulo.nome,
      descricao: modulo.descricao,
      categoria: modulo.categoria,
      categoriaId: modulo.categoriaId,
      categoriaInfo: modulo.categoria
        ? {
            id: modulo.categoria.id,
            nome: modulo.categoria.nome,
            slug: modulo.categoria.slug,
            cor: modulo.categoria.cor,
            icone: modulo.categoria.icone,
          }
        : null,
      icone: modulo.icone,
      ordem: modulo.ordem,
      ativo: modulo.ativo,
      createdAt: modulo.createdAt,
      updatedAt: modulo.updatedAt,
      rotas: modulo.rotas.map((rota) => ({
        id: rota.id,
        rota: rota.rota,
        descricao: rota.descricao,
        ativo: rota.ativo,
        createdAt: rota.createdAt,
        updatedAt: rota.updatedAt,
      })),
      _count: {
        planos: modulo._count.planoModulos,
        rotas: modulo._count.rotas,
      },
    }));

    return {
      success: true,
      data: {
        modulos,
        total,
        categorias,
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
            id: true,
            rota: true,
            descricao: true,
            ativo: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { rota: "asc" },
        },
      },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    return {
      success: true,
      data: {
        id: modulo.id,
        slug: modulo.slug,
        nome: modulo.nome,
        descricao: modulo.descricao,
        categoria: modulo.categoria,
        icone: modulo.icone,
        ordem: modulo.ordem,
        ativo: modulo.ativo,
        createdAt: modulo.createdAt,
        updatedAt: modulo.updatedAt,
        planos: modulo.planoModulos.map((pm) => pm.plano),
        rotas: modulo.rotas.map((rota) => ({
          id: rota.id,
          rota: rota.rota,
          descricao: rota.descricao,
          ativo: rota.ativo,
          createdAt: rota.createdAt,
          updatedAt: rota.updatedAt,
        })),
        _count: {
          planos: modulo._count.planoModulos,
          rotas: modulo._count.rotas,
        },
      },
    };
  } catch (error) {
    logger.error("Erro ao obter módulo:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== ATUALIZAR CATEGORIA ====================

export async function updateModuloCategoria(moduloId: string, categoriaId: string | null): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Verificar se o usuário é super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado" };
    }

    // Verificar se o módulo existe
    const modulo = await prisma.modulo.findUnique({
      where: { id: moduloId },
    });

    if (!modulo) {
      return { success: false, error: "Módulo não encontrado" };
    }

    // Se categoriaId for fornecido, verificar se a categoria existe
    if (categoriaId) {
      const categoria = await prisma.moduloCategoria.findUnique({
        where: { id: categoriaId },
      });

      if (!categoria) {
        return { success: false, error: "Categoria não encontrada" };
      }
    }

    // Atualizar a categoria do módulo
    await prisma.modulo.update({
      where: { id: moduloId },
      data: { categoriaId },
    });

    logger.info(`Categoria do módulo ${modulo.slug} atualizada para ${categoriaId || "sem categoria"}`);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error: any) {
    logger.error("Erro ao atualizar categoria do módulo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

// ==================== CRIAR MÓDULO ====================

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
      prisma.moduloCategoria.count(),
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
