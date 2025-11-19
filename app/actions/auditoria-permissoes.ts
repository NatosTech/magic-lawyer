"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { UserRole } from "@/app/generated/prisma";

export interface PermissaoNegadaData {
  id: string;
  createdAt: Date;
  usuario: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  modulo: string;
  acao: string;
  origem: "override" | "cargo" | "role";
  role: string;
  cargoId?: string | null;
  cargoNome?: string | null;
}

export interface PermissoesNegadasResponse {
  success: boolean;
  data?: PermissaoNegadaData[];
  total?: number;
  error?: string;
}

/**
 * Busca histórico de permissões negadas para auditoria
 */
export async function getPermissoesNegadas(filters?: {
  usuarioId?: string;
  modulo?: string;
  acao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  origem?: "override" | "cargo" | "role";
  limit?: number;
  offset?: number;
}): Promise<PermissoesNegadasResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Apenas ADMIN pode ver auditoria de permissões
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Apenas administradores podem acessar auditoria de permissões",
      };
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const where: any = {
      tenantId: session.user.tenantId,
      acao: "permissao_negada",
    };

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.createdAt = {};
      if (filters.dataInicio) {
        where.createdAt.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.createdAt.lte = filters.dataFim;
      }
    }

    // Buscar todos e filtrar no código (Prisma não suporta filtros JSON complexos facilmente)
    // Alternativamente, poderíamos usar raw SQL, mas por agora vamos buscar tudo e filtrar

    // Buscar histórico
    const historico = await prisma.equipeHistorico.findMany({
      where,
      include: {
        usuario: {
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

    // Transformar e filtrar por módulo/ação/origem no código
    let data: PermissaoNegadaData[] = historico.map((h) => {
      const dadosNovos = h.dadosNovos as any;

      return {
        id: h.id,
        createdAt: h.createdAt,
        usuario: {
          id: h.usuario.id,
          firstName: h.usuario.firstName,
          lastName: h.usuario.lastName,
          email: h.usuario.email,
        },
        modulo: dadosNovos?.modulo || "desconhecido",
        acao: dadosNovos?.acao || "desconhecido",
        origem: dadosNovos?.origem || "role",
        role: dadosNovos?.role || "desconhecido",
        cargoId: dadosNovos?.cargoId || null,
        cargoNome: null, // Pode ser buscado separadamente se necessário
      };
    });

    // Aplicar filtros de módulo/ação/origem
    if (filters?.modulo) {
      data = data.filter((d) => d.modulo === filters.modulo);
    }
    if (filters?.acao) {
      data = data.filter((d) => d.acao === filters.acao);
    }
    if (filters?.origem) {
      data = data.filter((d) => d.origem === filters.origem);
    }

    // Contar total após filtros
    const total = data.length;

    // Aplicar paginação
    data = data.slice(offset, offset + limit);

    return {
      success: true,
      data,
      total,
    };
  } catch (error) {
    console.error("Erro ao buscar permissões negadas:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar permissões negadas",
    };
  }
}

/**
 * Busca métricas agregadas de permissões negadas
 */
export async function getMetricasPermissoesNegadas(): Promise<{
  success: boolean;
  data?: {
    totalNegadas: number;
    porModulo: Record<string, number>;
    porAcao: Record<string, number>;
    porOrigem: Record<string, number>;
    porUsuario: Array<{ usuarioId: string; nome: string; total: number }>;
    ultimas24h: number;
  };
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Apenas administradores podem acessar métricas",
      };
    }

    const vinteQuatroHorasAtras = new Date();

    vinteQuatroHorasAtras.setHours(vinteQuatroHorasAtras.getHours() - 24);

    const [totalNegadas, ultimas24h, historico] = await Promise.all([
      prisma.equipeHistorico.count({
        where: {
          tenantId: session.user.tenantId,
          acao: "permissao_negada",
        },
      }),
      prisma.equipeHistorico.count({
        where: {
          tenantId: session.user.tenantId,
          acao: "permissao_negada",
          createdAt: {
            gte: vinteQuatroHorasAtras,
          },
        },
      }),
      prisma.equipeHistorico.findMany({
        where: {
          tenantId: session.user.tenantId,
          acao: "permissao_negada",
        },
        select: {
          dadosNovos: true,
          usuarioId: true,
          usuario: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    // Agregar métricas
    const porModulo: Record<string, number> = {};
    const porAcao: Record<string, number> = {};
    const porOrigem: Record<string, number> = {};
    const porUsuarioMap: Record<
      string,
      { usuarioId: string; nome: string; total: number }
    > = {};

    historico.forEach((h) => {
      const dados = h.dadosNovos as any;

      // Por módulo
      const modulo = dados?.modulo || "desconhecido";

      porModulo[modulo] = (porModulo[modulo] || 0) + 1;

      // Por ação
      const acao = dados?.acao || "desconhecido";

      porAcao[acao] = (porAcao[acao] || 0) + 1;

      // Por origem
      const origem = dados?.origem || "role";

      porOrigem[origem] = (porOrigem[origem] || 0) + 1;

      // Por usuário
      const usuarioId = h.usuarioId ?? "sem-id";
      const nomeUsuario =
        `${h.usuario.firstName || ""} ${h.usuario.lastName || ""}`.trim() ||
        "Sem nome";

      if (!porUsuarioMap[usuarioId]) {
        porUsuarioMap[usuarioId] = {
          usuarioId,
          nome: nomeUsuario,
          total: 0,
        };
      }
      porUsuarioMap[usuarioId].total++;
    });

    const porUsuario = Object.values(porUsuarioMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    return {
      success: true,
      data: {
        totalNegadas,
        porModulo,
        porAcao,
        porOrigem,
        porUsuario,
        ultimas24h,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar métricas",
    };
  }
}
