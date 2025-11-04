"use server";

import { getSession } from "@/app/lib/auth";
import prisma, { toNumber } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import {
  Prisma,
  ProcuracaoEmitidaPor,
  ProcuracaoStatus,
} from "@/app/generated/prisma";
import {
  getAccessibleAdvogadoIds,
  getAdvogadoIdFromSession,
} from "@/app/lib/advogado-access";

// ============================================
// TYPES
// ============================================

export interface ProcuracaoFormData {
  numero?: string;
  arquivoUrl?: string;
  observacoes?: string;
  emitidaEm?: Date;
  validaAte?: Date;
  revogadaEm?: Date;
  assinadaPeloClienteEm?: Date;
  emitidaPor: "ESCRITORIO" | "ADVOGADO";
  clienteId: string;
  modeloId?: string;
  processoIds?: string[];
  advogadoIds: string[];
  status?: ProcuracaoStatus;
  ativa?: boolean;
  poderes?: {
    titulo?: string;
    descricao: string;
  }[];
}

export type ProcuracaoCreateInput = ProcuracaoFormData;

// ============================================
// HELPER FUNCTIONS
// ============================================

const procuracaoListInclude = Prisma.validator<Prisma.ProcuracaoInclude>()({
  cliente: {
    select: {
      id: true,
      nome: true,
      tipoPessoa: true,
    },
  },
  modelo: {
    select: {
      id: true,
      nome: true,
      categoria: true,
    },
  },
  outorgados: {
    include: {
      advogado: {
        select: {
          id: true,
          oabNumero: true,
          oabUf: true,
          usuario: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
  processos: {
    include: {
      processo: {
        select: {
          id: true,
          numero: true,
          titulo: true,
        },
      },
    },
  },
  poderes: {
    select: {
      id: true,
      titulo: true,
      descricao: true,
      ativo: true,
    },
  },
  _count: {
    select: {
      processos: true,
      outorgados: true,
    },
  },
});

export type ProcuracaoListItem = Prisma.ProcuracaoGetPayload<{
  include: typeof procuracaoListInclude;
}>;

async function getClienteIdFromSession(session: {
  user: any;
}): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: {
      id: true,
    },
  });

  return cliente?.id || null;
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Busca todas as procurações do tenant
 */
export async function getAllProcuracoes(): Promise<{
  success: boolean;
  procuracoes?: any[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    let whereClause: Prisma.ProcuracaoWhereInput = {
      tenantId: user.tenantId,
    };

    // CLIENTE: Apenas suas procurações
    const clienteId = await getClienteIdFromSession(session);
    const accessibleAdvogados = await getAccessibleAdvogadoIds(session);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (clienteId) {
      whereClause.clienteId = clienteId;
    // Funcionário sem vínculos: acesso total (não aplicar filtros)
    } else if (!isAdmin && accessibleAdvogados.length > 0) {
      const orConditions: Prisma.ProcuracaoWhereInput[] = [
        {
          outorgados: {
            some: {
              advogadoId: {
                in: accessibleAdvogados,
              },
            },
          },
        },
        {
          cliente: {
            advogadoClientes: {
              some: {
                advogadoId: {
                  in: accessibleAdvogados,
                },
              },
            },
          },
        },
        {
          processos: {
            some: {
              processo: {
                advogadoResponsavelId: {
                  in: accessibleAdvogados,
                },
              },
            },
          },
        },
      ];

      if (user.role === "ADVOGADO") {
        orConditions.push({
          cliente: {
            usuario: {
              createdById: user.id,
            },
          },
        });
      }

      whereClause = {
        ...whereClause,
        OR: orConditions,
      };
    }
    // ADMIN ou SUPER_ADMIN: Todas do tenant

    const procuracoes = await prisma.procuracao.findMany({
      where: whereClause,
      include: procuracaoListInclude,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return {
      success: true,
      procuracoes: procuracoes,
    };
  } catch (error) {
    logger.error("Erro ao buscar todas as procurações:", error);

    return {
      success: false,
      error: "Erro ao buscar procurações",
    };
  }
}

/**
 * Busca uma procuração por ID
 */
export async function getProcuracaoById(procuracaoId: string): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    let whereClause: Prisma.ProcuracaoWhereInput = {
      id: procuracaoId,
      tenantId: user.tenantId,
    };

    // Verificar acesso baseado no role
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros)
      if (accessibleAdvogados.length > 0) {
        const orConditions: Prisma.ProcuracaoWhereInput[] = [
        {
          cliente: {
            advogadoClientes: {
              some: {
                advogadoId: {
                  in: accessibleAdvogados,
                },
              },
            },
          },
        },
        {
          outorgados: {
            some: {
              advogadoId: {
                in: accessibleAdvogados,
              },
            },
          },
        },
        {
          processos: {
            some: {
              processo: {
                advogadoResponsavelId: {
                  in: accessibleAdvogados,
                },
              },
            },
          },
        },
      ];

      if (user.role === "ADVOGADO") {
        orConditions.push({
          cliente: {
            usuario: {
              createdById: user.id,
            },
          },
        });
      }

      whereClause.OR = orConditions;
    }

    const procuracao = await prisma.procuracao.findFirst({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
            email: true,
            telefone: true,
          },
        },
        modelo: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            conteudo: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
              include: {
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
                titulo: true,
                status: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!procuracao) {
      return {
        success: false,
        error: "Procuração não encontrada ou sem acesso",
      };
    }

    // Converter Decimals para number nos advogados outorgados
    const procuracaoSerializada = {
      ...procuracao,
      outorgados: procuracao.outorgados?.map((outorgado: any) => ({
        ...outorgado,
        advogado: {
          ...outorgado.advogado,
          comissaoPadrao: toNumber(outorgado.advogado.comissaoPadrao) || 0,
          comissaoAcaoGanha:
            toNumber(outorgado.advogado.comissaoAcaoGanha) || 0,
          comissaoHonorarios:
            toNumber(outorgado.advogado.comissaoHonorarios) || 0,
        },
      })),
    };

    return {
      success: true,
      procuracao: procuracaoSerializada,
    };
  } catch (error) {
    logger.error("Erro ao buscar procuração:", error);

    return {
      success: false,
      error: "Erro ao buscar procuração",
    };
  }
}

/**
 * Busca procurações de um cliente
 */
export async function getProcuracoesCliente(clienteId: string): Promise<{
  success: boolean;
  procuracoes?: any[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar acesso ao cliente
    let whereCliente: Prisma.ClienteWhereInput = {
      id: clienteId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se não for ADMIN, verificar se é advogado vinculado
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      whereCliente.advogadoClientes = {
        some: {
          advogadoId: advogadoId,
        },
      };
    }

    // Verificar se cliente existe e está acessível
    const cliente = await prisma.cliente.findFirst({
      where: whereCliente,
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado ou sem acesso" };
    }

    const procuracoes = await prisma.procuracao.findMany({
      where: {
        clienteId: clienteId,
        tenantId: user.tenantId,
      },
      include: {
        modelo: {
          select: {
            id: true,
            nome: true,
            categoria: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
              select: {
                id: true,
                oabNumero: true,
                oabUf: true,
                especialidades: true,
                bio: true,
                telefone: true,
                whatsapp: true,
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
        _count: {
          select: {
            processos: true,
            outorgados: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      procuracoes: procuracoes,
    };
  } catch (error) {
    logger.error("Erro ao buscar procurações do cliente:", error);

    return {
      success: false,
      error: "Erro ao buscar procurações do cliente",
    };
  }
}

/**
 * Cria uma nova procuração
 */
export async function createProcuracao(data: ProcuracaoFormData): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se é ADMIN ou ADVOGADO
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADVOGADO"
    ) {
      return { success: false, error: "Acesso negado" };
    }

    // Verificar se o cliente existe e está acessível
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: data.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Verificar se o modelo existe (se fornecido)
    if (data.modeloId) {
      const modelo = await prisma.modeloProcuracao.findFirst({
        where: {
          id: data.modeloId,
          tenantId: user.tenantId,
          deletedAt: null,
          ativo: true,
        },
      });

      if (!modelo) {
        return { success: false, error: "Modelo não encontrado" };
      }
    }

    // Verificar se os advogados existem
    if (data.advogadoIds.length > 0) {
      const advogados = await prisma.advogado.findMany({
        where: {
          id: {
            in: data.advogadoIds,
          },
          tenantId: user.tenantId,
        },
      });

      if (advogados.length !== data.advogadoIds.length) {
        return {
          success: false,
          error: "Um ou mais advogados não encontrados",
        };
      }
    }

    // Verificar se os processos existem (se fornecidos)
    if (data.processoIds && data.processoIds.length > 0) {
      const processos = await prisma.processo.findMany({
        where: {
          id: {
            in: data.processoIds,
          },
          tenantId: user.tenantId,
          deletedAt: null,
        },
      });

      if (processos.length !== data.processoIds.length) {
        return {
          success: false,
          error: "Um ou mais processos não encontrados",
        };
      }
    }

    // Criar a procuração
    const procuracao = await prisma.procuracao.create({
      data: {
        tenantId: user.tenantId,
        clienteId: data.clienteId,
        modeloId: data.modeloId,
        numero: data.numero,
        arquivoUrl: data.arquivoUrl,
        observacoes: data.observacoes,
        emitidaEm: data.emitidaEm,
        validaAte: data.validaAte,
        revogadaEm: data.revogadaEm,
        assinadaPeloClienteEm: data.assinadaPeloClienteEm,
        emitidaPor:
          data.emitidaPor === "ADVOGADO"
            ? ProcuracaoEmitidaPor.ADVOGADO
            : ProcuracaoEmitidaPor.ESCRITORIO,
        status: data.status ?? ProcuracaoStatus.RASCUNHO,
        ativa: data.ativa ?? true,
        createdById: user.id,
      },
      include: procuracaoListInclude,
    });

    // Vincular advogados
    if (data.advogadoIds.length > 0) {
      await prisma.procuracaoAdvogado.createMany({
        data: data.advogadoIds.map((advogadoId) => ({
          tenantId: user.tenantId,
          procuracaoId: procuracao.id,
          advogadoId: advogadoId,
        })),
      });
    }

    // Vincular processos
    if (data.processoIds && data.processoIds.length > 0) {
      await prisma.procuracaoProcesso.createMany({
        data: data.processoIds.map((processoId) => ({
          tenantId: user.tenantId,
          procuracaoId: procuracao.id,
          processoId: processoId,
        })),
      });
    }

    if (data.poderes && data.poderes.length > 0) {
      const poderesParaCriar = data.poderes
        .filter((poder) => poder.descricao.trim().length > 0)
        .map((poder) => ({
          tenantId: user.tenantId,
          procuracaoId: procuracao.id,
          titulo: poder.titulo,
          descricao: poder.descricao,
        }));

      if (poderesParaCriar.length > 0) {
        await prisma.procuracaoPoder.createMany({
          data: poderesParaCriar,
        });
      }
    }

    return {
      success: true,
      procuracao: procuracao,
    };
  } catch (error) {
    logger.error("Erro ao criar procuração:", error);

    return {
      success: false,
      error: "Erro ao criar procuração",
    };
  }
}

// ============================================
// UPDATE PROCURAÇÃO
// ============================================

export interface ProcuracaoUpdateInput {
  numero?: string;
  arquivoUrl?: string;
  observacoes?: string;
  emitidaEm?: string;
  validaAte?: string;
  revogadaEm?: string;
  status?: ProcuracaoStatus;
  emitidaPor?: ProcuracaoEmitidaPor;
  ativa?: boolean;
}

export async function updateProcuracao(
  procuracaoId: string,
  data: ProcuracaoUpdateInput,
): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe e o usuário tem acesso
    const procuracaoExistente = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracaoExistente) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Atualizar procuração
    const procuracao = await prisma.procuracao.update({
      where: {
        id: procuracaoId,
      },
      data: {
        numero: data.numero,
        arquivoUrl: data.arquivoUrl,
        observacoes: data.observacoes,
        emitidaEm: data.emitidaEm ? new Date(data.emitidaEm) : undefined,
        validaAte: data.validaAte ? new Date(data.validaAte) : undefined,
        revogadaEm: data.revogadaEm ? new Date(data.revogadaEm) : undefined,
        status: data.status,
        emitidaPor: data.emitidaPor,
        ativa: data.ativa,
      },
      include: procuracaoListInclude,
    });

    return {
      success: true,
      procuracao,
    };
  } catch (error) {
    logger.error("Erro ao atualizar procuração:", error);

    return {
      success: false,
      error: "Erro ao atualizar procuração",
    };
  }
}

// ============================================
// DELETE PROCURAÇÃO
// ============================================

export async function deleteProcuracao(procuracaoId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe e o usuário tem acesso
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Deletar procuração (cascade deleta os relacionamentos)
    await prisma.procuracao.delete({
      where: {
        id: procuracaoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao deletar procuração:", error);

    return {
      success: false,
      error: "Erro ao deletar procuração",
    };
  }
}

// ============================================
// ADVOGADOS
// ============================================

export async function adicionarAdvogadoNaProcuracao(
  procuracaoId: string,
  advogadoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Verificar se o advogado existe
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: user.tenantId,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Verificar se já existe o vínculo
    const vinculoExistente = await prisma.procuracaoAdvogado.findFirst({
      where: {
        procuracaoId,
        advogadoId,
      },
    });

    if (vinculoExistente) {
      return { success: false, error: "Advogado já está na procuração" };
    }

    // Criar vínculo
    await prisma.procuracaoAdvogado.create({
      data: {
        tenantId: user.tenantId,
        procuracaoId,
        advogadoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao adicionar advogado na procuração:", error);

    return {
      success: false,
      error: "Erro ao adicionar advogado na procuração",
    };
  }
}

export async function removerAdvogadoDaProcuracao(
  procuracaoId: string,
  advogadoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Remover vínculo
    const result = await prisma.procuracaoAdvogado.deleteMany({
      where: {
        procuracaoId,
        advogadoId,
        tenantId: user.tenantId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Vínculo não encontrado" };
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao remover advogado da procuração:", error);

    return {
      success: false,
      error: "Erro ao remover advogado da procuração",
    };
  }
}

// ============================================
// PROCESSOS
// ============================================

export async function vincularProcesso(
  procuracaoId: string,
  processoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Verificar se o processo existe
    const processo = await prisma.processo.findFirst({
      where: {
        id: processoId,
        tenantId: user.tenantId,
      },
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    // Verificar se já existe o vínculo
    const vinculoExistente = await prisma.procuracaoProcesso.findFirst({
      where: {
        procuracaoId,
        processoId,
      },
    });

    if (vinculoExistente) {
      return { success: false, error: "Processo já está vinculado" };
    }

    // Criar vínculo
    await prisma.procuracaoProcesso.create({
      data: {
        tenantId: user.tenantId,
        procuracaoId,
        processoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao vincular processo:", error);

    return {
      success: false,
      error: "Erro ao vincular processo",
    };
  }
}

export async function desvincularProcesso(
  procuracaoId: string,
  processoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Remover vínculo
    const result = await prisma.procuracaoProcesso.deleteMany({
      where: {
        procuracaoId,
        processoId,
        tenantId: user.tenantId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Vínculo não encontrado" };
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao desvincular processo:", error);

    return {
      success: false,
      error: "Erro ao desvincular processo",
    };
  }
}
