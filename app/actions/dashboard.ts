"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import {
  ContratoParcelaStatus,
  ContratoStatus,
  DocumentoAssinaturaStatus,
  EventoStatus,
  EventoTipo,
  InvoiceStatus,
  PaymentStatus,
  ProcessoStatus,
  SubscriptionStatus,
  TarefaStatus,
  TicketStatus,
  UserRole,
} from "@/app/generated/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

export type Tone =
  | "primary"
  | "success"
  | "warning"
  | "secondary"
  | "danger"
  | "default";

export type StatFormat = "integer" | "currency" | "percentage" | "string";

export interface DashboardStatDto {
  id: string;
  label: string;
  value: number | string;
  format?: StatFormat;
  helper?: string;
  tone: Tone;
  icon: string;
}

export interface DashboardInsightDto {
  id: string;
  title: string;
  description: string;
  detail?: string;
  tone: Tone;
  icon: string;
}

export interface DashboardListItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  tone?: Tone;
  href?: string;
  date?: string;
}

export interface DashboardTrend {
  id: string;
  label: string;
  value: number;
  previous?: number;
  format?: StatFormat;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  tone: Tone;
  icon?: string;
  href?: string;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: string;
  tone?: Tone;
  href?: string;
}

export interface DashboardData {
  role: UserRole | null;
  stats: DashboardStatDto[];
  insights: DashboardInsightDto[];
  highlights: DashboardListItem[];
  pending: DashboardListItem[];
  trends: DashboardTrend[];
  alerts: DashboardAlert[];
  activity: DashboardActivity[];
}

interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day + 6) % 7; // convert to Monday as start

  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWeek(date: Date) {
  const result = new Date(date);

  result.setDate(result.getDate() + 7);
  result.setHours(0, 0, 0, 0);

  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
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

async function generateMonthlySeries(
  months: number,
  now: Date,
  generator: (start: Date, end: Date) => Promise<number>,
  format?: StatFormat,
): Promise<DashboardTrend[]> {
  const series: DashboardTrend[] = [];
  let previousValue: number | undefined;

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const start = startOfMonth(addMonths(now, -offset));
    const end = addMonths(start, 1);
    const rawValue = await generator(start, end);
    const value = Number(rawValue) || 0;

    series.push({
      id: start.toISOString(),
      label: formatMonthLabel(start),
      value,
      previous: previousValue,
      format,
    });

    previousValue = value;
  }

  return series;
}

function formatCountHelper(value: number, label: string) {
  return value > 0 ? `${value} ${label}` : undefined;
}

async function buildSuperAdminDashboard(now: Date): Promise<DashboardData> {
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = addDays(now, -30);

  const [
    totalTenants,
    activeTenants,
    newTenantsMonth,
    totalUsers,
    totalClientes,
    totalAdvogados,
    revenueTotalAgg,
    revenue30DaysAgg,
    revenueYearAgg,
    overdueInvoices,
    subscriptionsInadimplentes,
    ticketsEmAberto,
    tenantMaisUsuarios,
    tenantMaisRecente,
    latestTenants,
    criticalTickets,
    superAdminLogs,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { createdAt: { gte: startMonth } } }),
    prisma.usuario.count({ where: { active: true } }),
    prisma.cliente.count({ where: { deletedAt: null } }),
    prisma.advogado.count(),
    prisma.pagamento.aggregate({
      where: { status: PaymentStatus.PAGO },
      _sum: { valor: true },
    }),
    prisma.pagamento.aggregate({
      where: {
        status: PaymentStatus.PAGO,
        confirmadoEm: { gte: thirtyDaysAgo },
      },
      _sum: { valor: true },
    }),
    prisma.pagamento.aggregate({
      where: {
        status: PaymentStatus.PAGO,
        confirmadoEm: { gte: startYear },
      },
      _sum: { valor: true },
    }),
    prisma.fatura.count({ where: { status: InvoiceStatus.VENCIDA } }),
    prisma.tenantSubscription.count({
      where: { status: SubscriptionStatus.INADIMPLENTE },
    }),
    prisma.ticket.count({
      where: {
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      },
    }),
    prisma.tenant.findFirst({
      orderBy: { usuarios: { _count: "desc" } },
      select: {
        name: true,
        slug: true,
        _count: { select: { usuarios: true } },
      },
    }),
    prisma.tenant.findFirst({
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.ticket.findMany({
      where: {
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        tenant: { select: { name: true } },
      },
    }),
    prisma.superAdminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        acao: true,
        entidade: true,
        entidadeId: true,
        createdAt: true,
      },
    }),
  ]);

  const revenueTotal = Number(revenueTotalAgg._sum.valor || 0);
  const revenue30dias = Number(revenue30DaysAgg._sum.valor || 0);
  const revenueAno = Number(revenueYearAgg._sum.valor || 0);
  const activeRatio =
    totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;

  const stats: DashboardStatDto[] = [
    {
      id: "total-tenants",
      label: "Tenants cadastrados",
      value: totalTenants,
      format: "integer",
      helper:
        newTenantsMonth > 0
          ? `+${newTenantsMonth} no mês`
          : "Sem novos tenants neste mês",
      tone: "primary",
      icon: "🏢",
    },
    {
      id: "ativos",
      label: "Tenants ativos",
      value: activeTenants,
      format: "integer",
      helper: `${activeRatio}% da base ativa`,
      tone: activeTenants === totalTenants ? "success" : "secondary",
      icon: "✅",
    },
    {
      id: "usuarios",
      label: "Usuários ativos",
      value: totalUsers,
      format: "integer",
      helper: `${totalAdvogados} advogados • ${totalClientes} clientes`,
      tone: "secondary",
      icon: "👥",
    },
    {
      id: "receita-30d",
      label: "Receita (30 dias)",
      value: revenue30dias,
      format: "currency",
      helper: `Acumulado anual: R$ ${revenueAno.toLocaleString("pt-BR")}`,
      tone: "warning",
      icon: "💰",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "inadimplencia",
      title:
        subscriptionsInadimplentes > 0
          ? "Tenants inadimplentes"
          : "Planos em dia",
      description:
        subscriptionsInadimplentes > 0
          ? `${subscriptionsInadimplentes} escritórios precisam de atenção no faturamento`
          : "Nenhum tenant com pendências de assinatura",
      tone: subscriptionsInadimplentes > 0 ? "warning" : "success",
      icon: subscriptionsInadimplentes > 0 ? "⚠️" : "✅",
    },
    {
      id: "faturas",
      title: overdueInvoices > 0 ? "Faturas vencidas" : "Cobranças em dia",
      description:
        overdueInvoices > 0
          ? `${overdueInvoices} faturas aguardando ação do financeiro`
          : "Nenhuma fatura vencida neste momento",
      tone: overdueInvoices > 0 ? "danger" : "success",
      icon: overdueInvoices > 0 ? "📄" : "🧾",
    },
    {
      id: "suporte",
      title: ticketsEmAberto > 0 ? "Chamados em andamento" : "Suporte zerado",
      description:
        ticketsEmAberto > 0
          ? `${ticketsEmAberto} tickets aguardam retorno da equipe`
          : "Nenhum chamado pendente no momento",
      tone: ticketsEmAberto > 0 ? "secondary" : "success",
      icon: ticketsEmAberto > 0 ? "💬" : "🎉",
      detail:
        tenantMaisUsuarios && tenantMaisUsuarios._count.usuarios > 0
          ? `Maior tenant: ${tenantMaisUsuarios.name} (${tenantMaisUsuarios._count.usuarios} usuários ativos)`
          : tenantMaisRecente
            ? `Último tenant: ${tenantMaisRecente.name}`
            : undefined,
    },
  ];

  const revenueSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) => {
      const aggregate = await prisma.pagamento.aggregate({
        where: {
          status: PaymentStatus.PAGO,
          confirmadoEm: {
            gte: start,
            lt: end,
          },
        },
        _sum: { valor: true },
      });

      return Number(aggregate._sum.valor || 0);
    },
    "currency",
  );

  const alerts: DashboardAlert[] = [];

  if (subscriptionsInadimplentes > 0) {
    alerts.push({
      id: "alert-inadimplentes",
      title: "Tenants inadimplentes",
      description: `${subscriptionsInadimplentes} escritórios estão com assinatura atrasada.`,
      tone: "warning",
      icon: "⚠️",
      href: "/admin/financeiro",
    });
  }

  if (overdueInvoices > 0) {
    alerts.push({
      id: "alert-faturas",
      title: "Faturas vencidas",
      description: `${overdueInvoices} faturas corporativas aguardam ação do time financeiro.`,
      tone: "danger",
      icon: "📄",
      href: "/admin/financeiro",
    });
  }

  if (ticketsEmAberto > 10) {
    alerts.push({
      id: "alert-suporte",
      title: "Suporte sobrecarregado",
      description: `${ticketsEmAberto} chamados globais aguardam resposta. Avalie reforçar o suporte.`,
      tone: "secondary",
      icon: "💬",
      href: "/admin/suporte",
    });
  }

  const activity: DashboardActivity[] = superAdminLogs.map((log) => ({
    id: log.id,
    title: log.acao,
    description: `${log.entidade}${log.entidadeId ? ` #${log.entidadeId}` : ""}`,
    date: log.createdAt.toISOString(),
    icon: "🗂️",
    tone: "default",
  }));

  const highlights: DashboardListItem[] = latestTenants.map((tenant) => ({
    id: tenant.id,
    title: tenant.name,
    subtitle: tenant.slug,
    badge: tenant.status,
    tone: tenant.status === "ACTIVE" ? "success" : "warning",
    date: tenant.createdAt.toISOString(),
    href: `/admin/tenants/${tenant.slug}`,
  }));

  const pending: DashboardListItem[] = criticalTickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    subtitle: ticket.tenant?.name,
    badge: ticket.priority,
    tone: ticket.status === TicketStatus.IN_PROGRESS ? "warning" : "danger",
    date: ticket.createdAt.toISOString(),
    href: `/admin/suporte/${ticket.id}`,
  }));

  return {
    role: UserRole.SUPER_ADMIN,
    stats,
    insights,
    highlights,
    pending,
    trends: revenueSeries,
    alerts,
    activity,
  };
}

async function buildAdminDashboard(
  tenantId: string,
  now: Date,
): Promise<DashboardData> {
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(weekStart);
  const threeDaysAhead = addDays(now, 3);

  const [
    totalProcessos,
    processosAtivos,
    processosEncerrados,
    novosProcessosMes,
    clientesAtivos,
    novosClientesMes,
    eventosSemana,
    tarefasPendentes,
    prazosCriticos,
    documentosRecentes,
    contratosRascunho,
    assinaturasPendentes,
    upcomingEventos,
    proximosPrazos,
    recentEventos,
    recentDocumentos,
    recentMovimentacoes,
  ] = await Promise.all([
    prisma.processo.count({
      where: { tenantId, deletedAt: null },
    }),
    prisma.processo.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: [ProcessoStatus.EM_ANDAMENTO, ProcessoStatus.SUSPENSO] },
      },
    }),
    prisma.processo.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: [ProcessoStatus.ENCERRADO, ProcessoStatus.ARQUIVADO] },
      },
    }),
    prisma.processo.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: startMonth },
      },
    }),
    prisma.cliente.count({
      where: { tenantId, deletedAt: null },
    }),
    prisma.cliente.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: startMonth } },
    }),
    prisma.evento.count({
      where: {
        tenantId,
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
        dataInicio: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    }),
    prisma.tarefa.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: [TarefaStatus.PENDENTE, TarefaStatus.EM_ANDAMENTO] },
      },
    }),
    prisma.processoPrazo.count({
      where: {
        tenantId,
        status: "ABERTO",
        dataVencimento: {
          gte: now,
          lte: threeDaysAhead,
        },
      },
    }),
    prisma.documento.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: startMonth },
      },
    }),
    prisma.contrato.count({
      where: {
        tenantId,
        deletedAt: null,
        status: ContratoStatus.RASCUNHO,
      },
    }),
    prisma.documentoAssinatura.count({
      where: {
        tenantId,
        status: DocumentoAssinaturaStatus.PENDENTE,
      },
    }),
    prisma.evento.findMany({
      where: {
        tenantId,
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
        dataInicio: {
          gte: now,
          lt: addDays(now, 7),
        },
      },
      orderBy: { dataInicio: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataInicio: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.processoPrazo.findMany({
      where: {
        tenantId,
        status: "ABERTO",
      },
      orderBy: { dataVencimento: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataVencimento: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.evento.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        dataInicio: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.documento.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nome: true,
        createdAt: true,
        processo: { select: { id: true, numero: true } },
        cliente: { select: { nome: true } },
      },
    }),
    prisma.movimentacaoProcesso.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        processo: { select: { id: true, numero: true } },
      },
    }),
  ]);

  const stats: DashboardStatDto[] = [
    {
      id: "processos-ativos",
      label: "Processos ativos",
      value: processosAtivos,
      format: "integer",
      helper: `${processosEncerrados} encerrados • +${novosProcessosMes} no mês`,
      tone: "primary",
      icon: "📂",
    },
    {
      id: "clientes",
      label: "Clientes",
      value: clientesAtivos,
      format: "integer",
      helper:
        novosClientesMes > 0
          ? `+${novosClientesMes} novos cadastros`
          : "Sem novos clientes neste mês",
      tone: "success",
      icon: "🤝",
    },
    {
      id: "eventos-semana",
      label: "Agenda da semana",
      value: eventosSemana,
      format: "integer",
      helper: formatCountHelper(documentosRecentes, "documentos novos"),
      tone: eventosSemana > 0 ? "warning" : "secondary",
      icon: "🗓️",
    },
    {
      id: "tarefas",
      label: "Tarefas em andamento",
      value: tarefasPendentes,
      format: "integer",
      helper: formatCountHelper(contratosRascunho, "contratos aguardando"),
      tone: tarefasPendentes > 0 ? "danger" : "success",
      icon: "⏱️",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "prazos",
      title:
        prazosCriticos > 0
          ? "Prazos para os próximos 3 dias"
          : "Prazos controlados",
      description:
        prazosCriticos > 0
          ? `${prazosCriticos} prazos precisam de atenção imediata`
          : "Nenhum prazo crítico até agora",
      tone: prazosCriticos > 0 ? "danger" : "success",
      icon: prazosCriticos > 0 ? "⚠️" : "✅",
    },
    {
      id: "contratos",
      title:
        contratosRascunho > 0
          ? "Contratos aguardando aprovação"
          : "Contratos em dia",
      description:
        contratosRascunho > 0
          ? `${contratosRascunho} contratos estão em rascunho`
          : "Nenhum contrato pendente no momento",
      tone: contratosRascunho > 0 ? "warning" : "success",
      icon: contratosRascunho > 0 ? "📝" : "📄",
    },
    {
      id: "documentos",
      title:
        documentosRecentes > 0 ? "Documentos recentes" : "Sem novos documentos",
      description:
        documentosRecentes > 0
          ? `${documentosRecentes} documentos foram adicionados este mês`
          : "Nenhum documento novo desde o início do mês",
      tone: documentosRecentes > 0 ? "secondary" : "default",
      icon: "📁",
    },
  ];

  const processSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.processo.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const revenueSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) => {
      const aggregate = await prisma.pagamento.aggregate({
        where: {
          tenantId,
          status: PaymentStatus.PAGO,
          confirmadoEm: {
            gte: start,
            lt: end,
          },
        },
        _sum: { valor: true },
      });

      return Number(aggregate._sum.valor || 0);
    },
    "currency",
  );

  const alerts: DashboardAlert[] = [];

  if (prazosCriticos > 0) {
    alerts.push({
      id: "alert-prazos",
      title: "Prazos críticos",
      description: `${prazosCriticos} prazos vencem nos próximos dias.`,
      tone: "danger",
      icon: "⏳",
      href: "/processos",
    });
  }

  if (contratosRascunho > 0) {
    alerts.push({
      id: "alert-contratos",
      title: "Contratos aguardando",
      description: `${contratosRascunho} contratos permanecem em rascunho.`,
      tone: "warning",
      icon: "📝",
      href: "/contratos",
    });
  }

  if (assinaturasPendentes > 5) {
    alerts.push({
      id: "alert-assinaturas",
      title: "Assinaturas pendentes",
      description: `${assinaturasPendentes} documentos aguardam assinatura digital.`,
      tone: "secondary",
      icon: "🖋️",
      href: "/documentos",
    });
  }

  const activity: DashboardActivity[] = [
    ...recentEventos.map((evento) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      description: evento.processo?.numero
        ? `Evento relacionado ao processo ${evento.processo.numero}`
        : "Evento registrado",
      date: (evento.createdAt ?? evento.dataInicio ?? now).toISOString(),
      icon: "🗓️",
      href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
    })),
    ...recentDocumentos.map((documento) => ({
      id: `documento-${documento.id}`,
      title: documento.nome,
      description: documento.cliente?.nome
        ? `Documento do cliente ${documento.cliente.nome}`
        : "Documento enviado",
      date: documento.createdAt.toISOString(),
      icon: "📁",
      href: documento.processo
        ? `/processos/${documento.processo.id}`
        : undefined,
    })),
    ...recentMovimentacoes.map((movimentacao) => ({
      id: `movimentacao-${movimentacao.id}`,
      title: movimentacao.titulo,
      description: movimentacao.processo?.numero
        ? `Movimentação no processo ${movimentacao.processo.numero}`
        : "Movimentação registrada",
      date: movimentacao.createdAt.toISOString(),
      icon: "⚖️",
      href: movimentacao.processo
        ? `/processos/${movimentacao.processo.id}`
        : undefined,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const highlights: DashboardListItem[] = upcomingEventos.map((evento) => ({
    id: evento.id,
    title: evento.titulo,
    subtitle: evento.processo?.numero,
    date: evento.dataInicio?.toISOString(),
    tone: "secondary",
    href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
  }));

  const pending: DashboardListItem[] = proximosPrazos.map((prazo) => ({
    id: prazo.id,
    title: prazo.titulo,
    subtitle: prazo.processo?.numero,
    date: prazo.dataVencimento?.toISOString(),
    tone: prazo.dataVencimento <= threeDaysAhead ? "danger" : "warning",
    href: prazo.processo ? `/processos/${prazo.processo.id}` : undefined,
  }));

  const trends = [
    ...processSeries.map((trend) => ({
      ...trend,
      id: `process-${trend.id}`,
      label: `Processos ${trend.label}`,
    })),
    ...revenueSeries.map((trend) => ({
      ...trend,
      id: `receita-${trend.id}`,
      label: `Receita ${trend.label}`,
    })),
  ];

  return {
    role: UserRole.ADMIN,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
  };
}

async function buildAdvogadoDashboard(
  tenantId: string,
  userId: string,
  now: Date,
): Promise<DashboardData> {
  const advogado = await prisma.advogado.findUnique({
    where: { usuarioId: userId },
    select: { id: true },
  });

  if (!advogado) {
    return {
      role: UserRole.ADVOGADO,
      stats: [],
      insights: [],
      highlights: [],
      pending: [],
      trends: [],
      alerts: [],
      activity: [],
    };
  }

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(weekStart);
  const tomorrow = addDays(now, 1);

  const [
    processosAtivos,
    processosTotal,
    clientesRelacionados,
    audienciasSemana,
    tarefasPendentes,
    assinaturasPendentes,
    prazos24h,
    proximoEvento,
    eventosProximos,
    tarefasDetalhes,
    documentosRecentes,
    movimentacoesRecentes,
  ] = await Promise.all([
    prisma.processo.count({
      where: {
        tenantId,
        deletedAt: null,
        advogadoResponsavelId: advogado.id,
        status: { in: [ProcessoStatus.EM_ANDAMENTO, ProcessoStatus.SUSPENSO] },
      },
    }),
    prisma.processo.count({
      where: {
        tenantId,
        deletedAt: null,
        advogadoResponsavelId: advogado.id,
      },
    }),
    prisma.advogadoCliente.count({
      where: { tenantId, advogadoId: advogado.id },
    }),
    prisma.evento.count({
      where: {
        tenantId,
        advogadoResponsavelId: advogado.id,
        dataInicio: {
          gte: weekStart,
          lt: weekEnd,
        },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
        tipo: EventoTipo.AUDIENCIA,
      },
    }),
    prisma.tarefa.count({
      where: {
        tenantId,
        deletedAt: null,
        responsavelId: userId,
        status: { in: [TarefaStatus.PENDENTE, TarefaStatus.EM_ANDAMENTO] },
      },
    }),
    prisma.documentoAssinatura.count({
      where: {
        tenantId,
        advogadoResponsavelId: advogado.id,
        status: DocumentoAssinaturaStatus.PENDENTE,
      },
    }),
    prisma.processoPrazo.count({
      where: {
        tenantId,
        responsavelId: userId,
        status: "ABERTO",
        dataVencimento: {
          gte: now,
          lte: tomorrow,
        },
      },
    }),
    prisma.evento.findFirst({
      where: {
        tenantId,
        advogadoResponsavelId: advogado.id,
        dataInicio: { gte: now },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
      orderBy: { dataInicio: "asc" },
      select: { titulo: true, dataInicio: true },
    }),
    prisma.evento.findMany({
      where: {
        tenantId,
        advogadoResponsavelId: advogado.id,
        dataInicio: { gte: now, lt: weekEnd },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
      orderBy: { dataInicio: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataInicio: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.tarefa.findMany({
      where: {
        tenantId,
        responsavelId: userId,
        status: { in: [TarefaStatus.PENDENTE, TarefaStatus.EM_ANDAMENTO] },
      },
      orderBy: { dataLimite: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataLimite: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.documento.findMany({
      where: {
        tenantId,
        deletedAt: null,
        uploadedById: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nome: true,
        createdAt: true,
        processo: { select: { id: true, numero: true } },
        cliente: { select: { nome: true } },
      },
    }),
    prisma.movimentacaoProcesso.findMany({
      where: {
        tenantId,
        criadoPorId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        processo: { select: { id: true, numero: true } },
      },
    }),
  ]);

  const stats: DashboardStatDto[] = [
    {
      id: "processos",
      label: "Processos ativos",
      value: processosAtivos,
      format: "integer",
      helper: `${processosTotal} processos sob sua gestão`,
      tone: "primary",
      icon: "⚖️",
    },
    {
      id: "clientes",
      label: "Clientes atendidos",
      value: clientesRelacionados,
      format: "integer",
      helper:
        tarefasPendentes > 0
          ? `${tarefasPendentes} tarefas abertas`
          : undefined,
      tone: "success",
      icon: "👩‍💼",
    },
    {
      id: "audiencias",
      label: "Audiências na semana",
      value: audienciasSemana,
      format: "integer",
      helper: formatCountHelper(assinaturasPendentes, "assinaturas pendentes"),
      tone: audienciasSemana > 0 ? "warning" : "secondary",
      icon: "📅",
    },
    {
      id: "documentos",
      label: "Assinaturas a acompanhar",
      value: assinaturasPendentes,
      format: "integer",
      helper: prazos24h > 0 ? `${prazos24h} prazos vencem em 24h` : undefined,
      tone: assinaturasPendentes > 0 ? "danger" : "success",
      icon: "🖋️",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "prazos",
      title: prazos24h > 0 ? "Prazos nas próximas 24h" : "Sem prazos urgentes",
      description:
        prazos24h > 0
          ? `${prazos24h} prazos precisam de ação até amanhã`
          : "Nenhum prazo crítico para hoje",
      tone: prazos24h > 0 ? "danger" : "success",
      icon: prazos24h > 0 ? "⏳" : "✅",
    },
    {
      id: "proximo-evento",
      title: proximoEvento ? "Próximo compromisso" : "Agenda livre",
      description: proximoEvento
        ? `${proximoEvento.titulo} em ${proximoEvento.dataInicio.toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}`
        : "Nenhum evento agendado a partir de hoje",
      tone: proximoEvento ? "secondary" : "default",
      icon: "🗓️",
    },
    {
      id: "tarefas",
      title:
        tarefasPendentes > 0 ? "Checklist em andamento" : "Tarefas concluídas",
      description:
        tarefasPendentes > 0
          ? `${tarefasPendentes} tarefas aguardando conclusão`
          : "Nenhuma tarefa pendente",
      tone: tarefasPendentes > 0 ? "warning" : "success",
      icon: tarefasPendentes > 0 ? "✅" : "🎉",
    },
  ];

  const ownProcessSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.processo.count({
        where: {
          tenantId,
          deletedAt: null,
          advogadoResponsavelId: advogado.id,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const assinaturaSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.documentoAssinatura.count({
        where: {
          tenantId,
          advogadoResponsavelId: advogado.id,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const alerts: DashboardAlert[] = [];

  if (prazos24h > 0) {
    alerts.push({
      id: "adv-alert-prazos",
      title: "Prazos urgentes",
      description: `${prazos24h} prazos vencem até amanhã.`,
      tone: "danger",
      icon: "⏳",
      href: "/processos",
    });
  }

  if (assinaturasPendentes > 0) {
    alerts.push({
      id: "adv-alert-assinaturas",
      title: "Assinaturas pendentes",
      description: `${assinaturasPendentes} assinaturas aguardam clientes ou partes.`,
      tone: "warning",
      icon: "🖋️",
      href: "/documentos",
    });
  }

  if (tarefasPendentes > 0) {
    alerts.push({
      id: "adv-alert-tarefas",
      title: "Tarefas abertas",
      description: `${tarefasPendentes} tarefas estão em sua fila.`,
      tone: "secondary",
      icon: "🗂️",
      href: "/agenda",
    });
  }

  const activity: DashboardActivity[] = [
    ...eventosProximos.map((evento) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      description: evento.processo?.numero
        ? `Audiência do processo ${evento.processo.numero}`
        : "Audiência agendada",
      date: evento.dataInicio?.toISOString() ?? now.toISOString(),
      icon: "📅",
      href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
    })),
    ...tarefasDetalhes.map((tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      title: tarefa.titulo,
      description: tarefa.processo?.numero
        ? `Tarefa vinculada ao processo ${tarefa.processo.numero}`
        : "Tarefa atribuída",
      date: tarefa.dataLimite
        ? tarefa.dataLimite.toISOString()
        : now.toISOString(),
      icon: "🗂️",
      href: tarefa.processo ? `/processos/${tarefa.processo.id}` : undefined,
    })),
    ...documentosRecentes.map((doc) => ({
      id: `doc-${doc.id}`,
      title: doc.nome,
      description: doc.cliente?.nome
        ? `Documento enviado para ${doc.cliente.nome}`
        : "Documento anexado",
      date: doc.createdAt.toISOString(),
      icon: "📁",
      href: doc.processo ? `/processos/${doc.processo.id}` : undefined,
    })),
    ...movimentacoesRecentes.map((mov) => ({
      id: `mov-${mov.id}`,
      title: mov.titulo,
      description: mov.processo?.numero
        ? `Movimentação do processo ${mov.processo.numero}`
        : "Movimentação registrada",
      date: mov.createdAt.toISOString(),
      icon: "⚖️",
      href: mov.processo ? `/processos/${mov.processo.id}` : undefined,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const highlights: DashboardListItem[] = eventosProximos.map((evento) => ({
    id: evento.id,
    title: evento.titulo,
    subtitle: evento.processo?.numero,
    date: evento.dataInicio?.toISOString(),
    tone: "secondary",
    href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
  }));

  const pending: DashboardListItem[] = tarefasDetalhes.map((tarefa) => ({
    id: tarefa.id,
    title: tarefa.titulo,
    subtitle: tarefa.processo?.numero,
    date: tarefa.dataLimite ? tarefa.dataLimite.toISOString() : undefined,
    tone:
      tarefa.dataLimite && tarefa.dataLimite <= tomorrow ? "danger" : "warning",
    href: tarefa.processo ? `/processos/${tarefa.processo.id}` : undefined,
  }));

  const trends = [
    ...ownProcessSeries.map((trend) => ({
      ...trend,
      id: `meus-processos-${trend.id}`,
      label: `Processos ${trend.label}`,
    })),
    ...assinaturaSeries.map((trend) => ({
      ...trend,
      id: `assinaturas-${trend.id}`,
      label: `Assinaturas ${trend.label}`,
    })),
  ];

  return {
    role: UserRole.ADVOGADO,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
  };
}

async function buildFinanceiroDashboard(
  tenantId: string,
  now: Date,
): Promise<DashboardData> {
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);

  const [
    receitaMesAgg,
    receitaAnoAgg,
    faturasAbertas,
    faturasVencidas,
    parcelasPendentes,
    parcelasAtrasadas,
    pagamentosPendentes,
    pagamentosConfirmadosAgg,
    faturasPendentesDetalhes,
    parcelasPendentesDetalhes,
    pagamentosRecentes,
    faturasRecentes,
  ] = await Promise.all([
    prisma.pagamento.aggregate({
      where: {
        tenantId,
        status: PaymentStatus.PAGO,
        confirmadoEm: { gte: startMonth },
      },
      _sum: { valor: true },
    }),
    prisma.pagamento.aggregate({
      where: {
        tenantId,
        status: PaymentStatus.PAGO,
        confirmadoEm: { gte: startYear },
      },
      _sum: { valor: true },
    }),
    prisma.fatura.count({
      where: { tenantId, status: InvoiceStatus.ABERTA },
    }),
    prisma.fatura.count({
      where: { tenantId, status: InvoiceStatus.VENCIDA },
    }),
    prisma.contratoParcela.count({
      where: {
        tenantId,
        status: ContratoParcelaStatus.PENDENTE,
      },
    }),
    prisma.contratoParcela.count({
      where: {
        tenantId,
        status: ContratoParcelaStatus.ATRASADA,
      },
    }),
    prisma.pagamento.count({
      where: {
        tenantId,
        status: { in: [PaymentStatus.PENDENTE, PaymentStatus.PROCESSANDO] },
      },
    }),
    prisma.pagamento.aggregate({
      where: { tenantId, status: PaymentStatus.PAGO },
      _sum: { valor: true },
    }),
    prisma.fatura.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.ABERTA, InvoiceStatus.VENCIDA] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        numero: true,
        status: true,
        valor: true,
        vencimento: true,
      },
    }),
    prisma.contratoParcela.findMany({
      where: {
        tenantId,
        status: {
          in: [ContratoParcelaStatus.PENDENTE, ContratoParcelaStatus.ATRASADA],
        },
      },
      orderBy: { dataVencimento: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        numeroParcela: true,
        valor: true,
        dataVencimento: true,
        status: true,
        contrato: { select: { titulo: true, id: true } },
      },
    }),
    prisma.pagamento.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        valor: true,
        status: true,
        metodo: true,
        confirmadoEm: true,
        createdAt: true,
        fatura: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    }),
    prisma.fatura.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        numero: true,
        status: true,
        valor: true,
        createdAt: true,
      },
    }),
  ]);

  const receitaMes = Number(receitaMesAgg._sum.valor || 0);
  const receitaAno = Number(receitaAnoAgg._sum.valor || 0);
  const recebimentosTotais = Number(pagamentosConfirmadosAgg._sum.valor || 0);

  const stats: DashboardStatDto[] = [
    {
      id: "receita-mes",
      label: "Receita do mês",
      value: receitaMes,
      format: "currency",
      helper: `Ano: R$ ${receitaAno.toLocaleString("pt-BR")}`,
      tone: "primary",
      icon: "💵",
    },
    {
      id: "faturas",
      label: "Faturas abertas",
      value: faturasAbertas,
      format: "integer",
      helper: formatCountHelper(faturasVencidas, "faturas vencidas"),
      tone: faturasVencidas > 0 ? "warning" : "success",
      icon: "📄",
    },
    {
      id: "parcelas",
      label: "Parcelas pendentes",
      value: parcelasPendentes,
      format: "integer",
      helper: formatCountHelper(parcelasAtrasadas, "atrasadas"),
      tone: parcelasPendentes > 0 ? "secondary" : "success",
      icon: "🧾",
    },
    {
      id: "pagamentos",
      label: "Pagamentos em processamento",
      value: pagamentosPendentes,
      format: "integer",
      helper: `Recebido total: R$ ${recebimentosTotais.toLocaleString("pt-BR")}`,
      tone: pagamentosPendentes > 0 ? "warning" : "success",
      icon: "🏦",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "inadimplencia",
      title:
        faturasVencidas > 0 ? "Cobranças em atraso" : "Sem faturas vencidas",
      description:
        faturasVencidas > 0
          ? `${faturasVencidas} faturas exigem ação na cobrança`
          : "Nenhuma fatura vencida neste momento",
      tone: faturasVencidas > 0 ? "danger" : "success",
      icon: faturasVencidas > 0 ? "⚠️" : "✅",
    },
    {
      id: "parcelas",
      title:
        parcelasAtrasadas > 0
          ? "Parcelas de honorários em atraso"
          : "Parcelas em dia",
      description:
        parcelasAtrasadas > 0
          ? `${parcelasAtrasadas} parcelas precisam de follow-up`
          : "Nenhuma parcela atrasada para contratos de honorários",
      tone: parcelasAtrasadas > 0 ? "warning" : "success",
      icon: parcelasAtrasadas > 0 ? "📊" : "💼",
    },
    {
      id: "cashflow",
      title: "Fluxo de caixa",
      description: `Recebimentos totais confirmados: R$ ${recebimentosTotais.toLocaleString("pt-BR")}`,
      tone: "secondary",
      icon: "📈",
    },
  ];

  const receitaSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) => {
      const aggregate = await prisma.pagamento.aggregate({
        where: {
          tenantId,
          status: PaymentStatus.PAGO,
          confirmadoEm: {
            gte: start,
            lt: end,
          },
        },
        _sum: { valor: true },
      });

      return Number(aggregate._sum.valor || 0);
    },
    "currency",
  );

  const faturaSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.fatura.count({
        where: {
          tenantId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const alerts: DashboardAlert[] = [];

  if (faturasVencidas > 0) {
    alerts.push({
      id: "fin-alert-faturas",
      title: "Faturas vencidas",
      description: `${faturasVencidas} faturas aguardam cobrança imediata.`,
      tone: "danger",
      icon: "📄",
      href: "/financeiro",
    });
  }

  if (parcelasAtrasadas > 0) {
    alerts.push({
      id: "fin-alert-parcelas",
      title: "Parcelas atrasadas",
      description: `${parcelasAtrasadas} parcelas precisam de follow-up.`,
      tone: "warning",
      icon: "🧾",
      href: "/financeiro",
    });
  }

  if (pagamentosPendentes > 0) {
    alerts.push({
      id: "fin-alert-processando",
      title: "Pagamentos em processamento",
      description: `${pagamentosPendentes} pagamentos ainda não foram confirmados.`,
      tone: "secondary",
      icon: "🏦",
      href: "/financeiro",
    });
  }

  const activity: DashboardActivity[] = [
    ...pagamentosRecentes.map((pagamento) => ({
      id: `pagamento-${pagamento.id}`,
      title: pagamento.fatura?.numero
        ? `Pagamento ${pagamento.fatura.numero}`
        : "Pagamento registrado",
      description: `Valor: R$ ${Number(pagamento.valor).toLocaleString("pt-BR")}`,
      date: (pagamento.confirmadoEm || pagamento.createdAt).toISOString(),
      icon: pagamento.status === PaymentStatus.PAGO ? "✅" : "⏳",
      tone: (pagamento.status === PaymentStatus.PAGO
        ? "success"
        : "warning") as Tone,
      href: pagamento.fatura
        ? `/financeiro/faturas/${pagamento.fatura.id}`
        : undefined,
    })),
    ...faturasRecentes.map((fatura) => ({
      id: `fatura-${fatura.id}`,
      title: fatura.numero ?? "Fatura emitida",
      description: `Valor: R$ ${Number(fatura.valor).toLocaleString("pt-BR")}`,
      date: fatura.createdAt.toISOString(),
      icon: "📄",
      tone: (fatura.status === InvoiceStatus.VENCIDA
        ? "danger"
        : "secondary") as Tone,
      href: `/financeiro/faturas/${fatura.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const highlights: DashboardListItem[] = faturasPendentesDetalhes.map(
    (fatura) => ({
      id: fatura.id,
      title: fatura.numero ?? "Fatura sem número",
      subtitle: `Valor: R$ ${Number(fatura.valor).toLocaleString("pt-BR")}`,
      tone: fatura.status === InvoiceStatus.VENCIDA ? "danger" : "warning",
      date: fatura.vencimento ? fatura.vencimento.toISOString() : undefined,
      href: `/financeiro/faturas/${fatura.id}`,
    }),
  );

  const pending: DashboardListItem[] = parcelasPendentesDetalhes.map(
    (parcela) => ({
      id: parcela.id,
      title: parcela.titulo || `Parcela #${parcela.numeroParcela}`,
      subtitle: parcela.contrato?.titulo,
      badge: `R$ ${Number(parcela.valor).toLocaleString("pt-BR")}`,
      tone:
        parcela.status === ContratoParcelaStatus.ATRASADA
          ? "danger"
          : "warning",
      date: parcela.dataVencimento?.toISOString(),
      href: parcela.contrato ? `/contratos/${parcela.contrato.id}` : undefined,
    }),
  );

  const trends = [
    ...receitaSeries.map((trend) => ({
      ...trend,
      id: `receita-${trend.id}`,
      label: `Receita ${trend.label}`,
    })),
    ...faturaSeries.map((trend) => ({
      ...trend,
      id: `faturas-${trend.id}`,
      label: `Faturas ${trend.label}`,
    })),
  ];

  return {
    role: UserRole.FINANCEIRO,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
  };
}

async function buildSecretariaDashboard(
  tenantId: string,
  now: Date,
): Promise<DashboardData> {
  const hojeInicio = startOfDay(now);
  const hojeFim = endOfDay(now);
  const tresDias = addDays(now, 3);

  const [
    eventosHoje,
    eventosSemana,
    tarefasPendentes,
    documentosPendentes,
    prazosCriticos,
    clientesNovos,
    eventosProximos,
    documentosPendentesDetalhes,
    tarefasRecentes,
  ] = await Promise.all([
    prisma.evento.count({
      where: {
        tenantId,
        dataInicio: { gte: hojeInicio, lte: hojeFim },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
    }),
    prisma.evento.count({
      where: {
        tenantId,
        dataInicio: { gte: hojeInicio, lte: addDays(hojeFim, 7) },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
    }),
    prisma.tarefa.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: [TarefaStatus.PENDENTE, TarefaStatus.EM_ANDAMENTO] },
      },
    }),
    prisma.documentoAssinatura.count({
      where: {
        tenantId,
        status: DocumentoAssinaturaStatus.PENDENTE,
      },
    }),
    prisma.processoPrazo.count({
      where: {
        tenantId,
        status: "ABERTO",
        dataVencimento: {
          gte: now,
          lte: tresDias,
        },
      },
    }),
    prisma.cliente.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: addDays(now, -7) },
      },
    }),
    prisma.evento.findMany({
      where: {
        tenantId,
        dataInicio: { gte: now, lte: addDays(now, 5) },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
      orderBy: { dataInicio: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataInicio: true,
        processo: { select: { numero: true, id: true } },
      },
    }),
    prisma.documentoAssinatura.findMany({
      where: {
        tenantId,
        status: DocumentoAssinaturaStatus.PENDENTE,
      },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        cliente: { select: { nome: true } },
        processo: { select: { id: true, numero: true } },
        createdAt: true,
      },
    }),
    prisma.tarefa.findMany({
      where: {
        tenantId,
        status: { in: [TarefaStatus.PENDENTE, TarefaStatus.EM_ANDAMENTO] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        dataLimite: true,
        responsavelId: true,
      },
    }),
  ]);

  const stats: DashboardStatDto[] = [
    {
      id: "eventos-hoje",
      label: "Compromissos hoje",
      value: eventosHoje,
      format: "integer",
      helper: formatCountHelper(eventosSemana, "na semana"),
      tone: eventosHoje > 0 ? "primary" : "secondary",
      icon: "📅",
    },
    {
      id: "tarefas",
      label: "Tarefas abertas",
      value: tarefasPendentes,
      format: "integer",
      helper: formatCountHelper(prazosCriticos, "prazos urgentes"),
      tone: tarefasPendentes > 0 ? "warning" : "success",
      icon: "🗂️",
    },
    {
      id: "assinaturas",
      label: "Assinaturas pendentes",
      value: documentosPendentes,
      format: "integer",
      helper: formatCountHelper(clientesNovos, "novos clientes"),
      tone: documentosPendentes > 0 ? "danger" : "success",
      icon: "🖊️",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "agenda",
      title: eventosSemana > 0 ? "Agenda da semana" : "Agenda tranquila",
      description:
        eventosSemana > 0
          ? `${eventosSemana} compromissos agendados até o final da semana`
          : "Nenhum compromisso registrado para os próximos dias",
      tone: eventosSemana > 0 ? "secondary" : "success",
      icon: "🗓️",
    },
    {
      id: "prazos",
      title: prazosCriticos > 0 ? "Prazos críticos" : "Prazos controlados",
      description:
        prazosCriticos > 0
          ? `${prazosCriticos} prazos vencem nos próximos 3 dias`
          : "Nenhum prazo urgente no radar",
      tone: prazosCriticos > 0 ? "danger" : "success",
      icon: prazosCriticos > 0 ? "⚠️" : "✅",
    },
    {
      id: "clientes",
      title:
        clientesNovos > 0 ? "Novos clientes em onboarding" : "Onboarding ok",
      description:
        clientesNovos > 0
          ? `${clientesNovos} clientes foram cadastrados nos últimos 7 dias`
          : "Sem novos clientes nesta semana",
      tone: clientesNovos > 0 ? "primary" : "default",
      icon: "🤝",
    },
  ];

  const eventosSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.evento.count({
        where: {
          tenantId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const clientesSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.cliente.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const alerts: DashboardAlert[] = [];

  if (documentosPendentes > 0) {
    alerts.push({
      id: "sec-alert-assinaturas",
      title: "Assinaturas pendentes",
      description: `${documentosPendentes} documentos aguardam assinatura.`,
      tone: "warning",
      icon: "🖋️",
      href: "/documentos",
    });
  }

  if (prazosCriticos > 0) {
    alerts.push({
      id: "sec-alert-prazos",
      title: "Prazos críticos",
      description: `${prazosCriticos} prazos vencem em até 3 dias.`,
      tone: "danger",
      icon: "⏳",
      href: "/processos",
    });
  }

  const activity: DashboardActivity[] = [
    ...eventosProximos.map((evento) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      description: evento.processo?.numero
        ? `Evento do processo ${evento.processo.numero}`
        : "Evento agendado",
      date: evento.dataInicio?.toISOString() ?? now.toISOString(),
      icon: "📅",
      href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
    })),
    ...documentosPendentesDetalhes.map((doc) => ({
      id: `doc-${doc.id}`,
      title: doc.titulo,
      description: doc.cliente?.nome
        ? `Cliente: ${doc.cliente.nome}`
        : "Documento aguardando assinatura",
      date: doc.createdAt?.toISOString() ?? now.toISOString(),
      icon: "📁",
      tone: "warning",
      href: doc.processo ? `/processos/${doc.processo.id}` : undefined,
    })),
    ...tarefasRecentes.map((tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      title: tarefa.titulo,
      description: tarefa.dataLimite
        ? `Prazo: ${tarefa.dataLimite.toLocaleDateString("pt-BR")}`
        : "Tarefa registrada",
      date: tarefa.createdAt.toISOString(),
      icon: "🗂️",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const highlights: DashboardListItem[] = eventosProximos.map((evento) => ({
    id: evento.id,
    title: evento.titulo,
    subtitle: evento.processo?.numero,
    date: evento.dataInicio?.toISOString(),
    tone: "secondary",
    href: evento.processo ? `/processos/${evento.processo.id}` : undefined,
  }));

  const pending: DashboardListItem[] = documentosPendentesDetalhes.map(
    (doc) => ({
      id: doc.id,
      title: doc.titulo,
      subtitle: doc.cliente?.nome,
      date: doc.createdAt?.toISOString(),
      tone: "warning",
      href: doc.processo ? `/processos/${doc.processo.id}` : undefined,
    }),
  );

  const trends = [
    ...eventosSeries.map((trend) => ({
      ...trend,
      id: `eventos-${trend.id}`,
      label: `Eventos ${trend.label}`,
    })),
    ...clientesSeries.map((trend) => ({
      ...trend,
      id: `clientes-${trend.id}`,
      label: `Clientes ${trend.label}`,
    })),
  ];

  return {
    role: UserRole.SECRETARIA,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
  };
}

async function buildClienteDashboard(
  tenantId: string,
  userId: string,
  now: Date,
): Promise<DashboardData> {
  const cliente = await prisma.cliente.findFirst({
    where: {
      tenantId,
      usuarioId: userId,
    },
    select: { id: true },
  });

  if (!cliente) {
    return {
      role: UserRole.CLIENTE,
      stats: [],
      insights: [],
      highlights: [],
      pending: [],
      trends: [],
      alerts: [],
      activity: [],
    };
  }

  const weekEnd = addDays(now, 7);

  const [
    processos,
    documentos,
    parcelasPendentes,
    parcelasAtrasadas,
    eventosSemana,
    proximoEvento,
    eventosLista,
    parcelasLista,
  ] = await Promise.all([
    prisma.processo.count({
      where: {
        tenantId,
        clienteId: cliente.id,
        deletedAt: null,
      },
    }),
    prisma.documento.count({
      where: {
        tenantId,
        clienteId: cliente.id,
        deletedAt: null,
      },
    }),
    prisma.contratoParcela.count({
      where: {
        tenantId,
        contrato: { clienteId: cliente.id },
        status: ContratoParcelaStatus.PENDENTE,
      },
    }),
    prisma.contratoParcela.count({
      where: {
        tenantId,
        contrato: { clienteId: cliente.id },
        status: ContratoParcelaStatus.ATRASADA,
      },
    }),
    prisma.evento.count({
      where: {
        tenantId,
        clienteId: cliente.id,
        dataInicio: { gte: now, lte: weekEnd },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
    }),
    prisma.evento.findFirst({
      where: {
        tenantId,
        clienteId: cliente.id,
        dataInicio: { gte: now },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
      orderBy: { dataInicio: "asc" },
      select: {
        titulo: true,
        dataInicio: true,
      },
    }),
    prisma.evento.findMany({
      where: {
        tenantId,
        clienteId: cliente.id,
        dataInicio: { gte: now },
        status: { in: [EventoStatus.AGENDADO, EventoStatus.CONFIRMADO] },
      },
      orderBy: { dataInicio: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        dataInicio: true,
      },
    }),
    prisma.contratoParcela.findMany({
      where: {
        tenantId,
        contrato: { clienteId: cliente.id },
        status: {
          in: [ContratoParcelaStatus.PENDENTE, ContratoParcelaStatus.ATRASADA],
        },
      },
      orderBy: { dataVencimento: "asc" },
      take: 5,
      select: {
        id: true,
        titulo: true,
        numeroParcela: true,
        valor: true,
        dataVencimento: true,
        status: true,
      },
    }),
  ]);

  const stats: DashboardStatDto[] = [
    {
      id: "processos",
      label: "Meus processos",
      value: processos,
      format: "integer",
      helper: formatCountHelper(eventosSemana, "eventos na semana"),
      tone: "primary",
      icon: "📄",
    },
    {
      id: "documentos",
      label: "Documentos disponíveis",
      value: documentos,
      format: "integer",
      helper: formatCountHelper(parcelasPendentes, "parcelas pendentes"),
      tone: "success",
      icon: "📁",
    },
    {
      id: "parcelas",
      label: "Pagamentos em aberto",
      value: parcelasPendentes + parcelasAtrasadas,
      format: "integer",
      helper:
        parcelasAtrasadas > 0
          ? `${parcelasAtrasadas} parcelas atrasadas`
          : "Nenhum pagamento atrasado",
      tone: parcelasAtrasadas > 0 ? "danger" : "warning",
      icon: "💳",
    },
  ];

  const insights: DashboardInsightDto[] = [
    {
      id: "agenda",
      title: proximoEvento ? "Próxima etapa do processo" : "Sem eventos",
      description: proximoEvento
        ? `${proximoEvento.titulo} em ${proximoEvento.dataInicio.toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}`
        : "Nenhum compromisso agendado",
      tone: proximoEvento ? "secondary" : "default",
      icon: "🗓️",
    },
    {
      id: "pagamentos",
      title:
        parcelasPendentes + parcelasAtrasadas > 0
          ? "Pagamentos pendentes"
          : "Financeiro em dia",
      description:
        parcelasPendentes + parcelasAtrasadas > 0
          ? `${parcelasPendentes} parcelas aguardando pagamento`
          : "Nenhuma pendência financeira registrada",
      tone: parcelasPendentes + parcelasAtrasadas > 0 ? "warning" : "success",
      icon: parcelasPendentes + parcelasAtrasadas > 0 ? "💡" : "✅",
    },
    {
      id: "documentos",
      title:
        documentos > 0 ? "Documentos compartilhados" : "Portal sem documentos",
      description:
        documentos > 0
          ? `${documentos} documentos estão disponíveis para consulta`
          : "Nenhum documento enviado até o momento",
      tone: documentos > 0 ? "primary" : "default",
      icon: "📦",
    },
  ];

  const processoSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.processo.count({
        where: {
          tenantId,
          clienteId: cliente.id,
          deletedAt: null,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const documentoSeries = await generateMonthlySeries(
    6,
    now,
    async (start, end) =>
      prisma.documento.count({
        where: {
          tenantId,
          clienteId: cliente.id,
          deletedAt: null,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    "integer",
  );

  const alerts: DashboardAlert[] = [];

  if (parcelasAtrasadas > 0) {
    alerts.push({
      id: "cliente-alert-parcelas",
      title: "Pagamentos atrasados",
      description: `${parcelasAtrasadas} parcelas precisam de regularização.`,
      tone: "danger",
      icon: "💳",
      href: "/financeiro",
    });
  }

  if (parcelasPendentes > 0 && parcelasAtrasadas === 0) {
    alerts.push({
      id: "cliente-alert-pendentes",
      title: "Pagamentos pendentes",
      description: `${parcelasPendentes} parcelas aguardam pagamento.`,
      tone: "warning",
      icon: "💳",
      href: "/financeiro",
    });
  }

  const activity: DashboardActivity[] = [
    ...eventosLista.map((evento) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      description: "Evento do seu processo",
      date: evento.dataInicio?.toISOString() ?? now.toISOString(),
      icon: "📅",
      tone: "secondary" as Tone,
    })),
    ...parcelasLista.map((parcela) => ({
      id: `parcela-${parcela.id}`,
      title: parcela.titulo || `Parcela #${parcela.numeroParcela}`,
      description: `Valor: R$ ${Number(parcela.valor).toLocaleString("pt-BR")}`,
      date: parcela.dataVencimento?.toISOString() ?? now.toISOString(),
      icon: "💳",
      tone: (parcela.status === ContratoParcelaStatus.ATRASADA
        ? "danger"
        : "warning") as Tone,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const highlights: DashboardListItem[] = eventosLista.map((evento) => ({
    id: evento.id,
    title: evento.titulo,
    date: evento.dataInicio?.toISOString(),
    tone: "secondary",
  }));

  const pending: DashboardListItem[] = parcelasLista.map((parcela) => ({
    id: parcela.id,
    title: parcela.titulo || `Parcela #${parcela.numeroParcela}`,
    badge: `R$ ${Number(parcela.valor).toLocaleString("pt-BR")}`,
    date: parcela.dataVencimento?.toISOString(),
    tone:
      parcela.status === ContratoParcelaStatus.ATRASADA ? "danger" : "warning",
  }));

  const trends = [
    ...processoSeries.map((trend) => ({
      ...trend,
      id: `processos-${trend.id}`,
      label: `Processos ${trend.label}`,
    })),
    ...documentoSeries.map((trend) => ({
      ...trend,
      id: `documentos-${trend.id}`,
      label: `Documentos ${trend.label}`,
    })),
  ];

  return {
    role: UserRole.CLIENTE,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
  };
}

export async function getDashboardData(): Promise<DashboardResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const userRole = (session.user as any)?.role as UserRole | undefined;
    const tenantId = (session.user as any)?.tenantId as string | undefined;
    const now = new Date();

    let data: DashboardData;

    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        data = await buildSuperAdminDashboard(now);
        break;
      case UserRole.ADMIN:
        if (!tenantId) {
          throw new Error("Tenant não definido para o usuário administrador");
        }
        data = await buildAdminDashboard(tenantId, now);
        break;
      case UserRole.ADVOGADO:
        if (!tenantId) {
          throw new Error("Tenant não definido para o advogado");
        }
        data = await buildAdvogadoDashboard(tenantId, session.user.id, now);
        break;
      case UserRole.FINANCEIRO:
        if (!tenantId) {
          throw new Error("Tenant não definido para o financeiro");
        }
        data = await buildFinanceiroDashboard(tenantId, now);
        break;
      case UserRole.SECRETARIA:
        if (!tenantId) {
          throw new Error("Tenant não definido para a secretaria");
        }
        data = await buildSecretariaDashboard(tenantId, now);
        break;
      case UserRole.CLIENTE:
        if (!tenantId) {
          throw new Error("Tenant não definido para o cliente");
        }
        data = await buildClienteDashboard(tenantId, session.user.id, now);
        break;
      default:
        data = {
          role: userRole ?? null,
          stats: [],
          insights: [],
          highlights: [],
          pending: [],
          trends: [],
          alerts: [],
          activity: [],
        };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("[dashboard] Erro ao carregar dados", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao carregar dashboard",
    };
  }
}
