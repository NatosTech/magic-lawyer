"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import {
  InvoiceStatus,
  PaymentStatus,
  TenantStatus,
  UserRole,
} from "@/app/generated/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

type Tone =
  | "primary"
  | "success"
  | "warning"
  | "secondary"
  | "danger"
  | "default";

type ValueFormat = "integer" | "currency" | "percentage" | "string";

function decimalToNumber(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "object" && "toString" in (value as Record<string, unknown>)) {
    const parsed = Number((value as { toString(): string }).toString());

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export interface AdminDashboardStat {
  id: string;
  label: string;
  helper?: string;
  value: number;
  tone: Tone;
  format?: ValueFormat;
  icon: string;
}

export interface AdminTrendPoint {
  id: string;
  label: string;
  value: number;
  previous?: number;
  format?: ValueFormat;
}

export interface AdminTenantHighlight {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  users: number;
  processos: number;
  clientes: number;
  revenue90d: number;
  revenue30d: number;
  pendingInvoices: number;
  plan?: {
    name: string;
    billing: "mensal" | "anual" | "custom";
    price?: number;
    currency?: string;
  } | null;
}

export interface AdminTenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  email: string | null;
  telefone: string | null;
  domain: string | null;
  users: number;
  processos: number;
  clientes: number;
  activeSinceDays: number;
}

export interface AdminDashboardAlert {
  id: string;
  title: string;
  description: string;
  tone: Tone;
  icon?: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
  summary: string;
}

export interface AdminDashboardData {
  stats: AdminDashboardStat[];
  revenueSeries: AdminTrendPoint[];
  tenantGrowthSeries: AdminTrendPoint[];
  userGrowthSeries: AdminTrendPoint[];
  topTenants: AdminTenantHighlight[];
  latestTenants: AdminTenantSummary[];
  alerts: AdminDashboardAlert[];
  auditLog: AdminAuditEntry[];
  totals: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    cancelledTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalClientes: number;
    totalProcessos: number;
    totalRevenueAllTime: number;
    revenueLast30Days: number;
    outstandingInvoices: number;
    averageRevenuePerTenant: number;
  };
}

export interface AdminDashboardResponse {
  success: boolean;
  data?: AdminDashboardData;
  error?: string;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);

  result.setMonth(result.getMonth() + months);

  return result;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

function daysBetween(a: Date, b: Date) {
  const diffMs = Math.abs(b.getTime() - a.getTime());

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function generateMonthlySeries(
  months: number,
  now: Date,
  generator: (start: Date, end: Date) => Promise<number>,
  format?: ValueFormat,
): Promise<AdminTrendPoint[]> {
  const series: AdminTrendPoint[] = [];
  let previous: number | undefined;

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const start = startOfMonth(addMonths(now, -offset));
    const end = addMonths(start, 1);
    const value = await generator(start, end);

    series.push({
      id: start.toISOString(),
      label: formatMonthLabel(start),
      value,
      previous,
      format,
    });

    previous = value;
  }

  return series;
}

function buildAlerts(params: {
  suspendedTenants: number;
  cancelledTenants: number;
  outstandingInvoices: number;
  revenueSeries: AdminTrendPoint[];
}): AdminDashboardAlert[] {
  const alerts: AdminDashboardAlert[] = [];

  if (params.suspendedTenants > 0) {
    alerts.push({
      id: "suspended-tenants",
      title: "Tenants suspensos",
      description: `${params.suspendedTenants} tenant(s) estão com status suspenso. Avalie e regularize o acesso deles.`,
      tone: "warning",
      icon: "⚠️",
    });
  }

  if (params.cancelledTenants > 0) {
    alerts.push({
      id: "cancelled-tenants",
      title: "Cancelamentos recentes",
      description: `${params.cancelledTenants} tenant(s) cancelados. Verifique se é preciso uma ação comercial.`,
      tone: "danger",
      icon: "❌",
    });
  }

  if (params.outstandingInvoices > 0) {
    alerts.push({
      id: "outstanding-invoices",
      title: "Faturas em aberto",
      description: `${params.outstandingInvoices} fatura(s) abertas ou vencidas aguardando pagamento.`,
      tone: "warning",
      icon: "💳",
    });
  }

  if (params.revenueSeries.length >= 2) {
    const lastPoint = params.revenueSeries.at(-1);
    const prevPoint = params.revenueSeries.at(-2);

    if (lastPoint && prevPoint && lastPoint.value < prevPoint.value) {
      const delta = prevPoint.value - lastPoint.value;

      alerts.push({
        id: "revenue-drop",
        title: "Queda de faturamento",
        description: `Receita do último mês caiu ${delta.toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          },
        )} em relação ao mês anterior.`,
        tone: "secondary",
        icon: "📉",
      });
    }
  }

  return alerts;
}

function serializeAuditEntry(entry: {
  id: string;
  acao: string;
  entidade: string | null;
  entidadeId: string | null;
  createdAt: Date;
  dadosNovos: unknown;
}): AdminAuditEntry {
  let summary = entry.acao.replace(/_/g, " ").toLowerCase();

  if (entry.entidade) {
    summary = `${summary} • ${entry.entidade}`;
  }

  return {
    id: entry.id,
    action: entry.acao,
    entity: entry.entidade,
    entityId: entry.entidadeId,
    createdAt: entry.createdAt.toISOString(),
    summary,
  };
}

function serializeTenantSummary(tenant: {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: Date;
  email: string | null;
  telefone: string | null;
  domain: string | null;
  _count: { usuarios: number; processos: number; clientes: number };
}): AdminTenantSummary {
  const now = new Date();

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
    email: tenant.email,
    telefone: tenant.telefone,
    domain: tenant.domain,
    users: tenant._count.usuarios,
    processos: tenant._count.processos,
    clientes: tenant._count.clientes,
    activeSinceDays: daysBetween(tenant.createdAt, now),
  };
}

export async function getSuperAdminDashboardData(): Promise<AdminDashboardResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return {
      success: false,
      error: "Acesso não autorizado ao dashboard administrativo.",
    };
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      cancelledTenants,
      totalUsuarios,
      activeUsuarios,
      totalProcessos,
      totalClientes,
      outstandingInvoices,
      revenueAllTimeAgg,
      revenueLast30Agg,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED } }),
      prisma.tenant.count({ where: { status: TenantStatus.CANCELLED } }),
      prisma.usuario.count(),
      prisma.usuario.count({ where: { active: true } }),
      prisma.processo.count(),
      prisma.cliente.count(),
      prisma.fatura.count({
        where: {
          status: { in: [InvoiceStatus.ABERTA, InvoiceStatus.VENCIDA] },
        },
      }),
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        where: { status: PaymentStatus.PAGO },
      }),
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        where: {
          status: PaymentStatus.PAGO,
          confirmadoEm: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const totalRevenueAllTime = decimalToNumber(revenueAllTimeAgg._sum.valor);
    const revenueLast30Days = decimalToNumber(revenueLast30Agg._sum.valor);

    const [revenueSeries, tenantGrowthSeries, userGrowthSeries] =
      await Promise.all([
        generateMonthlySeries(
          6,
          now,
          async (start, end) => {
            const result = await prisma.pagamento.aggregate({
              _sum: { valor: true },
              where: {
                status: PaymentStatus.PAGO,
                confirmadoEm: {
                  gte: start,
                  lt: end,
                },
              },
            });

            return decimalToNumber(result._sum.valor);
          },
          "currency",
        ),
        generateMonthlySeries(6, now, (start, end) =>
          prisma.tenant.count({
            where: {
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          }),
        ),
        generateMonthlySeries(6, now, (start, end) =>
          prisma.usuario.count({
            where: {
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          }),
        ),
      ]);

    const revenueByTenant = await prisma.pagamento.groupBy({
      by: ["tenantId"],
      _sum: { valor: true },
      where: {
        status: PaymentStatus.PAGO,
        confirmadoEm: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        _sum: {
          valor: "desc",
        },
      },
      take: 5,
    });

    const tenantIds = revenueByTenant.map((item) => item.tenantId);

    const tenantsForHighlights = tenantIds.length
      ? await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          include: {
            subscription: {
              include: {
                plano: true,
              },
            },
            _count: {
              select: {
                usuarios: true,
                processos: true,
                clientes: true,
              },
            },
          },
        })
      : [];

    const revenueLast30ByTenant = await prisma.pagamento.groupBy({
      by: ["tenantId"],
      _sum: { valor: true },
      where: {
        status: PaymentStatus.PAGO,
        confirmadoEm: {
          gte: thirtyDaysAgo,
        },
        tenantId: { in: tenantIds },
      },
    });

    const pendingInvoicesByTenant = tenantIds.length
      ? await prisma.fatura.groupBy({
          by: ["tenantId"],
          _count: {
            tenantId: true,
          },
          where: {
            tenantId: { in: tenantIds },
            status: { in: [InvoiceStatus.ABERTA, InvoiceStatus.VENCIDA] },
          },
        })
      : [];

    const topTenants: AdminTenantHighlight[] = revenueByTenant.map((item) => {
      const tenant = tenantsForHighlights.find((t) => t.id === item.tenantId);

      if (!tenant) {
        return {
          id: item.tenantId,
          name: "Tenant desconhecido",
          slug: item.tenantId,
          status: TenantStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          users: 0,
          processos: 0,
          clientes: 0,
          revenue90d: decimalToNumber(item._sum.valor),
          revenue30d: 0,
          pendingInvoices: 0,
          plan: null,
        };
      }

      const revenue30Bucket = revenueLast30ByTenant.find(
        (bucket) => bucket.tenantId === tenant.id,
      );
      const pendingBucket = pendingInvoicesByTenant.find(
        (bucket) => bucket.tenantId === tenant.id,
      );

      let plan: AdminTenantHighlight["plan"] = null;

      if (tenant.subscription?.plano) {
        const plano = tenant.subscription.plano;
        let billing: "mensal" | "anual" | "custom" = "custom";
        let price: number | undefined;

        if (plano.valorMensal) {
          billing = "mensal";
          price = decimalToNumber(plano.valorMensal);
        } else if (plano.valorAnual) {
          billing = "anual";
          price = decimalToNumber(plano.valorAnual);
        }

        plan = {
          name: plano.nome,
          billing,
          price,
          currency: plano.moeda ?? "BRL",
        };
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
        users: tenant._count.usuarios,
        processos: tenant._count.processos,
        clientes: tenant._count.clientes,
        revenue90d: decimalToNumber(item._sum.valor),
        revenue30d: decimalToNumber(revenue30Bucket?._sum.valor),
        pendingInvoices: pendingBucket?._count.tenantId ?? 0,
        plan,
      };
    });

    const latestTenantsRaw = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        _count: {
          select: {
            usuarios: true,
            processos: true,
            clientes: true,
          },
        },
      },
    });

    const latestTenants = latestTenantsRaw.map(serializeTenantSummary);

    const auditLogRaw = await prisma.superAdminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        acao: true,
        entidade: true,
        entidadeId: true,
        createdAt: true,
        dadosNovos: true,
      },
    });

    const alerts = buildAlerts({
      suspendedTenants,
      cancelledTenants,
      outstandingInvoices,
      revenueSeries,
    });

    const stats: AdminDashboardStat[] = [
      {
        id: "total-tenants",
        label: "Tenants ativos",
        helper: `${activeTenants} de ${totalTenants}`,
        value: activeTenants,
        tone: "primary",
        icon: "🏢",
      },
      {
        id: "total-users",
        label: "Usuários ativos",
        helper: `${activeUsuarios} de ${totalUsuarios}`,
        value: activeUsuarios,
        tone: "secondary",
        icon: "👥",
      },
      {
        id: "revenue-30",
        label: "Receita nos últimos 30 dias",
        value: revenueLast30Days,
        tone: "success",
        format: "currency",
        icon: "💰",
      },
      {
        id: "outstanding-invoices",
        label: "Faturas em aberto",
        value: outstandingInvoices,
        tone: outstandingInvoices > 0 ? "warning" : "success",
        icon: "📄",
      },
    ];

    const averageRevenuePerTenant =
      totalTenants > 0 ? totalRevenueAllTime / totalTenants : 0;

    return {
      success: true,
      data: {
        stats,
        revenueSeries,
        tenantGrowthSeries,
        userGrowthSeries,
        topTenants,
        latestTenants,
        alerts,
        auditLog: auditLogRaw.map(serializeAuditEntry),
        totals: {
          totalTenants,
          activeTenants,
          suspendedTenants,
          cancelledTenants,
          totalUsers: totalUsuarios,
          activeUsers: activeUsuarios,
          totalClientes,
          totalProcessos,
          totalRevenueAllTime,
          revenueLast30Days,
          outstandingInvoices,
          averageRevenuePerTenant,
        },
      },
    };
  } catch (error) {
    logger.error("[admin-dashboard] erro ao carregar métricas", error);

    return {
      success: false,
      error:
        "Não foi possível carregar as métricas do dashboard administrativo.",
    };
  }
}
