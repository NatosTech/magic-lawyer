"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { TipoFeriado } from "@/app/generated/prisma";

// ============================================
// TIPOS
// ============================================

export interface FeriadoFilters {
  tipo?: TipoFeriado;
  uf?: string;
  municipio?: string;
  ano?: number;
  tribunalId?: string;
  searchTerm?: string;
}

export interface FeriadoCreateInput {
  nome: string;
  data: Date;
  tipo: TipoFeriado;
  tribunalId?: string;
  uf?: string;
  municipio?: string;
  descricao?: string;
  recorrente?: boolean;
}

export interface FeriadoUpdateInput {
  nome?: string;
  data?: Date;
  tipo?: TipoFeriado;
  tribunalId?: string;
  uf?: string;
  municipio?: string;
  descricao?: string;
  recorrente?: boolean;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// VALIDAÇÃO DE TENANT
// ============================================

async function getTenantId(): Promise<string | null> {
  const session = await getSession();

  // Feriados podem ser globais (tenantId null) ou específicos do tenant
  return session?.user?.tenantId || null;
}

// ============================================
// LISTAGEM
// ============================================

export async function listFeriados(
  filters: FeriadoFilters,
): Promise<ActionResponse<any[]>> {
  try {
    const tenantId = await getTenantId();

    const where: any = {
      OR: [{ tenantId: tenantId }, { tenantId: null }], // Feriados do tenant ou globais
    };

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.uf) {
      where.uf = filters.uf;
    }

    if (filters.municipio) {
      where.municipio = filters.municipio;
    }

    if (filters.tribunalId) {
      where.tribunalId = filters.tribunalId;
    }

    if (filters.ano) {
      const startOfYear = new Date(filters.ano, 0, 1);
      const endOfYear = new Date(filters.ano, 11, 31, 23, 59, 59);

      where.data = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (filters.searchTerm) {
      where.OR = [
        { nome: { contains: filters.searchTerm, mode: "insensitive" } },
        { descricao: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    const feriados = await prisma.feriado.findMany({
      where,
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            uf: true,
          },
        },
      },
      orderBy: {
        data: "asc",
      },
    });

    return {
      success: true,
      data: feriados,
    };
  } catch (error: any) {
    console.error("Erro ao listar feriados:", error);

    return {
      success: false,
      error: error.message || "Erro ao listar feriados",
    };
  }
}

// ============================================
// BUSCAR INDIVIDUAL
// ============================================

export async function getFeriado(
  feriadoId: string,
): Promise<ActionResponse<any>> {
  try {
    const feriado = await prisma.feriado.findUnique({
      where: { id: feriadoId },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            uf: true,
          },
        },
      },
    });

    if (!feriado) {
      return {
        success: false,
        error: "Feriado não encontrado",
      };
    }

    return {
      success: true,
      data: feriado,
    };
  } catch (error: any) {
    console.error("Erro ao buscar feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar feriado",
    };
  }
}

// ============================================
// CRIAR FERIADO
// ============================================

export async function createFeriado(
  input: FeriadoCreateInput,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();

    const feriado = await prisma.feriado.create({
      data: {
        tenantId,
        nome: input.nome,
        data: input.data,
        tipo: input.tipo,
        tribunalId: input.tribunalId,
        uf: input.uf,
        municipio: input.municipio,
        descricao: input.descricao,
        recorrente: input.recorrente !== undefined ? input.recorrente : true,
      },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    revalidatePath("/configuracoes/feriados");

    return {
      success: true,
      data: feriado,
    };
  } catch (error: any) {
    console.error("Erro ao criar feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao criar feriado",
    };
  }
}

// ============================================
// ATUALIZAR FERIADO
// ============================================

export async function updateFeriado(
  feriadoId: string,
  input: FeriadoUpdateInput,
): Promise<ActionResponse<any>> {
  try {
    const feriado = await prisma.feriado.update({
      where: { id: feriadoId },
      data: {
        nome: input.nome,
        data: input.data,
        tipo: input.tipo,
        tribunalId: input.tribunalId,
        uf: input.uf,
        municipio: input.municipio,
        descricao: input.descricao,
        recorrente: input.recorrente,
      },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    revalidatePath("/configuracoes/feriados");

    return {
      success: true,
      data: feriado,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao atualizar feriado",
    };
  }
}

// ============================================
// EXCLUIR FERIADO
// ============================================

export async function deleteFeriado(
  feriadoId: string,
): Promise<ActionResponse<null>> {
  try {
    await prisma.feriado.delete({
      where: { id: feriadoId },
    });

    revalidatePath("/configuracoes/feriados");

    return {
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.error("Erro ao excluir feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao excluir feriado",
    };
  }
}

// ============================================
// DASHBOARD/MÉTRICAS
// ============================================

export async function getDashboardFeriados(
  ano?: number,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const anoFiltro = ano || new Date().getFullYear();

    const startOfYear = new Date(anoFiltro, 0, 1);
    const endOfYear = new Date(anoFiltro, 11, 31, 23, 59, 59);

    const where: any = {
      OR: [{ tenantId: tenantId }, { tenantId: null }],
      data: {
        gte: startOfYear,
        lte: endOfYear,
      },
    };

    const [total, porTipo, proximosFeriados] = await Promise.all([
      prisma.feriado.count({ where }),
      prisma.feriado.groupBy({
        by: ["tipo"],
        where,
        _count: true,
      }),
      prisma.feriado.findMany({
        where: {
          ...where,
          data: {
            gte: new Date(),
          },
        },
        take: 5,
        orderBy: { data: "asc" },
        include: {
          tribunal: {
            select: {
              nome: true,
              sigla: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        porTipo,
        proximosFeriados,
        ano: anoFiltro,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar dashboard de feriados:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar dashboard de feriados",
    };
  }
}

// ============================================
// VERIFICAR SE DIA É FERIADO
// ============================================

export async function isDiaFeriado(
  data: Date,
  uf?: string,
  municipio?: string,
  tribunalId?: string,
): Promise<ActionResponse<boolean>> {
  try {
    const tenantId = await getTenantId();

    const where: any = {
      OR: [{ tenantId: tenantId }, { tenantId: null }],
      data: {
        gte: new Date(data.getFullYear(), data.getMonth(), data.getDate()),
        lt: new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1),
      },
    };

    if (uf) {
      where.OR.push({ uf: uf }, { uf: null });
    }

    if (municipio) {
      where.OR.push({ municipio: municipio }, { municipio: null });
    }

    if (tribunalId) {
      where.OR.push({ tribunalId: tribunalId }, { tribunalId: null });
    }

    const feriado = await prisma.feriado.findFirst({ where });

    return {
      success: true,
      data: !!feriado,
    };
  } catch (error: any) {
    console.error("Erro ao verificar feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao verificar feriado",
    };
  }
}

// ============================================
// IMPORTAR FERIADOS NACIONAIS
// ============================================

const feriadosNacionais2025 = [
  { nome: "Confraternização Universal", data: new Date(2025, 0, 1) },
  { nome: "Carnaval", data: new Date(2025, 2, 4) },
  { nome: "Sexta-feira Santa", data: new Date(2025, 3, 18) },
  { nome: "Tiradentes", data: new Date(2025, 3, 21) },
  { nome: "Dia do Trabalho", data: new Date(2025, 4, 1) },
  { nome: "Corpus Christi", data: new Date(2025, 5, 19) },
  { nome: "Independência do Brasil", data: new Date(2025, 8, 7) },
  { nome: "Nossa Senhora Aparecida", data: new Date(2025, 9, 12) },
  { nome: "Finados", data: new Date(2025, 10, 2) },
  { nome: "Proclamação da República", data: new Date(2025, 10, 15) },
  { nome: "Dia da Consciência Negra", data: new Date(2025, 10, 20) },
  { nome: "Natal", data: new Date(2025, 11, 25) },
];

export async function importarFeriadosNacionais(
  ano: number,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();

    const feriadosDoAno = feriadosNacionais2025.map((f) => ({
      ...f,
      data: new Date(ano, f.data.getMonth(), f.data.getDate()),
    }));

    const feriadosCriados = [];

    for (const feriado of feriadosDoAno) {
      // Verificar se já existe
      const existe = await prisma.feriado.findFirst({
        where: {
          OR: [{ tenantId: tenantId }, { tenantId: null }],
          data: feriado.data,
          tipo: "NACIONAL",
        },
      });

      if (!existe) {
        const criado = await prisma.feriado.create({
          data: {
            tenantId,
            nome: feriado.nome,
            data: feriado.data,
            tipo: "NACIONAL",
            recorrente: true,
            descricao: "Feriado nacional importado automaticamente",
          },
        });

        feriadosCriados.push(criado);
      }
    }

    revalidatePath("/configuracoes/feriados");

    return {
      success: true,
      data: {
        total: feriadosCriados.length,
        feriados: feriadosCriados,
      },
    };
  } catch (error: any) {
    console.error("Erro ao importar feriados nacionais:", error);

    return {
      success: false,
      error: error.message || "Erro ao importar feriados nacionais",
    };
  }
}

// ============================================
// TIPOS DE FERIADO
// ============================================

export async function getTiposFeriado(): Promise<
  ActionResponse<TipoFeriado[]>
> {
  try {
    const tipos: TipoFeriado[] = [
      "NACIONAL",
      "ESTADUAL",
      "MUNICIPAL",
      "JUDICIARIO",
    ];

    return {
      success: true,
      data: tipos,
    };
  } catch (error: any) {
    console.error("Erro ao buscar tipos de feriado:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar tipos de feriado",
    };
  }
}
