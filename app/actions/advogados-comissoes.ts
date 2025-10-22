"use server";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

// =============================================
// TYPES
// =============================================

export interface ComissaoData {
  advogadoId: string;
  advogadoNome: string;
  advogadoOAB: string;
  comissaoPadrao: number;
  comissaoAcaoGanha: number;
  comissaoHonorarios: number;
  totalProcessos: number;
  processosComComissao: number;
  valorTotalProcessos: number;
  comissaoCalculada: number;
  comissaoPaga: number;
  comissaoPendente: number;
  ultimoPagamento: Date | null;
  proximoVencimento: Date | null;
  statusComissao: "EM_DIA" | "PENDENTE" | "ATRASADO";
}

export interface ComissaoGeral {
  totalAdvogados: number;
  totalComissoesCalculadas: number;
  totalComissoesPagas: number;
  totalComissoesPendentes: number;
  comissaoMedia: number;
  advogadosEmDia: number;
  advogadosPendentes: number;
  advogadosAtrasados: number;
  proximosVencimentos: Array<{
    advogadoId: string;
    advogadoNome: string;
    valor: number;
    vencimento: Date;
  }>;
}

export interface ComissaoFilters {
  dataInicio?: Date;
  dataFim?: Date;
  statusComissao?: "EM_DIA" | "PENDENTE" | "ATRASADO";
  advogadoId?: string;
}

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// ACTIONS
// =============================================

/**
 * Busca dados de comissões de todos os advogados
 */
export async function getAdvogadosComissoes(
  filters?: ComissaoFilters,
): Promise<ActionResponse<ComissaoData[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Construir filtros
    const whereClause: any = {
      tenantId: session.user.tenantId,
      isExterno: false, // Apenas advogados internos
    };

    if (filters?.advogadoId) {
      whereClause.id = filters.advogadoId;
    }

    // Buscar advogados com seus processos
    const advogados = await prisma.advogado.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processos: {
          where: {
            ...(filters?.dataInicio || filters?.dataFim
              ? {
                  createdAt: {
                    ...(filters.dataInicio && { gte: filters.dataInicio }),
                    ...(filters.dataFim && { lte: filters.dataFim }),
                  },
                }
              : {}),
          },
        },
      },
    });

    // Calcular dados de comissão
    const comissaoData: ComissaoData[] = advogados.map((advogado) => {
      const processos = advogado.processos;
      const totalProcessos = processos.length;
      const processosComComissao = processos.filter(
        (p) => p.valorCausa && p.valorCausa > 0,
      ).length;

      // Calcular valor total dos processos
      const valorTotalProcessos = processos.reduce((sum, processo) => {
        return sum + (processo.valorCausa || 0);
      }, 0);

      // Calcular comissão baseada no valor dos processos
      const comissaoCalculada =
        valorTotalProcessos * (advogado.comissaoPadrao / 100);

      // Simular comissão paga (70% da calculada) e pendente (30%)
      const comissaoPaga = comissaoCalculada * 0.7;
      const comissaoPendente = comissaoCalculada * 0.3;

      // Determinar status da comissão
      let statusComissao: "EM_DIA" | "PENDENTE" | "ATRASADO" = "EM_DIA";

      if (comissaoPendente > 0) {
        statusComissao = "PENDENTE";
        // Se há comissão pendente há mais de 30 dias, considerar atrasado
        const ultimoProcesso = processos.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0];

        if (
          ultimoProcesso &&
          Date.now() - ultimoProcesso.createdAt.getTime() >
            30 * 24 * 60 * 60 * 1000
        ) {
          statusComissao = "ATRASADO";
        }
      }

      // Simular datas de pagamento
      const ultimoPagamento =
        processos.length > 0
          ? new Date(
              processos[0].createdAt.getTime() + 15 * 24 * 60 * 60 * 1000,
            ) // 15 dias após o processo
          : null;

      const proximoVencimento =
        processos.length > 0
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias a partir de agora
          : null;

      return {
        advogadoId: advogado.id,
        advogadoNome:
          `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() ||
          advogado.usuario?.email ||
          "Advogado",
        advogadoOAB:
          advogado.oabNumero && advogado.oabUf
            ? `${advogado.oabNumero}/${advogado.oabUf}`
            : "N/A",
        comissaoPadrao: parseFloat(advogado.comissaoPadrao.toString()),
        comissaoAcaoGanha: parseFloat(advogado.comissaoAcaoGanha.toString()),
        comissaoHonorarios: parseFloat(advogado.comissaoHonorarios.toString()),
        totalProcessos,
        processosComComissao,
        valorTotalProcessos,
        comissaoCalculada: Math.round(comissaoCalculada * 100) / 100,
        comissaoPaga: Math.round(comissaoPaga * 100) / 100,
        comissaoPendente: Math.round(comissaoPendente * 100) / 100,
        ultimoPagamento,
        proximoVencimento,
        statusComissao,
      };
    });

    // Aplicar filtro de status se especificado
    const filteredData = filters?.statusComissao
      ? comissaoData.filter(
          (item) => item.statusComissao === filters.statusComissao,
        )
      : comissaoData;

    // Ordenar por comissão calculada (descendente)
    filteredData.sort((a, b) => b.comissaoCalculada - a.comissaoCalculada);

    return { success: true, data: filteredData };
  } catch (error) {
    console.error("Erro ao buscar comissões dos advogados:", error);

    return { success: false, error: "Erro ao buscar dados de comissões" };
  }
}

/**
 * Busca dados de comissões de um advogado específico
 */
export async function getAdvogadoComissoes(
  advogadoId: string,
  filters?: ComissaoFilters,
): Promise<ActionResponse<ComissaoData>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const result = await getAdvogadosComissoes({
      ...filters,
      advogadoId,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: false, error: "Advogado não encontrado" };
    }

    return { success: true, data: result.data[0] };
  } catch (error) {
    console.error("Erro ao buscar comissões do advogado:", error);

    return { success: false, error: "Erro ao buscar dados de comissões" };
  }
}

/**
 * Busca estatísticas gerais de comissões do escritório
 */
export async function getComissoesGeral(
  filters?: ComissaoFilters,
): Promise<ActionResponse<ComissaoGeral>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const result = await getAdvogadosComissoes(filters);

    if (!result.success || !result.data) {
      return { success: false, error: "Erro ao buscar dados de comissões" };
    }

    const data = result.data;
    const totalAdvogados = data.length;
    const totalComissoesCalculadas = data.reduce(
      (sum, adv) => sum + adv.comissaoCalculada,
      0,
    );
    const totalComissoesPagas = data.reduce(
      (sum, adv) => sum + adv.comissaoPaga,
      0,
    );
    const totalComissoesPendentes = data.reduce(
      (sum, adv) => sum + adv.comissaoPendente,
      0,
    );
    const comissaoMedia =
      totalAdvogados > 0 ? totalComissoesCalculadas / totalAdvogados : 0;

    const advogadosEmDia = data.filter(
      (adv) => adv.statusComissao === "EM_DIA",
    ).length;
    const advogadosPendentes = data.filter(
      (adv) => adv.statusComissao === "PENDENTE",
    ).length;
    const advogadosAtrasados = data.filter(
      (adv) => adv.statusComissao === "ATRASADO",
    ).length;

    // Próximos vencimentos (top 5)
    const proximosVencimentos = data
      .filter((adv) => adv.proximoVencimento && adv.comissaoPendente > 0)
      .sort(
        (a, b) =>
          a.proximoVencimento!.getTime() - b.proximoVencimento!.getTime(),
      )
      .slice(0, 5)
      .map((adv) => ({
        advogadoId: adv.advogadoId,
        advogadoNome: adv.advogadoNome,
        valor: adv.comissaoPendente,
        vencimento: adv.proximoVencimento!,
      }));

    return {
      success: true,
      data: {
        totalAdvogados,
        totalComissoesCalculadas:
          Math.round(totalComissoesCalculadas * 100) / 100,
        totalComissoesPagas: Math.round(totalComissoesPagas * 100) / 100,
        totalComissoesPendentes:
          Math.round(totalComissoesPendentes * 100) / 100,
        comissaoMedia: Math.round(comissaoMedia * 100) / 100,
        advogadosEmDia,
        advogadosPendentes,
        advogadosAtrasados,
        proximosVencimentos,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar comissões gerais:", error);

    return {
      success: false,
      error: "Erro ao buscar estatísticas gerais de comissões",
    };
  }
}
