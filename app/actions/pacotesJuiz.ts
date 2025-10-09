"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export type PacoteJuiz = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  moeda: string;
  duracaoDias?: number | null;
  limiteUsuarios?: number | null;
  limiteConsultas?: number | null;
  isPublico: boolean;
  status: "ATIVO" | "INATIVO" | "PROMOCIONAL";
  ordemExibicao: number;
  cor: string;
  icone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    juizes: number;
    assinaturas: number;
  };
};

export type PacoteJuizItem = {
  id: string;
  pacoteId: string;
  juizId: string;
  ordemExibicao: number;
  createdAt: Date;
  juiz?: {
    id: string;
    nome: string;
    nomeCompleto?: string | null;
    comarca?: string | null;
    vara?: string | null;
    especialidades: string[];
  };
};

export type AssinaturaPacoteJuiz = {
  id: string;
  tenantId: string;
  pacoteId: string;
  status: string;
  dataInicio: Date;
  dataFim?: Date | null;
  renovacaoAutomatica: boolean;
  precoPago: number;
  formaPagamento?: string | null;
  observacoes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GetPacotesJuizResponse = {
  success: boolean;
  data?: PacoteJuiz[];
  error?: string;
};

export type GetPacoteJuizResponse = {
  success: boolean;
  data?: PacoteJuiz & {
    juizes: PacoteJuizItem[];
    assinaturas: AssinaturaPacoteJuiz[];
  };
  error?: string;
};

export type CreatePacoteJuizResponse = {
  success: boolean;
  data?: PacoteJuiz;
  error?: string;
};

export type UpdatePacoteJuizResponse = {
  success: boolean;
  data?: PacoteJuiz;
  error?: string;
};

export type DeletePacoteJuizResponse = {
  success: boolean;
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
    throw new Error(
      "Acesso negado. Apenas Super Admins podem gerenciar pacotes de juízes.",
    );
  }

  return session.user.id;
}

// ==================== CRUD PACOTES DE JUÍZES ====================

export async function getPacotesJuiz(): Promise<GetPacotesJuizResponse> {
  try {
    await ensureSuperAdmin();

    const pacotes = await prisma.pacoteJuiz.findMany({
      include: {
        _count: {
          select: {
            juizes: true,
            assinaturas: true,
          },
        },
      },
      orderBy: [{ ordemExibicao: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: pacotes.map((pacote) => ({
        ...pacote,
        preco: Number(pacote.preco),
      })),
    };
  } catch (error) {
    logger.error("Erro ao buscar pacotes de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getPacoteJuizById(
  id: string,
): Promise<GetPacoteJuizResponse> {
  try {
    await ensureSuperAdmin();

    const pacote = await prisma.pacoteJuiz.findUnique({
      where: { id },
      include: {
        juizes: {
          include: {
            juiz: {
              select: {
                id: true,
                nome: true,
                nomeCompleto: true,
                comarca: true,
                vara: true,
                especialidades: true,
              },
            },
          },
          orderBy: {
            ordemExibicao: "asc",
          },
        },
        assinaturas: {
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

    if (!pacote) {
      return {
        success: false,
        error: "Pacote de juízes não encontrado",
      };
    }

    return {
      success: true,
      data: {
        ...pacote,
        preco: Number(pacote.preco),
        juizes: pacote.juizes,
        assinaturas: pacote.assinaturas.map((assinatura) => ({
          ...assinatura,
          precoPago: Number(assinatura.precoPago),
        })),
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar pacote de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function createPacoteJuiz(
  data: Partial<PacoteJuiz>,
): Promise<CreatePacoteJuizResponse> {
  try {
    const superAdminId = await ensureSuperAdmin();

    // Validar dados obrigatórios
    if (!data.nome || !data.preco) {
      return {
        success: false,
        error: "Nome e preço são obrigatórios",
      };
    }

    const pacote = await prisma.pacoteJuiz.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco,
        moeda: data.moeda || "BRL",
        duracaoDias: data.duracaoDias,
        limiteUsuarios: data.limiteUsuarios,
        limiteConsultas: data.limiteConsultas,
        isPublico: data.isPublico ?? true,
        status: data.status || "ATIVO",
        ordemExibicao: data.ordemExibicao || 0,
        cor: data.cor || "primary",
        icone: data.icone,
        superAdminId,
      },
    });

    return {
      success: true,
      data: {
        ...pacote,
        preco: Number(pacote.preco),
      },
    };
  } catch (error) {
    logger.error("Erro ao criar pacote de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function updatePacoteJuiz(
  id: string,
  data: Partial<PacoteJuiz>,
): Promise<UpdatePacoteJuizResponse> {
  try {
    await ensureSuperAdmin();

    // Verificar se o pacote existe
    const pacoteExistente = await prisma.pacoteJuiz.findUnique({
      where: { id },
    });

    if (!pacoteExistente) {
      return {
        success: false,
        error: "Pacote de juízes não encontrado",
      };
    }

    const pacote = await prisma.pacoteJuiz.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco,
        moeda: data.moeda,
        duracaoDias: data.duracaoDias,
        limiteUsuarios: data.limiteUsuarios,
        limiteConsultas: data.limiteConsultas,
        isPublico: data.isPublico,
        status: data.status,
        ordemExibicao: data.ordemExibicao,
        cor: data.cor,
        icone: data.icone,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        ...pacote,
        preco: Number(pacote.preco),
      },
    };
  } catch (error) {
    logger.error("Erro ao atualizar pacote de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function deletePacoteJuiz(
  id: string,
): Promise<DeletePacoteJuizResponse> {
  try {
    await ensureSuperAdmin();

    // Verificar se o pacote existe
    const pacoteExistente = await prisma.pacoteJuiz.findUnique({
      where: { id },
      include: {
        assinaturas: true,
      },
    });

    if (!pacoteExistente) {
      return {
        success: false,
        error: "Pacote de juízes não encontrado",
      };
    }

    // Verificar se há assinaturas ativas
    const assinaturasAtivas = pacoteExistente.assinaturas.filter(
      (assinatura) => assinatura.status === "ATIVA",
    );

    if (assinaturasAtivas.length > 0) {
      return {
        success: false,
        error: `Não é possível deletar o pacote. Existem ${assinaturasAtivas.length} assinatura(s) ativa(s).`,
      };
    }

    await prisma.pacoteJuiz.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao deletar pacote de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== GERENCIAMENTO DE JUÍZES NO PACOTE ====================

export async function adicionarJuizAoPacote(
  pacoteId: string,
  juizId: string,
  ordemExibicao?: number,
) {
  try {
    await ensureSuperAdmin();

    const item = await prisma.pacoteJuizItem.create({
      data: {
        pacoteId,
        juizId,
        ordemExibicao: ordemExibicao || 0,
      },
    });

    return {
      success: true,
      data: item,
    };
  } catch (error) {
    logger.error("Erro ao adicionar juiz ao pacote:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function removerJuizDoPacote(pacoteId: string, juizId: string) {
  try {
    await ensureSuperAdmin();

    await prisma.pacoteJuizItem.delete({
      where: {
        pacoteId_juizId: {
          pacoteId,
          juizId,
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao remover juiz do pacote:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE ANÁLISE ====================

export async function getEstatisticasPacotesJuiz() {
  try {
    await ensureSuperAdmin();

    const [
      totalPacotes,
      pacotesAtivos,
      totalAssinaturas,
      assinaturasAtivas,
      faturamentoMensal,
    ] = await Promise.all([
      prisma.pacoteJuiz.count(),
      prisma.pacoteJuiz.count({ where: { status: "ATIVO" } }),
      prisma.assinaturaPacoteJuiz.count(),
      prisma.assinaturaPacoteJuiz.count({ where: { status: "ATIVA" } }),
      prisma.assinaturaPacoteJuiz.aggregate({
        where: {
          status: "ATIVA",
          dataInicio: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          precoPago: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPacotes,
        pacotesAtivos,
        totalAssinaturas,
        assinaturasAtivas,
        faturamentoMensal: Number(faturamentoMensal._sum.precoPago || 0),
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar estatísticas de pacotes de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
