"use server";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

// =============================================
// TYPES
// =============================================

export interface AdvogadoPerformanceData {
  advogadoId: string;
  advogadoNome: string;
  advogadoOAB: string;
  totalProcessos: number;
  processosAtivos: number;
  processosFinalizados: number;
  processosVencidos: number;
  totalComissoes: number;
  comissaoMedia: number;
  processosPorMes: Array<{
    mes: string;
    quantidade: number;
  }>;
  especialidades: string[];
  tempoMedioProcesso: number; // em dias
  taxaSucesso: number; // porcentagem
  ultimaAtividade: Date | null;
}

export interface PerformanceFilters {
  dataInicio?: Date;
  dataFim?: Date;
  especialidade?: string;
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
 * Busca dados de performance de todos os advogados
 */
export async function getAdvogadosPerformance(
  filters?: PerformanceFilters,
): Promise<ActionResponse<AdvogadoPerformanceData[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Construir filtros de data
    const whereClause: any = {
      tenantId: session.user.tenantId,
      isExterno: false, // Apenas advogados internos
    };

    if (filters?.dataInicio || filters?.dataFim) {
      whereClause.createdAt = {};
      if (filters.dataInicio) {
        whereClause.createdAt.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        whereClause.createdAt.lte = filters.dataFim;
      }
    }

    if (filters?.especialidade) {
      whereClause.especialidades = {
        has: filters.especialidade,
      };
    }

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
          include: {
            movimentacoes: {
              orderBy: {
                dataMovimentacao: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    // Calcular métricas de performance
    const performanceData: AdvogadoPerformanceData[] = advogados.map(
      (advogado) => {
        const processos = advogado.processos;
        const totalProcessos = processos.length;
        const processosAtivos = processos.filter(
          (p) => p.status === "EM_ANDAMENTO",
        ).length;
        const processosFinalizados = processos.filter(
          (p) => p.status === "ENCERRADO",
        ).length;
        const processosVencidos = processos.filter(
          (p) => p.status === "SUSPENSO",
        ).length;

        // Calcular comissões
        const totalComissoes = processos.reduce((sum, processo) => {
          return (
            sum +
            (processo.valorCausa
              ? Number(processo.valorCausa) *
                (Number(advogado.comissaoPadrao) / 100)
              : 0)
          );
        }, 0);

        const comissaoMedia =
          totalProcessos > 0 ? totalComissoes / totalProcessos : 0;

        // Calcular processos por mês (últimos 12 meses)
        const processosPorMes = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();

          date.setMonth(date.getMonth() - i);
          const mes = date.toISOString().slice(0, 7); // YYYY-MM

          const quantidade = processos.filter((p) => {
            const processoMes = p.createdAt.toISOString().slice(0, 7);

            return processoMes === mes;
          }).length;

          return { mes, quantidade };
        }).reverse();

        // Calcular tempo médio de processo
        const processosComDataFim = processos.filter((p) => p.updatedAt);
        const tempoMedioProcesso =
          processosComDataFim.length > 0
            ? processosComDataFim.reduce((sum, processo) => {
                const dias = Math.ceil(
                  (processo.updatedAt.getTime() -
                    processo.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                return sum + dias;
              }, 0) / processosComDataFim.length
            : 0;

        // Calcular taxa de sucesso (processos finalizados vs total)
        const taxaSucesso =
          totalProcessos > 0
            ? (processosFinalizados / totalProcessos) * 100
            : 0;

        // Última atividade
        const ultimaAtividade =
          processos.length > 0
            ? processos.reduce((latest, processo) => {
                const ultimoAndamento = processo.movimentacoes[0];

                if (
                  ultimoAndamento &&
                  ultimoAndamento.dataMovimentacao > latest
                ) {
                  return ultimoAndamento.dataMovimentacao;
                }

                return latest;
              }, processos[0].createdAt)
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
          totalProcessos,
          processosAtivos,
          processosFinalizados,
          processosVencidos,
          totalComissoes,
          comissaoMedia,
          processosPorMes,
          especialidades: advogado.especialidades as string[],
          tempoMedioProcesso: Math.round(tempoMedioProcesso),
          taxaSucesso: Math.round(taxaSucesso * 100) / 100,
          ultimaAtividade,
        };
      },
    );

    // Ordenar por total de processos (descendente)
    performanceData.sort((a, b) => b.totalProcessos - a.totalProcessos);

    return { success: true, data: performanceData };
  } catch (error) {
    console.error("Erro ao buscar performance dos advogados:", error);

    return { success: false, error: "Erro ao buscar dados de performance" };
  }
}

/**
 * Busca dados de performance de um advogado específico
 */
export async function getAdvogadoPerformance(
  advogadoId: string,
  filters?: PerformanceFilters,
): Promise<ActionResponse<AdvogadoPerformanceData>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const result = await getAdvogadosPerformance({
      ...filters,
      advogadoId,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: false, error: "Advogado não encontrado" };
    }

    return { success: true, data: result.data[0] };
  } catch (error) {
    console.error("Erro ao buscar performance do advogado:", error);

    return { success: false, error: "Erro ao buscar dados de performance" };
  }
}

/**
 * Busca estatísticas gerais de performance do escritório
 */
export async function getPerformanceGeral(
  filters?: PerformanceFilters,
): Promise<
  ActionResponse<{
    totalAdvogados: number;
    totalProcessos: number;
    processosAtivos: number;
    processosFinalizados: number;
    taxaSucessoGeral: number;
    comissaoTotal: number;
    comissaoMedia: number;
    tempoMedioProcesso: number;
    topPerformers: Array<{
      advogadoId: string;
      advogadoNome: string;
      totalProcessos: number;
      taxaSucesso: number;
    }>;
  }>
> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const result = await getAdvogadosPerformance(filters);

    if (!result.success || !result.data) {
      return { success: false, error: "Erro ao buscar dados de performance" };
    }

    const data = result.data;
    const totalAdvogados = data.length;
    const totalProcessos = data.reduce(
      (sum, adv) => sum + adv.totalProcessos,
      0,
    );
    const processosAtivos = data.reduce(
      (sum, adv) => sum + adv.processosAtivos,
      0,
    );
    const processosFinalizados = data.reduce(
      (sum, adv) => sum + adv.processosFinalizados,
      0,
    );
    const taxaSucessoGeral =
      totalProcessos > 0 ? (processosFinalizados / totalProcessos) * 100 : 0;
    const comissaoTotal = data.reduce(
      (sum, adv) => sum + adv.totalComissoes,
      0,
    );
    const comissaoMedia =
      totalAdvogados > 0 ? comissaoTotal / totalAdvogados : 0;
    const tempoMedioProcesso =
      data.length > 0
        ? data.reduce((sum, adv) => sum + adv.tempoMedioProcesso, 0) /
          data.length
        : 0;

    // Top 5 performers por taxa de sucesso
    const topPerformers = data
      .filter((adv) => adv.totalProcessos > 0)
      .sort((a, b) => b.taxaSucesso - a.taxaSucesso)
      .slice(0, 5)
      .map((adv) => ({
        advogadoId: adv.advogadoId,
        advogadoNome: adv.advogadoNome,
        totalProcessos: adv.totalProcessos,
        taxaSucesso: adv.taxaSucesso,
      }));

    return {
      success: true,
      data: {
        totalAdvogados,
        totalProcessos,
        processosAtivos,
        processosFinalizados,
        taxaSucessoGeral: Math.round(taxaSucessoGeral * 100) / 100,
        comissaoTotal,
        comissaoMedia: Math.round(comissaoMedia * 100) / 100,
        tempoMedioProcesso: Math.round(tempoMedioProcesso),
        topPerformers,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar performance geral:", error);

    return { success: false, error: "Erro ao buscar estatísticas gerais" };
  }
}
