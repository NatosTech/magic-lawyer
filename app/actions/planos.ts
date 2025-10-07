"use server";

import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

// ==================== TIPOS ====================

export type Plano = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  valorMensal?: number;
  valorAnual?: number;
  moeda: string;
  limiteUsuarios?: number;
  limiteProcessos?: number;
  limiteStorageMb?: number;
  recursos?: any;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantSubscription = {
  id: string;
  tenantId: string;
  planoId?: string;
  status: string;
  dataInicio: Date;
  dataFim?: Date;
  renovaEm?: Date;
  trialEndsAt?: Date;
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
};

export type GetPlanosResponse = {
  success: boolean;
  data?: Plano[];
  error?: string;
};

export type GetPlanoResponse = {
  success: boolean;
  data?: Plano;
  error?: string;
};

export type GetEstatisticasPlanosResponse = {
  success: boolean;
  data?: {
    totalPlanos: number;
    planosAtivos: number;
    totalAssinaturas: number;
    assinaturasAtivas: number;
    faturamentoMensal: number;
  };
  error?: string;
};

// ==================== FUNÇÕES AUXILIARES ====================

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN") {
    throw new Error("Acesso negado. Apenas Super Admins podem gerenciar planos.");
  }

  return session.user.id;
}

// ==================== CRUD PLANOS ====================

export async function getPlanos(): Promise<GetPlanosResponse> {
  try {
    await ensureSuperAdmin();

    const planos = await prisma.plano.findMany({
      orderBy: [{ valorMensal: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: planos.map((plano) => ({
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getPlanoById(id: string): Promise<GetPlanoResponse> {
  try {
    await ensureSuperAdmin();

    const plano = await prisma.plano.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!plano) {
      return {
        success: false,
        error: "Plano não encontrado",
      };
    }

    return {
      success: true,
      data: {
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function updatePlano(id: string, data: Partial<Plano>): Promise<GetPlanoResponse> {
  try {
    await ensureSuperAdmin();

    // Verificar se o plano existe
    const planoExistente = await prisma.plano.findUnique({
      where: { id },
    });

    if (!planoExistente) {
      return {
        success: false,
        error: "Plano não encontrado",
      };
    }

    const plano = await prisma.plano.update({
      where: { id },
      data: {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao,
        valorMensal: data.valorMensal,
        valorAnual: data.valorAnual,
        limiteUsuarios: data.limiteUsuarios,
        limiteProcessos: data.limiteProcessos,
        limiteStorageMb: data.limiteStorageMb,
        recursos: data.recursos,
        ativo: data.ativo,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      },
    };
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE ANÁLISE ====================

export async function getEstatisticasPlanos(): Promise<GetEstatisticasPlanosResponse> {
  try {
    await ensureSuperAdmin();

    const [totalPlanos, planosAtivos, totalAssinaturas, assinaturasAtivas, faturamentoMensal] = await Promise.all([
      prisma.plano.count(),
      prisma.plano.count({ where: { ativo: true } }),
      prisma.tenantSubscription.count(),
      prisma.tenantSubscription.count({
        where: {
          status: "ACTIVE",
          planoId: { not: null },
        },
      }),
      prisma.fatura.aggregate({
        where: {
          status: "PAGO",
          pagoEm: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          valor: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPlanos,
        planosAtivos,
        totalAssinaturas,
        assinaturasAtivas,
        faturamentoMensal: Number(faturamentoMensal._sum.valor || 0),
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de planos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE ASSINATURAS ====================

export async function getAssinaturas() {
  try {
    await ensureSuperAdmin();

    const assinaturas = await prisma.tenantSubscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        plano: {
          select: {
            id: true,
            nome: true,
            valorMensal: true,
            valorAnual: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: assinaturas.map((assinatura) => ({
        ...assinatura,
        plano: assinatura.plano
          ? {
              ...assinatura.plano,
              valorMensal: assinatura.plano.valorMensal ? Number(assinatura.plano.valorMensal) : undefined,
              valorAnual: assinatura.plano.valorAnual ? Number(assinatura.plano.valorAnual) : undefined,
            }
          : null,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
