"use server";

import { getSession } from "@/app/lib/auth";
import prisma, { sanitizeForSerialization } from "@/app/lib/prisma";
import { ProcessoStatus, Prisma } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface Processo {
  id: string;
  tenantId: string;
  numero: string;
  titulo: string | null;
  descricao: string | null;
  status: ProcessoStatus;
  areaId: string | null;
  classeProcessual: string | null;
  vara: string | null;
  comarca: string | null;
  foro: string | null;
  dataDistribuicao: Date | null;
  segredoJustica: boolean;
  valorCausa: number | null;
  rito: string | null;
  clienteId: string;
  advogadoResponsavelId: string | null;
  juizId: string | null;
  tribunalId: string | null;
  tags: any;
  prazoPrincipal: Date | null;
  numeroInterno: string | null;
  pastaCompartilhadaUrl: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessoDetalhado extends Processo {
  area: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  cliente: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    tipoPessoa: string;
  };
  advogadoResponsavel: {
    id: string;
    oabNumero: string | null;
    oabUf: string | null;
    usuario: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      avatarUrl: string | null;
    };
  } | null;
  juiz: {
    id: string;
    nome: string;
    nomeCompleto: string | null;
  } | null;
  procuracoesVinculadas: {
    id: string;
    procuracao: {
      id: string;
      numero: string | null;
      arquivoUrl: string | null;
      emitidaEm: Date | null;
      validaAte: Date | null;
      revogadaEm: Date | null;
      ativa: boolean;
      status: string;
      observacoes: string | null;
      outorgados: {
        id: string;
        advogado: {
          id: string;
          oabNumero: string | null;
          oabUf: string | null;
          usuario: {
            firstName: string | null;
            lastName: string | null;
          };
        };
      }[];
    };
  }[];
  _count: {
    documentos: number;
    eventos: number;
    movimentacoes: number;
    tarefas: number;
  };
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
    select: { id: true },
  });

  return advogado?.id || null;
}

async function getClienteIdFromSession(session: { user: any }): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return cliente?.id || null;
}

// ============================================
// ACTIONS - LISTAGEM
// ============================================

/**
 * Busca todos os processos que o usuário pode ver
 * - ADMIN: Todos do tenant
 * - ADVOGADO: Dos clientes vinculados
 * - CLIENTE: Apenas os próprios
 */
export async function getAllProcessos(): Promise<{
  success: boolean;
  processos?: Processo[];
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

    let whereClause: Prisma.ProcessoWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // CLIENTE: Apenas seus processos
    const clienteId = await getClienteIdFromSession(session);
    if (clienteId) {
      whereClause.clienteId = clienteId;
    }
    // ADVOGADO: Processos onde ele está habilitado na procuração OU dos clientes que ele criou
    else if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      // 1. Buscar IDs dos clientes que o advogado criou (relacionamento direto)
      const clientesCriados = await prisma.cliente.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          // Cliente criado pelo advogado (através do usuário criado)
          usuario: {
            createdById: user.id,
          },
        },
        select: {
          id: true,
        },
      });

      // 2. Buscar processos onde o advogado está habilitado na procuração
      const processosComProcuracao = await prisma.processo.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          procuracoesVinculadas: {
            some: {
              procuracao: {
                outorgados: {
                  some: {
                    advogadoId,
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      const clientesIds = clientesCriados.map((c) => c.id);
      const processosIds = processosComProcuracao.map((p) => p.id);

      // Se não tem acesso a nenhum processo, retornar vazio
      if (clientesIds.length === 0 && processosIds.length === 0) {
        return { success: true, processos: [] };
      }

      // Construir where clause: processos dos clientes criados OU processos com procuração
      const whereConditions = [];

      if (clientesIds.length > 0) {
        whereConditions.push({
          clienteId: {
            in: clientesIds,
          },
        });
      }

      if (processosIds.length > 0) {
        whereConditions.push({
          id: {
            in: processosIds,
          },
        });
      }

      whereClause = {
        ...whereClause,
        OR: whereConditions,
      };
    }
    // ADMIN ou SUPER_ADMIN: Todos do tenant (whereClause já tem apenas tenantId)

    const processos = await prisma.processo.findMany({
      where: whereClause,
      include: {
        area: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
          },
        },
        advogadoResponsavel: {
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
        _count: {
          select: {
            documentos: true,
            eventos: true,
            movimentacoes: true,
            tarefas: true,
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
      processos: sanitizeForSerialization(processos) as Processo[],
    };
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    return {
      success: false,
      error: "Erro ao buscar processos",
    };
  }
}

/**
 * Busca processos do cliente logado (para quando usuário É um cliente)
 */
export async function getProcessosDoClienteLogado(): Promise<{
  success: boolean;
  processos?: Processo[];
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

    // Buscar cliente vinculado ao usuário
    const clienteId = await getClienteIdFromSession(session);
    if (!clienteId) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const processos = await prisma.processo.findMany({
      where: {
        tenantId: user.tenantId,
        clienteId: clienteId,
        deletedAt: null,
      },
      include: {
        area: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
        advogadoResponsavel: {
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
        _count: {
          select: {
            documentos: { where: { deletedAt: null, visivelParaCliente: true } },
            eventos: true,
            movimentacoes: true,
            tarefas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      processos: sanitizeForSerialization(processos) as Processo[],
    };
  } catch (error) {
    console.error("Erro ao buscar processos do cliente:", error);
    return {
      success: false,
      error: "Erro ao buscar processos",
    };
  }
}

/**
 * Busca processos de um cliente específico (para advogados)
 */
export async function getProcessosDoCliente(clienteId: string): Promise<{
  success: boolean;
  processos?: Processo[];
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
    const advogadoId = await getAdvogadoIdFromSession(session);

    let clienteWhereClause: Prisma.ClienteWhereInput = {
      id: clienteId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se não for ADMIN, verificar vínculo com advogado
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      clienteWhereClause.advogadoClientes = {
        some: {
          advogadoId: advogadoId,
        },
      };
    }

    // Verificar se cliente existe e está acessível
    const cliente = await prisma.cliente.findFirst({
      where: clienteWhereClause,
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado ou sem acesso" };
    }

    const processos = await prisma.processo.findMany({
      where: {
        tenantId: user.tenantId,
        clienteId: clienteId,
        deletedAt: null,
      },
      include: {
        area: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            documentos: true,
            eventos: true,
            movimentacoes: true,
            tarefas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      processos: sanitizeForSerialization(processos) as Processo[],
    };
  } catch (error) {
    console.error("Erro ao buscar processos do cliente:", error);
    return {
      success: false,
      error: "Erro ao buscar processos",
    };
  }
}

// ============================================
// ACTIONS - DETALHES
// ============================================

/**
 * Busca detalhes completos de um processo incluindo procurações
 */
export async function getProcessoDetalhado(processoId: string): Promise<{
  success: boolean;
  processo?: ProcessoDetalhado;
  isCliente?: boolean;
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

    // Verificar se usuário é cliente
    const clienteId = await getClienteIdFromSession(session);
    const isCliente = !!clienteId;

    let whereClause: Prisma.ProcessoWhereInput = {
      id: processoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se for cliente, só pode ver seus próprios processos
    if (isCliente) {
      whereClause.clienteId = clienteId;
    }
    // Se for advogado (não admin), verificar acesso
    else if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      // Verificar se advogado tem acesso ao processo:
      // 1. Cliente criado pelo advogado OU
      // 2. Advogado habilitado na procuração do processo
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
        procuracoesVinculadas: {
          some: {
            procuracao: {
              outorgados: {
                some: {
                  advogadoId: advogadoId,
                },
              },
            },
          },
        },
      });

      whereClause.OR = whereConditions;
    }

    const processo = await prisma.processo.findFirst({
      where: whereClause,
      include: {
        area: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            tipoPessoa: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        juiz: {
          select: {
            id: true,
            nome: true,
            nomeCompleto: true,
          },
        },
        procuracoesVinculadas: {
          include: {
            procuracao: {
              include: {
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
              },
            },
          },
        },
        _count: {
          select: {
            documentos: {
              where: isCliente ? { deletedAt: null, visivelParaCliente: true } : { deletedAt: null },
            },
            eventos: true,
            movimentacoes: true,
            tarefas: true,
          },
        },
      },
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado ou sem acesso" };
    }

    return {
      success: true,
      processo: sanitizeForSerialization(processo) as unknown as ProcessoDetalhado,
      isCliente,
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do processo:", error);
    return {
      success: false,
      error: "Erro ao buscar processo",
    };
  }
}

/**
 * Busca documentos de um processo (respeitando visibilidade para cliente)
 */
export async function getDocumentosProcesso(processoId: string): Promise<{
  success: boolean;
  documentos?: any[];
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

    // Verificar se usuário é cliente
    const clienteId = await getClienteIdFromSession(session);
    const isCliente = !!clienteId;

    // Verificar acesso ao processo
    let whereProcesso: Prisma.ProcessoWhereInput = {
      id: processoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (isCliente) {
      whereProcesso.clienteId = clienteId;
    }

    const processo = await prisma.processo.findFirst({
      where: whereProcesso,
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    // Buscar documentos
    const whereDocumentos: Prisma.DocumentoWhereInput = {
      processoId: processoId,
      deletedAt: null,
    };

    // Se for cliente, apenas documentos visíveis
    if (isCliente) {
      whereDocumentos.visivelParaCliente = true;
    }

    const documentos = await prisma.documento.findMany({
      where: whereDocumentos,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      documentos: sanitizeForSerialization(documentos),
    };
  } catch (error) {
    console.error("Erro ao buscar documentos do processo:", error);
    return {
      success: false,
      error: "Erro ao buscar documentos",
    };
  }
}

/**
 * Busca eventos/audiências de um processo
 */
export async function getEventosProcesso(processoId: string): Promise<{
  success: boolean;
  eventos?: any[];
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

    // Verificar acesso ao processo
    const clienteId = await getClienteIdFromSession(session);
    const isCliente = !!clienteId;

    let whereProcesso: Prisma.ProcessoWhereInput = {
      id: processoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (isCliente) {
      whereProcesso.clienteId = clienteId;
    }

    const processo = await prisma.processo.findFirst({
      where: whereProcesso,
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    const eventos = await prisma.evento.findMany({
      where: {
        processoId: processoId,
      },
      include: {
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    return {
      success: true,
      eventos: sanitizeForSerialization(eventos),
    };
  } catch (error) {
    console.error("Erro ao buscar eventos do processo:", error);
    return {
      success: false,
      error: "Erro ao buscar eventos",
    };
  }
}

/**
 * Busca movimentações de um processo
 */
export async function getMovimentacoesProcesso(processoId: string): Promise<{
  success: boolean;
  movimentacoes?: any[];
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

    // Verificar acesso ao processo
    const clienteId = await getClienteIdFromSession(session);
    const isCliente = !!clienteId;

    let whereProcesso: Prisma.ProcessoWhereInput = {
      id: processoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (isCliente) {
      whereProcesso.clienteId = clienteId;
    }

    const processo = await prisma.processo.findFirst({
      where: whereProcesso,
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    const movimentacoes = await prisma.movimentacaoProcesso.findMany({
      where: {
        processoId: processoId,
      },
      include: { criadoPor: true },
      orderBy: {
        dataMovimentacao: "desc",
      },
    });

    return {
      success: true,
      movimentacoes: sanitizeForSerialization(movimentacoes),
    };
  } catch (error) {
    console.error("Erro ao buscar movimentações do processo:", error);
    return {
      success: false,
      error: "Erro ao buscar movimentações",
    };
  }
}

// ============================================
// ACTIONS - CRIAR PROCESSO
// ============================================

export interface ProcessoCreateInput {
  numero: string;
  titulo?: string;
  descricao?: string;
  status?: ProcessoStatus;
  areaId?: string;
  classeProcessual?: string;
  vara?: string;
  comarca?: string;
  foro?: string;
  dataDistribuicao?: Date | string;
  segredoJustica?: boolean;
  valorCausa?: number;
  rito?: string;
  clienteId: string;
  advogadoResponsavelId?: string;
  numeroInterno?: string;
}

export async function createProcesso(data: ProcessoCreateInput) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Validar campos obrigatórios
    if (!data.numero || !data.clienteId) {
      return { success: false, error: "Número do processo e cliente são obrigatórios" };
    }

    // Validar acesso ao cliente
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

    // Se for ADVOGADO, validar vínculo com o cliente
    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      const vinculo = await prisma.advogadoCliente.findFirst({
        where: {
          advogadoId,
          clienteId: cliente.id,
          tenantId: user.tenantId,
        },
      });

      if (!vinculo) {
        return { success: false, error: "Você não tem acesso a este cliente" };
      }

      // Se não informou advogado responsável, usar o próprio
      if (!data.advogadoResponsavelId) {
        data.advogadoResponsavelId = advogadoId;
      }
    }

    // Verificar se número do processo já existe
    const processoExistente = await prisma.processo.findFirst({
      where: {
        numero: data.numero,
        tenantId: user.tenantId,
      },
    });

    if (processoExistente) {
      return { success: false, error: "Já existe um processo com este número" };
    }

    // Criar processo
    const processo = await prisma.processo.create({
      data: {
        tenantId: user.tenantId,
        numero: data.numero,
        titulo: data.titulo,
        descricao: data.descricao,
        status: data.status || ProcessoStatus.RASCUNHO,
        areaId: data.areaId,
        classeProcessual: data.classeProcessual,
        vara: data.vara,
        comarca: data.comarca,
        foro: data.foro,
        dataDistribuicao: data.dataDistribuicao ? new Date(data.dataDistribuicao) : null,
        segredoJustica: data.segredoJustica || false,
        valorCausa: data.valorCausa,
        rito: data.rito,
        clienteId: data.clienteId,
        advogadoResponsavelId: data.advogadoResponsavelId,
        numeroInterno: data.numeroInterno,
      },
      include: {
        cliente: true,
        area: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
      },
    });

    return {
      success: true,
      processo: sanitizeForSerialization(processo) as unknown as ProcessoDetalhado,
    };
  } catch (error) {
    console.error("Erro ao criar processo:", error);
    return {
      success: false,
      error: "Erro ao criar processo",
    };
  }
}
