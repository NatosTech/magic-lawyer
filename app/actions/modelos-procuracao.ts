"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ModeloProcuracaoFormData {
  nome: string;
  descricao?: string;
  conteudo: string;
  categoria?: string;
  ativo?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getAdvogadoIdFromSession(session: {
  user: any;
}): Promise<string | null> {
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

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Busca todos os modelos de procuração do tenant
 */
export async function getAllModelosProcuracao(): Promise<{
  success: boolean;
  modelos?: any[];
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

    const modelos = await prisma.modeloProcuracao.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            procuracoes: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return {
      success: true,
      modelos: modelos,
    };
  } catch (error) {
    console.error("Erro ao buscar modelos de procuração:", error);

    return {
      success: false,
      error: "Erro ao buscar modelos de procuração",
    };
  }
}

/**
 * Busca um modelo de procuração por ID
 */
export async function getModeloProcuracaoById(modeloId: string): Promise<{
  success: boolean;
  modelo?: any;
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

    const modelo = await prisma.modeloProcuracao.findFirst({
      where: {
        id: modeloId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            procuracoes: true,
          },
        },
      },
    });

    if (!modelo) {
      return { success: false, error: "Modelo não encontrado" };
    }

    return {
      success: true,
      modelo: modelo,
    };
  } catch (error) {
    console.error("Erro ao buscar modelo de procuração:", error);

    return {
      success: false,
      error: "Erro ao buscar modelo de procuração",
    };
  }
}

/**
 * Cria um novo modelo de procuração
 */
export async function createModeloProcuracao(
  data: ModeloProcuracaoFormData,
): Promise<{
  success: boolean;
  modelo?: any;
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

    const modelo = await prisma.modeloProcuracao.create({
      data: {
        tenantId: user.tenantId,
        nome: data.nome,
        descricao: data.descricao,
        conteudo: data.conteudo,
        categoria: data.categoria,
        ativo: data.ativo ?? true,
      },
      include: {
        _count: {
          select: {
            procuracoes: true,
          },
        },
      },
    });

    return {
      success: true,
      modelo: modelo,
    };
  } catch (error) {
    console.error("Erro ao criar modelo de procuração:", error);

    return {
      success: false,
      error: "Erro ao criar modelo de procuração",
    };
  }
}

/**
 * Atualiza um modelo de procuração
 */
export async function updateModeloProcuracao(
  modeloId: string,
  data: Partial<ModeloProcuracaoFormData>,
): Promise<{
  success: boolean;
  modelo?: any;
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

    // Verificar se o modelo existe e pertence ao tenant
    const modeloExistente = await prisma.modeloProcuracao.findFirst({
      where: {
        id: modeloId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!modeloExistente) {
      return { success: false, error: "Modelo não encontrado" };
    }

    const updateData: Prisma.ModeloProcuracaoUpdateInput = { ...data };

    const modelo = await prisma.modeloProcuracao.update({
      where: {
        id: modeloId,
      },
      data: updateData,
      include: {
        _count: {
          select: {
            procuracoes: true,
          },
        },
      },
    });

    return {
      success: true,
      modelo: modelo,
    };
  } catch (error) {
    console.error("Erro ao atualizar modelo de procuração:", error);

    return {
      success: false,
      error: "Erro ao atualizar modelo de procuração",
    };
  }
}

/**
 * Remove um modelo de procuração (soft delete)
 */
export async function deleteModeloProcuracao(modeloId: string): Promise<{
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

    // Verificar se é ADMIN ou ADVOGADO
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADVOGADO"
    ) {
      return { success: false, error: "Acesso negado" };
    }

    // Verificar se o modelo existe e pertence ao tenant
    const modeloExistente = await prisma.modeloProcuracao.findFirst({
      where: {
        id: modeloId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!modeloExistente) {
      return { success: false, error: "Modelo não encontrado" };
    }

    // Verificar se há procurações usando este modelo
    const procuracoesCount = await prisma.procuracao.count({
      where: {
        modeloId: modeloId,
      },
    });

    if (procuracoesCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir este modelo pois ele está sendo usado por ${procuracoesCount} procuração(ões)`,
      };
    }

    await prisma.modeloProcuracao.update({
      where: {
        id: modeloId,
      },
      data: {
        deletedAt: new Date(),
        ativo: false,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao excluir modelo de procuração:", error);

    return {
      success: false,
      error: "Erro ao excluir modelo de procuração",
    };
  }
}

/**
 * Busca modelos de procuração para select (apenas ativos)
 */
export async function getModelosProcuracaoParaSelect(): Promise<{
  success: boolean;
  modelos?: { id: string; nome: string; categoria?: string | null }[];
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

    const modelos = await prisma.modeloProcuracao.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        categoria: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return {
      success: true,
      modelos: modelos,
    };
  } catch (error) {
    console.error("Erro ao buscar modelos para select:", error);

    return {
      success: false,
      error: "Erro ao buscar modelos para select",
    };
  }
}

/**
 * Gera PDF de uma procuração baseada no modelo
 */
export async function gerarPdfProcuracao(
  procuracaoId: string,
  dadosPreenchidos: Record<string, any>,
): Promise<{
  success: boolean;
  pdfUrl?: string;
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

    // Buscar a procuração com o modelo
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
      include: {
        modelo: true,
        cliente: {
          select: {
            nome: true,
            documento: true,
            email: true,
            telefone: true,
            tipoPessoa: true,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    if (!procuracao.modelo) {
      return {
        success: false,
        error: "Modelo não encontrado para esta procuração",
      };
    }

    // Aqui você implementaria a geração do PDF
    // Por enquanto, retornamos uma URL mock
    const pdfUrl = `/api/procuracao/${procuracaoId}/pdf?t=${Date.now()}`;

    return {
      success: true,
      pdfUrl: pdfUrl,
    };
  } catch (error) {
    console.error("Erro ao gerar PDF da procuração:", error);

    return {
      success: false,
      error: "Erro ao gerar PDF da procuração",
    };
  }
}
