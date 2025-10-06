"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
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

async function getAdvogadoIdFromSession(session: any): Promise<string | null> {
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

async function getClienteIdFromSession(session: any): Promise<string | null> {
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

    // Converter Decimal para number
    const processosFormatted = processos.map((p) => ({
      ...p,
      valorCausa: p.valorCausa ? Number(p.valorCausa) : null,
    }));

    return {
      success: true,
      processos: processosFormatted as any,
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

    let clienteWhereClause: any = {
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
            documentos: { where: { deletedAt: null } },
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

    // Converter Decimal para number
    const processosFormatted = processos.map((p) => ({
      ...p,
      valorCausa: p.valorCausa ? Number(p.valorCausa) : null,
    }));

    return {
      success: true,
      processos: processosFormatted as any,
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

    let whereClause: any = {
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

      // Verificar se advogado está vinculado ao cliente do processo
      whereClause.cliente = {
        advogadoClientes: {
          some: {
            advogadoId: advogadoId,
          },
        },
      };
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

    // Converter Decimal para number
    const processoFormatted: ProcessoDetalhado = {
      ...processo,
      valorCausa: processo.valorCausa ? Number(processo.valorCausa) : null,
    } as ProcessoDetalhado;

    return {
      success: true,
      processo: processoFormatted,
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
    let whereProcesso: any = {
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
    const whereDocumentos: any = {
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
      documentos,
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

    let whereProcesso: any = {
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
        advogado: {
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
      eventos,
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

    let whereProcesso: any = {
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
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dataMovimentacao: "desc",
      },
    });

    return {
      success: true,
      movimentacoes,
    };
  } catch (error) {
    console.error("Erro ao buscar movimentações do processo:", error);
    return {
      success: false,
      error: "Erro ao buscar movimentações",
    };
  }
}
