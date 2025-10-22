"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { MovimentacaoTipo } from "@/app/generated/prisma";

// ============================================
// TIPOS
// ============================================

export interface AndamentoFilters {
  processoId?: string;
  tipo?: MovimentacaoTipo;
  dataInicio?: Date;
  dataFim?: Date;
  searchTerm?: string;
}

export interface AndamentoCreateInput {
  processoId: string;
  titulo: string;
  descricao?: string;
  tipo?: MovimentacaoTipo;
  dataMovimentacao?: Date;
  prazo?: Date;
  geraPrazo?: boolean; // Flag para indicar se deve gerar prazo automático
  // Campos para notificações
  notificarCliente?: boolean;
  notificarEmail?: boolean;
  notificarWhatsapp?: boolean;
  mensagemPersonalizada?: string;
}

export interface AndamentoUpdateInput {
  titulo?: string;
  descricao?: string;
  tipo?: MovimentacaoTipo;
  dataMovimentacao?: Date;
  prazo?: Date;
  // Campos para notificações
  notificarCliente?: boolean;
  notificarEmail?: boolean;
  notificarWhatsapp?: boolean;
  mensagemPersonalizada?: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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

export async function listAndamentos(
  filters: AndamentoFilters,
): Promise<ActionResponse<any[]>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    const where: any = {
      tenantId,
      ...(filters.processoId && { processoId: filters.processoId }),
      ...(filters.tipo && { tipo: filters.tipo }),
    };

    // Filtro de data
    if (filters.dataInicio || filters.dataFim) {
      where.dataMovimentacao = {};
      if (filters.dataInicio) {
        where.dataMovimentacao.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.dataMovimentacao.lte = filters.dataFim;
      }
    }

    // Busca textual
    if (filters.searchTerm) {
      where.OR = [
        { titulo: { contains: filters.searchTerm, mode: "insensitive" } },
        { descricao: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    const andamentos = await prisma.movimentacaoProcesso.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        documentos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            url: true,
          },
        },
        prazosRelacionados: {
          select: {
            id: true,
            titulo: true,
            dataVencimento: true,
            status: true,
          },
        },
      },
      orderBy: {
        dataMovimentacao: "desc",
      },
    });

    return {
      success: true,
      data: andamentos,
    };
  } catch (error: any) {
    console.error("Erro ao listar andamentos:", error);

    return {
      success: false,
      error: error.message || "Erro ao listar andamentos",
    };
  }
}

// ============================================
// BUSCAR INDIVIDUAL
// ============================================

export async function getAndamento(
  andamentoId: string,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();

    const andamento = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            cliente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        documentos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            url: true,
            createdAt: true,
          },
        },
        prazosRelacionados: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            dataVencimento: true,
            status: true,
            responsavel: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!andamento) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao buscar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar andamento",
    };
  }
}

// ============================================
// CRIAR ANDAMENTO
// ============================================

export async function createAndamento(
  input: AndamentoCreateInput,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    // Verificar se processo existe e pertence ao tenant
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

    const andamento = await prisma.movimentacaoProcesso.create({
      data: {
        tenantId,
        processoId: input.processoId,
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        dataMovimentacao: input.dataMovimentacao || new Date(),
        prazo: input.prazo,
        criadoPorId: userId,
        // Campos para notificações
        notificarCliente: input.notificarCliente || false,
        notificarEmail: input.notificarEmail || false,
        notificarWhatsapp: input.notificarWhatsapp || false,
        mensagemPersonalizada: input.mensagemPersonalizada,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    // Se marcado para gerar prazo automático
    if (input.geraPrazo && input.prazo) {
      await prisma.processoPrazo.create({
        data: {
          tenantId,
          processoId: input.processoId,
          titulo: `Prazo: ${input.titulo}`,
          descricao: input.descricao,
          dataVencimento: input.prazo,
          status: "ABERTO",
          origemMovimentacaoId: andamento.id,
        },
      });
    }

    revalidatePath("/processos");
    revalidatePath(`/processos/${input.processoId}`);

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao criar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao criar andamento",
    };
  }
}

// ============================================
// ATUALIZAR ANDAMENTO
// ============================================

export async function updateAndamento(
  andamentoId: string,
  input: AndamentoUpdateInput,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();

    // Verificar se andamento existe e pertence ao tenant
    const andamentoExistente = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
    });

    if (!andamentoExistente) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    const andamento = await prisma.movimentacaoProcesso.update({
      where: { id: andamentoId },
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        dataMovimentacao: input.dataMovimentacao,
        prazo: input.prazo,
        // Campos para notificações
        notificarCliente: input.notificarCliente,
        notificarEmail: input.notificarEmail,
        notificarWhatsapp: input.notificarWhatsapp,
        mensagemPersonalizada: input.mensagemPersonalizada,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    revalidatePath("/processos");
    revalidatePath(`/processos/${andamento.processoId}`);

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao atualizar andamento",
    };
  }
}

// ============================================
// EXCLUIR ANDAMENTO
// ============================================

export async function deleteAndamento(
  andamentoId: string,
): Promise<ActionResponse<null>> {
  try {
    const tenantId = await getTenantId();

    // Verificar se andamento existe e pertence ao tenant
    const andamento = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
    });

    if (!andamento) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    await prisma.movimentacaoProcesso.delete({
      where: { id: andamentoId },
    });

    revalidatePath("/processos");
    revalidatePath(`/processos/${andamento.processoId}`);

    return {
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.error("Erro ao excluir andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao excluir andamento",
    };
  }
}

// ============================================
// DASHBOARD/MÉTRICAS
// ============================================

export async function getDashboardAndamentos(
  processoId?: string,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    const where: any = { tenantId };

    if (processoId) {
      where.processoId = processoId;
    }

    // Debug temporário
    console.log("getDashboardAndamentos - tenantId:", tenantId);
    console.log("getDashboardAndamentos - userId:", userId);
    console.log("getDashboardAndamentos - where:", where);

    // Usar a mesma lógica da função listAndamentos que está funcionando
    const andamentos = await prisma.movimentacaoProcesso.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    // Calcular métricas a partir dos dados
    const total = andamentos.length;
    const porTipo = andamentos.reduce((acc: any, andamento: any) => {
      const tipo = andamento.tipo;

      acc[tipo] = (acc[tipo] || 0) + 1;

      return acc;
    }, {});

    // Converter para o formato esperado
    const porTipoArray = Object.entries(porTipo).map(([tipo, count]) => ({
      tipo,
      _count: count,
    }));

    const ultimosAndamentos = andamentos
      .sort(
        (a: any, b: any) =>
          new Date(b.dataMovimentacao).getTime() -
          new Date(a.dataMovimentacao).getTime(),
      )
      .slice(0, 10);

    // Debug temporário
    console.log("getDashboardAndamentos - total:", total);
    console.log("getDashboardAndamentos - porTipo:", porTipoArray);
    console.log(
      "getDashboardAndamentos - ultimosAndamentos:",
      ultimosAndamentos.length,
    );

    return {
      success: true,
      data: {
        total,
        porTipo: porTipoArray,
        ultimosAndamentos,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar dashboard de andamentos:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar dashboard de andamentos",
    };
  }
}

// ============================================
// TIPOS DE MOVIMENTAÇÃO
// ============================================

export async function getTiposMovimentacao(): Promise<
  ActionResponse<MovimentacaoTipo[]>
> {
  try {
    // Retornar os tipos do enum
    const tipos: MovimentacaoTipo[] = [
      "ANDAMENTO",
      "PRAZO",
      "INTIMACAO",
      "AUDIENCIA",
      "ANEXO",
      "OUTRO",
    ];

    return {
      success: true,
      data: tipos,
    };
  } catch (error: any) {
    console.error("Erro ao buscar tipos de movimentação:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar tipos de movimentação",
    };
  }
}
