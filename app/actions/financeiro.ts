"use server";

import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

// ==================== TIPOS ====================

export type EstatisticasFinanceiras = {
  receitaTotal: number;
  receitaMensal: number;
  receitaAnual: number;
  totalAssinaturas: number;
  assinaturasAtivas: number;
  assinaturasInadimplentes: number;
  totalFaturas: number;
  faturasPagas: number;
  faturasPendentes: number;
  faturasVencidas: number;
  totalPagamentos: number;
  pagamentosConfirmados: number;
  comissoesPendentes: number;
  comissoesPagas: number;
};

export type ResumoMensal = {
  mes: string;
  receita: number;
  assinaturas: number;
  faturas: number;
  pagamentos: number;
};

export type TopTenants = {
  id: string;
  name: string;
  receitaTotal: number;
  assinaturasAtivas: number;
  status: string;
};

export type FaturaResumo = {
  id: string;
  numero: string;
  tenant: {
    name: string;
    slug: string;
  };
  valor: number;
  status: string;
  vencimento?: Date;
  pagoEm?: Date;
  createdAt: Date;
};

export type PagamentoResumo = {
  id: string;
  fatura: {
    numero: string;
    tenant: {
      name: string;
    };
  };
  valor: number;
  status: string;
  metodo: string;
  confirmadoEm?: Date;
  createdAt: Date;
};

export type ComissaoResumo = {
  id: string;
  advogado: {
    nome: string;
    oab: string;
  };
  pagamento: {
    valor: number;
    fatura: {
      numero: string;
      tenant: {
        name: string;
      };
    };
  };
  valorComissao: number;
  percentualComissao: number;
  status: string;
  dataPagamento?: Date;
  createdAt: Date;
};

// ==================== FUNÇÕES AUXILIARES ====================

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN") {
    throw new Error("Acesso negado. Apenas Super Admins podem acessar dados financeiros.");
  }

  return session.user.id;
}

// ==================== ESTATÍSTICAS FINANCEIRAS ====================

export async function getEstatisticasFinanceiras(): Promise<{
  success: boolean;
  data?: EstatisticasFinanceiras;
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Receita total (soma de todos os pagamentos confirmados)
    const receitaTotalResult = await prisma.pagamento.aggregate({
      where: {
        status: "PAGO",
      },
      _sum: {
        valor: true,
      },
    });

    // Receita mensal
    const receitaMensalResult = await prisma.pagamento.aggregate({
      where: {
        status: "PAGO",
        confirmadoEm: {
          gte: startOfMonth,
        },
      },
      _sum: {
        valor: true,
      },
    });

    // Receita anual
    const receitaAnualResult = await prisma.pagamento.aggregate({
      where: {
        status: "PAGO",
        confirmadoEm: {
          gte: startOfYear,
        },
      },
      _sum: {
        valor: true,
      },
    });

    // Assinaturas
    const [totalAssinaturas, assinaturasAtivas, assinaturasInadimplentes] = await Promise.all([
      prisma.tenantSubscription.count(),
      prisma.tenantSubscription.count({ where: { status: "ATIVA" } }),
      prisma.tenantSubscription.count({ where: { status: "INADIMPLENTE" } }),
    ]);

    // Faturas
    const [totalFaturas, faturasPagas, faturasPendentes, faturasVencidas] = await Promise.all([
      prisma.fatura.count(),
      prisma.fatura.count({ where: { status: "PAGA" } }),
      prisma.fatura.count({ where: { status: "ABERTA" } }),
      prisma.fatura.count({ where: { status: "VENCIDA" } }),
    ]);

    // Pagamentos
    const [totalPagamentos, pagamentosConfirmados] = await Promise.all([prisma.pagamento.count(), prisma.pagamento.count({ where: { status: "PAGO" } })]);

    // Comissões
    const [comissoesPendentes, comissoesPagas] = await Promise.all([prisma.pagamentoComissao.count({ where: { status: "PENDENTE" } }), prisma.pagamentoComissao.count({ where: { status: "PAGO" } })]);

    const estatisticas: EstatisticasFinanceiras = {
      receitaTotal: Number(receitaTotalResult._sum.valor || 0),
      receitaMensal: Number(receitaMensalResult._sum.valor || 0),
      receitaAnual: Number(receitaAnualResult._sum.valor || 0),
      totalAssinaturas,
      assinaturasAtivas,
      assinaturasInadimplentes,
      totalFaturas,
      faturasPagas,
      faturasPendentes,
      faturasVencidas,
      totalPagamentos,
      pagamentosConfirmados,
      comissoesPendentes,
      comissoesPagas,
    };

    return {
      success: true,
      data: estatisticas,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas financeiras:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== RESUMO MENSAL ====================

export async function getResumoMensal(): Promise<{
  success: boolean;
  data?: ResumoMensal[];
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const now = new Date();
    const meses = [];

    // Últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const [receitaResult, assinaturasResult, faturasResult, pagamentosResult] = await Promise.all([
        prisma.pagamento.aggregate({
          where: {
            status: "PAGO",
            confirmadoEm: {
              gte: date,
              lt: nextMonth,
            },
          },
          _sum: {
            valor: true,
          },
        }),
        prisma.tenantSubscription.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth,
            },
          },
        }),
        prisma.fatura.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth,
            },
          },
        }),
        prisma.pagamento.count({
          where: {
            confirmadoEm: {
              gte: date,
              lt: nextMonth,
            },
          },
        }),
      ]);

      meses.push({
        mes: date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        receita: Number(receitaResult._sum.valor || 0),
        assinaturas: assinaturasResult,
        faturas: faturasResult,
        pagamentos: pagamentosResult,
      });
    }

    return {
      success: true,
      data: meses,
    };
  } catch (error) {
    console.error("Erro ao buscar resumo mensal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== TOP TENANTS ====================

export async function getTopTenants(): Promise<{
  success: boolean;
  data?: TopTenants[];
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: {
            faturas: {
              include: {
                pagamentos: {
                  where: {
                    status: "PAGO",
                  },
                },
              },
            },
          },
        },
      },
    });

    const tenantsComReceita = tenants.map((tenant) => {
      const receitaTotal = tenant.subscription
        ? tenant.subscription.faturas.reduce((fatTotal: number, fatura: any) => {
            return (
              fatTotal +
              fatura.pagamentos.reduce((pagTotal: number, pagamento: any) => {
                return pagTotal + Number(pagamento.valor);
              }, 0)
            );
          }, 0)
        : 0;

      const assinaturasAtivas = tenant.subscription && tenant.subscription.status === "ATIVA" ? 1 : 0;

      return {
        id: tenant.id,
        name: tenant.name,
        receitaTotal,
        assinaturasAtivas,
        status: tenant.status,
      };
    });

    // Ordenar por receita total (decrescente) e pegar top 10
    const topTenants = tenantsComReceita.sort((a, b) => b.receitaTotal - a.receitaTotal).slice(0, 10);

    return {
      success: true,
      data: topTenants,
    };
  } catch (error) {
    console.error("Erro ao buscar top tenants:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FATURAS RECENTES ====================

export async function getFaturasRecentes(): Promise<{
  success: boolean;
  data?: FaturaResumo[];
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const faturas = await prisma.fatura.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const faturasResumo: FaturaResumo[] = faturas.map((fatura) => ({
      id: fatura.id,
      numero: fatura.numero || `#${fatura.id.slice(-8)}`,
      tenant: {
        name: fatura.tenant.name,
        slug: fatura.tenant.slug,
      },
      valor: Number(fatura.valor),
      status: fatura.status,
      vencimento: fatura.vencimento || undefined,
      pagoEm: fatura.pagoEm || undefined,
      createdAt: fatura.createdAt,
    }));

    return {
      success: true,
      data: faturasResumo,
    };
  } catch (error) {
    console.error("Erro ao buscar faturas recentes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== PAGAMENTOS RECENTES ====================

export async function getPagamentosRecentes(): Promise<{
  success: boolean;
  data?: PagamentoResumo[];
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const pagamentos = await prisma.pagamento.findMany({
      include: {
        fatura: {
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const pagamentosResumo: PagamentoResumo[] = pagamentos.map((pagamento) => ({
      id: pagamento.id,
      fatura: {
        numero: pagamento.fatura.numero || `#${pagamento.fatura.id.slice(-8)}`,
        tenant: {
          name: pagamento.fatura.tenant.name,
        },
      },
      valor: Number(pagamento.valor),
      status: pagamento.status,
      metodo: pagamento.metodo || "N/A",
      confirmadoEm: pagamento.confirmadoEm || undefined,
      createdAt: pagamento.createdAt,
    }));

    return {
      success: true,
      data: pagamentosResumo,
    };
  } catch (error) {
    console.error("Erro ao buscar pagamentos recentes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== COMISSÕES PENDENTES ====================

export async function getComissoesPendentes(): Promise<{
  success: boolean;
  data?: ComissaoResumo[];
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const comissoes = await prisma.pagamentoComissao.findMany({
      where: {
        status: "PENDENTE",
      },
      include: {
        advogado: {
          select: {
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
        pagamento: {
          include: {
            fatura: {
              include: {
                tenant: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const comissoesResumo: ComissaoResumo[] = comissoes.map((comissao: any) => ({
      id: comissao.id,
      advogado: {
        nome: `${comissao.advogado.usuario.firstName} ${comissao.advogado.usuario.lastName}`,
        oab: `${comissao.advogado.oabNumero}/${comissao.advogado.oabUf}`,
      },
      pagamento: {
        valor: Number(comissao.pagamento.valor),
        fatura: {
          numero: comissao.pagamento.fatura.numero || `#${comissao.pagamento.fatura.id.slice(-8)}`,
          tenant: {
            name: comissao.pagamento.fatura.tenant.name,
          },
        },
      },
      valorComissao: Number(comissao.valorComissao),
      percentualComissao: Number(comissao.percentualComissao),
      status: comissao.status,
      dataPagamento: comissao.dataPagamento || undefined,
      createdAt: comissao.createdAt,
    }));

    return {
      success: true,
      data: comissoesResumo,
    };
  } catch (error) {
    console.error("Erro ao buscar comissões pendentes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
