"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, PeticaoStatus } from "@/app/generated/prisma";

// ============================================
// TIPOS
// ============================================

export interface PeticaoFilters {
  status?: PeticaoStatus;
  processoId?: string;
  causaId?: string;
  tipo?: string;
  search?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface PeticaoCreateInput {
  processoId: string;
  causaId?: string;
  titulo: string;
  tipo?: string;
  status?: PeticaoStatus;
  descricao?: string;
  documentoId?: string;
  protocoloNumero?: string;
  protocoladoEm?: Date;
  observacoes?: string;
}

export interface PeticaoUpdateInput {
  processoId?: string;
  causaId?: string;
  titulo?: string;
  tipo?: string;
  status?: PeticaoStatus;
  descricao?: string;
  documentoId?: string;
  protocoloNumero?: string;
  protocoladoEm?: Date;
  observacoes?: string;
}

// ============================================
// VALIDAÇÃO DE TENANT
// ============================================

async function getTenantId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou tenant não encontrado");
  }
  return session.user.tenantId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }
  return session.user.id;
}

// ============================================
// LISTAGEM
// ============================================

export async function listPeticoes(filters?: PeticaoFilters) {
  try {
    const tenantId = await getTenantId();

    const where: Prisma.PeticaoWhereInput = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.processoId && { processoId: filters.processoId }),
      ...(filters?.causaId && { causaId: filters.causaId }),
      ...(filters?.tipo && { tipo: filters.tipo }),
      ...(filters?.search && {
        OR: [
          { titulo: { contains: filters.search, mode: "insensitive" } },
          { descricao: { contains: filters.search, mode: "insensitive" } },
          { protocoloNumero: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
      ...(filters?.dataInicio &&
        filters?.dataFim && {
          createdAt: {
            gte: filters.dataInicio,
            lte: filters.dataFim,
          },
        }),
    };

    const peticoes = await prisma.peticao.findMany({
      where,
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            status: true,
          },
        },
        causa: {
          select: {
            id: true,
            nome: true,
          },
        },
        documento: {
          select: {
            id: true,
            nome: true,
            url: true,
            contentType: true,
            tamanhoBytes: true,
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: peticoes,
    };
  } catch (error) {
    console.error("Erro ao listar petições:", error);
    return {
      success: false,
      error: "Erro ao listar petições",
    };
  }
}

// ============================================
// BUSCAR PETIÇÃO INDIVIDUAL
// ============================================

export async function getPeticao(id: string) {
  try {
    const tenantId = await getTenantId();

    const peticao = await prisma.peticao.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            numeroCnj: true,
            titulo: true,
            status: true,
            cliente: {
              select: {
                id: true,
                nome: true,
                tipoPessoa: true,
              },
            },
          },
        },
        causa: {
          select: {
            id: true,
            nome: true,
            codigoCnj: true,
          },
        },
        documento: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            url: true,
            contentType: true,
            tamanhoBytes: true,
            createdAt: true,
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        diligencias: {
          select: {
            id: true,
            titulo: true,
            status: true,
            prazoPrevisto: true,
          },
        },
      },
    });

    if (!peticao) {
      return {
        success: false,
        error: "Petição não encontrada",
      };
    }

    return {
      success: true,
      data: peticao,
    };
  } catch (error) {
    console.error("Erro ao buscar petição:", error);
    return {
      success: false,
      error: "Erro ao buscar petição",
    };
  }
}

// ============================================
// CRIAR PETIÇÃO
// ============================================

export async function createPeticao(input: PeticaoCreateInput) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    // Validar se o processo existe e pertence ao tenant
    const processo = await prisma.processo.findFirst({
      where: {
        id: input.processoId,
        tenantId,
      },
    });

    if (!processo) {
      return {
        success: false,
        error: "Processo não encontrado",
      };
    }

    // Validar causa se fornecida
    if (input.causaId) {
      const causa = await prisma.causa.findFirst({
        where: {
          id: input.causaId,
          tenantId,
        },
      });

      if (!causa) {
        return {
          success: false,
          error: "Causa não encontrada",
        };
      }
    }

    // Validar documento se fornecido
    if (input.documentoId) {
      const documento = await prisma.documento.findFirst({
        where: {
          id: input.documentoId,
          tenantId,
        },
      });

      if (!documento) {
        return {
          success: false,
          error: "Documento não encontrado",
        };
      }
    }

    const peticao = await prisma.peticao.create({
      data: {
        tenantId,
        processoId: input.processoId,
        causaId: input.causaId,
        titulo: input.titulo,
        tipo: input.tipo,
        status: input.status || PeticaoStatus.RASCUNHO,
        descricao: input.descricao,
        documentoId: input.documentoId,
        protocoloNumero: input.protocoloNumero,
        protocoladoEm: input.protocoladoEm,
        observacoes: input.observacoes,
        criadoPorId: userId,
      },
      include: {
        processo: {
          select: {
            numero: true,
            titulo: true,
          },
        },
        causa: {
          select: {
            nome: true,
          },
        },
      },
    });

    revalidatePath("/peticoes");
    revalidatePath(`/processos/${input.processoId}`);

    return {
      success: true,
      data: peticao,
      message: "Petição criada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar petição:", error);
    return {
      success: false,
      error: "Erro ao criar petição",
    };
  }
}

// ============================================
// ATUALIZAR PETIÇÃO
// ============================================

export async function updatePeticao(id: string, input: PeticaoUpdateInput) {
  try {
    const tenantId = await getTenantId();

    // Verificar se a petição existe
    const peticaoExistente = await prisma.peticao.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!peticaoExistente) {
      return {
        success: false,
        error: "Petição não encontrada",
      };
    }

    // Validar processo se alterado
    if (input.processoId && input.processoId !== peticaoExistente.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: input.processoId,
          tenantId,
        },
      });

      if (!processo) {
        return {
          success: false,
          error: "Processo não encontrado",
        };
      }
    }

    // Validar causa se fornecida
    if (input.causaId) {
      const causa = await prisma.causa.findFirst({
        where: {
          id: input.causaId,
          tenantId,
        },
      });

      if (!causa) {
        return {
          success: false,
          error: "Causa não encontrada",
        };
      }
    }

    // Validar documento se fornecido
    if (input.documentoId) {
      const documento = await prisma.documento.findFirst({
        where: {
          id: input.documentoId,
          tenantId,
        },
      });

      if (!documento) {
        return {
          success: false,
          error: "Documento não encontrado",
        };
      }
    }

    const peticao = await prisma.peticao.update({
      where: { id },
      data: {
        ...(input.processoId && { processoId: input.processoId }),
        ...(input.causaId !== undefined && { causaId: input.causaId }),
        ...(input.titulo && { titulo: input.titulo }),
        ...(input.tipo !== undefined && { tipo: input.tipo }),
        ...(input.status && { status: input.status }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.documentoId !== undefined && { documentoId: input.documentoId }),
        ...(input.protocoloNumero !== undefined && { protocoloNumero: input.protocoloNumero }),
        ...(input.protocoladoEm !== undefined && { protocoladoEm: input.protocoladoEm }),
        ...(input.observacoes !== undefined && { observacoes: input.observacoes }),
      },
      include: {
        processo: {
          select: {
            numero: true,
            titulo: true,
          },
        },
        causa: {
          select: {
            nome: true,
          },
        },
      },
    });

    revalidatePath("/peticoes");
    revalidatePath(`/processos/${peticao.processoId}`);

    return {
      success: true,
      data: peticao,
      message: "Petição atualizada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar petição:", error);
    return {
      success: false,
      error: "Erro ao atualizar petição",
    };
  }
}

// ============================================
// DELETAR PETIÇÃO
// ============================================

export async function deletePeticao(id: string) {
  try {
    const tenantId = await getTenantId();

    // Verificar se a petição existe
    const peticao = await prisma.peticao.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        diligencias: true,
      },
    });

    if (!peticao) {
      return {
        success: false,
        error: "Petição não encontrada",
      };
    }

    // Verificar se há diligências vinculadas
    if (peticao.diligencias.length > 0) {
      return {
        success: false,
        error: `Não é possível excluir esta petição pois existem ${peticao.diligencias.length} diligência(s) vinculada(s)`,
      };
    }

    await prisma.peticao.delete({
      where: { id },
    });

    revalidatePath("/peticoes");
    revalidatePath(`/processos/${peticao.processoId}`);

    return {
      success: true,
      message: "Petição excluída com sucesso",
    };
  } catch (error) {
    console.error("Erro ao excluir petição:", error);
    return {
      success: false,
      error: "Erro ao excluir petição",
    };
  }
}

// ============================================
// PROTOCOLAR PETIÇÃO
// ============================================

export async function protocolarPeticao(id: string, protocoloNumero: string, protocoladoEm?: Date) {
  try {
    const tenantId = await getTenantId();

    // Verificar se a petição existe
    const peticao = await prisma.peticao.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!peticao) {
      return {
        success: false,
        error: "Petição não encontrada",
      };
    }

    // Verificar se já foi protocolada
    if (peticao.status === PeticaoStatus.PROTOCOLADA) {
      return {
        success: false,
        error: "Petição já foi protocolada",
      };
    }

    const peticaoAtualizada = await prisma.peticao.update({
      where: { id },
      data: {
        status: PeticaoStatus.PROTOCOLADA,
        protocoloNumero,
        protocoladoEm: protocoladoEm || new Date(),
      },
    });

    revalidatePath("/peticoes");
    revalidatePath(`/processos/${peticao.processoId}`);

    return {
      success: true,
      data: peticaoAtualizada,
      message: "Petição protocolada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao protocolar petição:", error);
    return {
      success: false,
      error: "Erro ao protocolar petição",
    };
  }
}

// ============================================
// DASHBOARD DE PETIÇÕES
// ============================================

export async function getDashboardPeticoes() {
  try {
    const tenantId = await getTenantId();

    // Total de petições
    const total = await prisma.peticao.count({
      where: { tenantId },
    });

    // Por status
    const porStatus = await prisma.peticao.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    });

    // Petições recentes (últimos 30 dias)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const recentes = await prisma.peticao.count({
      where: {
        tenantId,
        createdAt: {
          gte: trintaDiasAtras,
        },
      },
    });

    // Petições protocoladas (últimos 30 dias)
    const protocoladasRecentes = await prisma.peticao.count({
      where: {
        tenantId,
        status: PeticaoStatus.PROTOCOLADA,
        protocoladoEm: {
          gte: trintaDiasAtras,
        },
      },
    });

    // Petições em análise
    const emAnalise = await prisma.peticao.count({
      where: {
        tenantId,
        status: PeticaoStatus.EM_ANALISE,
      },
    });

    // Petições rascunho
    const rascunhos = await prisma.peticao.count({
      where: {
        tenantId,
        status: PeticaoStatus.RASCUNHO,
      },
    });

    // Top 5 processos com mais petições
    const processosMaisPeticoes = await prisma.peticao.groupBy({
      by: ["processoId"],
      where: { tenantId },
      _count: true,
      orderBy: {
        _count: {
          processoId: "desc",
        },
      },
      take: 5,
    });

    // Buscar detalhes dos processos
    const processosDetalhes = await prisma.processo.findMany({
      where: {
        id: {
          in: processosMaisPeticoes.map((p) => p.processoId),
        },
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
      },
    });

    const topProcessos = processosMaisPeticoes.map((item) => {
      const processo = processosDetalhes.find((p) => p.id === item.processoId);
      return {
        processoId: item.processoId,
        numero: processo?.numero || "N/A",
        titulo: processo?.titulo || "Sem título",
        quantidade: item._count,
      };
    });

    return {
      success: true,
      data: {
        total,
        recentes,
        protocoladasRecentes,
        emAnalise,
        rascunhos,
        porStatus: porStatus.map((item) => ({
          status: item.status,
          quantidade: item._count,
        })),
        topProcessos,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do dashboard",
    };
  }
}

// ============================================
// LISTAR TIPOS DE PETIÇÃO (para autocomplete)
// ============================================

export async function listTiposPeticao() {
  try {
    const tenantId = await getTenantId();

    const tipos = await prisma.peticao.findMany({
      where: {
        tenantId,
        tipo: {
          not: null,
        },
      },
      select: {
        tipo: true,
      },
      distinct: ["tipo"],
      orderBy: {
        tipo: "asc",
      },
    });

    return {
      success: true,
      data: tipos.map((t) => t.tipo).filter((t): t is string => t !== null),
    };
  } catch (error) {
    console.error("Erro ao listar tipos de petição:", error);
    return {
      success: false,
      error: "Erro ao listar tipos de petição",
      data: [],
    };
  }
}
