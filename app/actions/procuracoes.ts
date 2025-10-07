"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ProcuracaoFormData {
  numero?: string;
  observacoes?: string;
  emitidaEm?: Date;
  validaAte?: Date;
  emitidaPor: "ESCRITORIO" | "ADVOGADO";
  clienteId: string;
  modeloId?: string;
  processoIds?: string[];
  advogadoIds: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getAdvogadoIdFromSession(session: { user: any }): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: {
      id: true,
    },
  });

  return advogado?.id || null;
}

async function getClienteIdFromSession(session: { user: any }): Promise<string | null> {
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
    if (clienteId) {
      whereClause.clienteId = clienteId;
    }
    // ADVOGADO: Procurações onde ele está habilitado OU dos clientes que ele criou
    else if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      // 1. Buscar IDs dos clientes que o advogado criou
      const clientesCriados = await prisma.cliente.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          usuario: {
            createdById: user.id,
          },
        },
        select: {
          id: true,
        },
      });

      // 2. Buscar procurações onde o advogado está habilitado
      const procuracoesComAcesso = await prisma.procuracao.findMany({
        where: {
          tenantId: user.tenantId,
          outorgados: {
            some: {
              advogadoId: advogadoId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const clientesIds = clientesCriados.map((c) => c.id);
      const procuracoesIds = procuracoesComAcesso.map((p) => p.id);

      // Se não tem acesso a nenhuma procuração, retornar vazio
      if (clientesIds.length === 0 && procuracoesIds.length === 0) {
        return { success: true, procuracoes: [] };
      }

      // Construir where clause: procurações dos clientes criados OU procurações com acesso
      const whereConditions = [];

      if (clientesIds.length > 0) {
        whereConditions.push({
          clienteId: {
            in: clientesIds,
          },
        });
      }

      if (procuracoesIds.length > 0) {
        whereConditions.push({
          id: {
            in: procuracoesIds,
          },
        });
      }

      whereClause = {
        ...whereClause,
        OR: whereConditions,
      };
    }
    // ADMIN ou SUPER_ADMIN: Todas do tenant

    const procuracoes = await prisma.procuracao.findMany({
      where: whereClause,
      include: {
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
      take: 100,
    });

    return {
      success: true,
      procuracoes: procuracoes,
    };
  } catch (error) {
    console.error("Erro ao buscar todas as procurações:", error);
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
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      // Verificar se advogado tem acesso à procuração:
      // 1. Cliente criado pelo advogado OU
      // 2. Advogado habilitado na procuração
      const whereConditions = [];

      // 1. Cliente criado pelo advogado
      whereConditions.push({
        cliente: {
          usuario: {
            createdById: user.id,
          },
        },
      });

      // 2. Advogado habilitado na procuração
      whereConditions.push({
        outorgados: {
          some: {
            advogadoId: advogadoId,
          },
        },
      });

      whereClause.OR = whereConditions;
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
      return { success: false, error: "Procuração não encontrada ou sem acesso" };
    }

    return {
      success: true,
      procuracao: procuracao,
    };
  } catch (error) {
    console.error("Erro ao buscar procuração:", error);
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
    console.error("Erro ao buscar procurações do cliente:", error);
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
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "ADVOGADO") {
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
        return { success: false, error: "Um ou mais advogados não encontrados" };
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
        return { success: false, error: "Um ou mais processos não encontrados" };
      }
    }

    // Criar a procuração
    const procuracao = await prisma.procuracao.create({
      data: {
        tenantId: user.tenantId,
        clienteId: data.clienteId,
        modeloId: data.modeloId,
        numero: data.numero,
        observacoes: data.observacoes,
        emitidaEm: data.emitidaEm,
        validaAte: data.validaAte,
        emitidaPor: data.emitidaPor,
        createdById: user.id,
      },
      include: {
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
      },
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

    return {
      success: true,
      procuracao: procuracao,
    };
  } catch (error) {
    console.error("Erro ao criar procuração:", error);
    return {
      success: false,
      error: "Erro ao criar procuração",
    };
  }
}
