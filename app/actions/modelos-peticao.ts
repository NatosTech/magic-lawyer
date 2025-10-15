"use server";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import type { ModeloPeticao } from "@/app/generated/prisma";

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ModeloPeticaoListItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  tipo: string | null;
  publico: boolean;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    peticoes: number;
  };
}

export interface ModeloPeticaoDetail extends ModeloPeticao {
  _count?: {
    peticoes: number;
  };
}

export interface ModeloPeticaoCreateInput {
  nome: string;
  descricao?: string;
  conteudo: string;
  categoria?: string;
  tipo?: string;
  variaveis?: any;
  publico?: boolean;
  ativo?: boolean;
}

export interface ModeloPeticaoUpdateInput {
  nome?: string;
  descricao?: string;
  conteudo?: string;
  categoria?: string;
  tipo?: string;
  variaveis?: any;
  publico?: boolean;
  ativo?: boolean;
}

export interface ModeloPeticaoFilters {
  search?: string;
  categoria?: string;
  tipo?: string;
  ativo?: boolean;
  publico?: boolean;
}

// ============================================
// FUNÇÕES AUXILIARES
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
// CRUD - LISTAR
// ============================================

export async function listModelosPeticao(filters: ModeloPeticaoFilters = {}): Promise<ActionResponse<ModeloPeticaoListItem[]>> {
  try {
    const tenantId = await getTenantId();

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: "insensitive" } },
        { descricao: { contains: filters.search, mode: "insensitive" } },
        { categoria: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.categoria) {
      where.categoria = filters.categoria;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters.publico !== undefined) {
      where.publico = filters.publico;
    }

    const modelos = await prisma.modeloPeticao.findMany({
      where,
      include: {
        _count: {
          select: {
            peticoes: true,
          },
        },
      },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: modelos,
    };
  } catch (error) {
    console.error("Erro ao listar modelos de petição:", error);
    return {
      success: false,
      error: "Erro ao listar modelos de petição",
    };
  }
}

// ============================================
// CRUD - BUSCAR POR ID
// ============================================

export async function getModeloPeticao(id: string): Promise<ActionResponse<ModeloPeticaoDetail>> {
  try {
    const tenantId = await getTenantId();

    const modelo = await prisma.modeloPeticao.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            peticoes: true,
          },
        },
      },
    });

    if (!modelo) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    return {
      success: true,
      data: modelo,
    };
  } catch (error) {
    console.error("Erro ao buscar modelo de petição:", error);
    return {
      success: false,
      error: "Erro ao buscar modelo de petição",
    };
  }
}

// ============================================
// CRUD - CRIAR
// ============================================

export async function createModeloPeticao(input: ModeloPeticaoCreateInput): Promise<ActionResponse<ModeloPeticao>> {
  try {
    const tenantId = await getTenantId();

    const modelo = await prisma.modeloPeticao.create({
      data: {
        tenantId,
        nome: input.nome,
        descricao: input.descricao || null,
        conteudo: input.conteudo,
        categoria: input.categoria || null,
        tipo: input.tipo || null,
        variaveis: input.variaveis || null,
        publico: input.publico ?? false,
        ativo: input.ativo ?? true,
      },
    });

    revalidatePath("/modelos-peticao");

    return {
      success: true,
      data: modelo,
    };
  } catch (error) {
    console.error("Erro ao criar modelo de petição:", error);
    return {
      success: false,
      error: "Erro ao criar modelo de petição",
    };
  }
}

// ============================================
// CRUD - ATUALIZAR
// ============================================

export async function updateModeloPeticao(id: string, input: ModeloPeticaoUpdateInput): Promise<ActionResponse<ModeloPeticao>> {
  try {
    const tenantId = await getTenantId();

    // Verificar se o modelo existe e pertence ao tenant
    const existente = await prisma.modeloPeticao.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!existente) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    const modelo = await prisma.modeloPeticao.update({
      where: { id },
      data: {
        nome: input.nome,
        descricao: input.descricao,
        conteudo: input.conteudo,
        categoria: input.categoria,
        tipo: input.tipo,
        variaveis: input.variaveis,
        publico: input.publico,
        ativo: input.ativo,
      },
    });

    revalidatePath("/modelos-peticao");
    revalidatePath(`/modelos-peticao/${id}`);

    return {
      success: true,
      data: modelo,
    };
  } catch (error) {
    console.error("Erro ao atualizar modelo de petição:", error);
    return {
      success: false,
      error: "Erro ao atualizar modelo de petição",
    };
  }
}

// ============================================
// CRUD - DELETAR (SOFT DELETE)
// ============================================

export async function deleteModeloPeticao(id: string): Promise<ActionResponse> {
  try {
    const tenantId = await getTenantId();

    // Verificar se o modelo existe e pertence ao tenant
    const existente = await prisma.modeloPeticao.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!existente) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    // Soft delete
    await prisma.modeloPeticao.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ativo: false,
      },
    });

    revalidatePath("/modelos-peticao");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao deletar modelo de petição:", error);
    return {
      success: false,
      error: "Erro ao deletar modelo de petição",
    };
  }
}

// ============================================
// AÇÕES ESPECIAIS
// ============================================

/**
 * Duplicar um modelo de petição
 */
export async function duplicateModeloPeticao(id: string): Promise<ActionResponse<ModeloPeticao>> {
  try {
    const tenantId = await getTenantId();

    const original = await prisma.modeloPeticao.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!original) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    const duplicado = await prisma.modeloPeticao.create({
      data: {
        tenantId,
        nome: `${original.nome} (Cópia)`,
        descricao: original.descricao,
        conteudo: original.conteudo,
        categoria: original.categoria,
        tipo: original.tipo,
        variaveis: original.variaveis,
        publico: false, // Cópias não são públicas por padrão
        ativo: true,
      },
    });

    revalidatePath("/modelos-peticao");

    return {
      success: true,
      data: duplicado,
    };
  } catch (error) {
    console.error("Erro ao duplicar modelo de petição:", error);
    return {
      success: false,
      error: "Erro ao duplicar modelo de petição",
    };
  }
}

/**
 * Ativar/Desativar modelo
 */
export async function toggleModeloPeticaoStatus(id: string): Promise<ActionResponse<ModeloPeticao>> {
  try {
    const tenantId = await getTenantId();

    const modelo = await prisma.modeloPeticao.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!modelo) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    const atualizado = await prisma.modeloPeticao.update({
      where: { id },
      data: {
        ativo: !modelo.ativo,
      },
    });

    revalidatePath("/modelos-peticao");

    return {
      success: true,
      data: atualizado,
    };
  } catch (error) {
    console.error("Erro ao alterar status do modelo:", error);
    return {
      success: false,
      error: "Erro ao alterar status do modelo",
    };
  }
}

/**
 * Buscar categorias únicas
 */
export async function getCategoriasModeloPeticao(): Promise<ActionResponse<string[]>> {
  try {
    const tenantId = await getTenantId();

    const modelos = await prisma.modeloPeticao.findMany({
      where: {
        tenantId,
        deletedAt: null,
        categoria: { not: null },
      },
      select: {
        categoria: true,
      },
      distinct: ["categoria"],
    });

    const categorias = modelos
      .map((m) => m.categoria)
      .filter((c): c is string => c !== null)
      .sort();

    return {
      success: true,
      data: categorias,
    };
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return {
      success: false,
      error: "Erro ao buscar categorias",
    };
  }
}

/**
 * Buscar tipos únicos
 */
export async function getTiposModeloPeticao(): Promise<ActionResponse<string[]>> {
  try {
    const tenantId = await getTenantId();

    const modelos = await prisma.modeloPeticao.findMany({
      where: {
        tenantId,
        deletedAt: null,
        tipo: { not: null },
      },
      select: {
        tipo: true,
      },
      distinct: ["tipo"],
    });

    const tipos = modelos
      .map((m) => m.tipo)
      .filter((t): t is string => t !== null)
      .sort();

    return {
      success: true,
      data: tipos,
    };
  } catch (error) {
    console.error("Erro ao buscar tipos:", error);
    return {
      success: false,
      error: "Erro ao buscar tipos",
    };
  }
}

/**
 * Processar template com variáveis
 */
export async function processarTemplate(modeloId: string, variaveis: Record<string, any>): Promise<ActionResponse<string>> {
  try {
    const tenantId = await getTenantId();

    const modelo = await prisma.modeloPeticao.findFirst({
      where: {
        id: modeloId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!modelo) {
      return {
        success: false,
        error: "Modelo de petição não encontrado",
      };
    }

    let conteudo = modelo.conteudo;

    // Substituir variáveis no formato {{variavel}}
    Object.entries(variaveis).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      conteudo = conteudo.replace(regex, String(value || ""));
    });

    return {
      success: true,
      data: conteudo,
    };
  } catch (error) {
    console.error("Erro ao processar template:", error);
    return {
      success: false,
      error: "Erro ao processar template",
    };
  }
}
