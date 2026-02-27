"use client";

import type {
  DashboardActivity,
  DashboardAlert,
  DashboardInsightDto,
  DashboardListItem,
  DashboardStatDto,
  DashboardTrend,
  StatFormat,
  Tone,
} from "@/app/actions/dashboard";

import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { title, subtitle } from "@/components/primitives";
import { useDashboardData } from "@/app/hooks/use-dashboard";
import {
  useUserPermissions,
  type UserPermissions,
} from "@/app/hooks/use-user-permissions";
import { useProfileNavigation } from "@/app/hooks/use-profile-navigation";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  tone: Tone;
  icon: string;
}

const toneStyles: Record<
  Tone,
  { container: string; title: string; helper: string }
> = {
  primary: {
    container: "border-primary/20 bg-primary/5",
    title: "text-primary",
    helper: "text-primary/70",
  },
  success: {
    container: "border-success/20 bg-success/5",
    title: "text-success",
    helper: "text-success/70",
  },
  warning: {
    container: "border-warning/20 bg-warning/5",
    title: "text-warning",
    helper: "text-warning/70",
  },
  secondary: {
    container: "border-secondary/20 bg-secondary/5",
    title: "text-secondary",
    helper: "text-secondary/70",
  },
  danger: {
    container: "border-danger/20 bg-danger/5",
    title: "text-danger",
    helper: "text-danger/70",
  },
  default: {
    container: "border-white/10 bg-background/60",
    title: "text-white",
    helper: "text-default-400",
  },
};

const trendChartPalette = [
  { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.2)" },
  { stroke: "#34d399", fill: "rgba(52, 211, 153, 0.2)" },
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.2)" },
  { stroke: "#f472b6", fill: "rgba(244, 114, 182, 0.2)" },
];

interface TrendChartPoint {
  period: string;
  value: number;
}

interface TrendChartSeries {
  key: string;
  metric: string;
  format?: StatFormat;
  points: TrendChartPoint[];
  latestValue: number;
  deltaPercent?: number;
}

function formatStatValue(value: number | string, format?: StatFormat) {
  if (format === "currency") {
    const numeric = typeof value === "number" ? value : Number(value);

    return Number.isFinite(numeric)
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 2,
        }).format(numeric)
      : String(value);
  }

  if (format === "percentage") {
    const numeric = typeof value === "number" ? value : Number(value);

    return Number.isFinite(numeric)
      ? `${numeric.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
      : String(value);
  }

  if (format === "integer") {
    const numeric = typeof value === "number" ? value : Number(value);

    return Number.isFinite(numeric)
      ? new Intl.NumberFormat("pt-BR", {
          maximumFractionDigits: 0,
        }).format(numeric)
      : String(value);
  }

  return typeof value === "number"
    ? value.toLocaleString("pt-BR")
    : String(value);
}

function formatListDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityActionLabel(href: string) {
  if (href.startsWith("/processos/")) return "Ver processo";
  if (href === "/processos") return "Ir para processos";
  if (href.startsWith("/clientes/")) return "Ver cliente";
  if (href === "/clientes") return "Ir para clientes";
  if (href.startsWith("/documentos")) return "Ir para documentos";
  if (href.startsWith("/agenda")) return "Ir para agenda";
  if (href.startsWith("/tarefas")) return "Ir para tarefas";
  if (href.startsWith("/financeiro/recibos")) return "Ir para recibos";
  if (href.startsWith("/financeiro")) return "Ir para financeiro";
  if (href.startsWith("/admin/")) return "Abrir painel";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return "Abrir arquivo";
  }

  return "Abrir registro";
}

function buildQuickActions(
  role: string | null | undefined,
  permissions: UserPermissions,
): QuickAction[] {
  const actions: QuickAction[] = [];

  switch (role) {
    case "SUPER_ADMIN":
      actions.push(
        {
          label: "Gerenciar Tenants",
          description: "Crie e administre escritórios white label",
          href: "/admin/tenants",
          tone: "primary",
          icon: "🏢",
        },
        {
          label: "Base de Juízes",
          description: "Atualize juízes globais e premium",
          href: "/admin/juizes",
          tone: "success",
          icon: "👨‍⚖️",
        },
        {
          label: "Relatórios",
          description: "Insights corporativos de receita e churn",
          href: "/admin/relatorios",
          tone: "warning",
          icon: "📈",
        },
      );
      break;
    case "ADMIN":
      actions.push(
        {
          label: "Processos",
          description: "Distribua tarefas e acompanhe fases",
          href: "/processos",
          tone: "primary",
          icon: "⚖️",
        },
        {
          label: "Clientes",
          description: "Onboarding e relacionamento",
          href: "/clientes",
          tone: "success",
          icon: "🤝",
        },
        {
          label: "Agenda",
          description: "Audiências e compromissos da equipe",
          href: "/agenda",
          tone: "secondary",
          icon: "🗓️",
        },
      );
      if (permissions.canManageTeam) {
        actions.push({
          label: "Equipe",
          description: "Usuários, cargos e permissões",
          href: "/equipe",
          tone: "secondary",
          icon: "👥",
        });
      }
      if (permissions.canViewFinancialData) {
        actions.push({
          label: "Financeiro",
          description: "Cobranças, faturas e repasses",
          href: "/financeiro",
          tone: "warning",
          icon: "💰",
        });
      }
      if (permissions.canViewReports) {
        actions.push({
          label: "Relatórios",
          description: "Indicadores de produtividade e receita",
          href: "/relatorios",
          tone: "success",
          icon: "📈",
        });
      }
      if (permissions.canManageOfficeSettings) {
        actions.push({
          label: "Configurações",
          description: "Dados do escritório e regras operacionais",
          href: "/configuracoes",
          tone: "primary",
          icon: "⚙️",
        });
      }
      break;
    case "ADVOGADO":
      actions.push(
        {
          label: "Agenda",
          description: "Audiências e compromissos da semana",
          href: "/agenda",
          tone: "primary",
          icon: "🗓️",
        },
        {
          label: "Meus Clientes",
          description: "Fluxo de atendimento em andamento",
          href: "/clientes",
          tone: "success",
          icon: "👥",
        },
        {
          label: "Documentos",
          description: "Minutas, contratos e procurações",
          href: "/documentos",
          tone: "secondary",
          icon: "📁",
        },
      );
      if (permissions.canViewJudgesDatabase) {
        actions.push({
          label: "Juízes",
          description: "Pesquisa rápida da base global",
          href: "/juizes",
          tone: "warning",
          icon: "👨‍⚖️",
        });
      }
      break;
    case "SECRETARIA":
      actions.push(
        {
          label: "Agenda",
          description: "Confirme audiências e reuniões",
          href: "/agenda",
          tone: "primary",
          icon: "📅",
        },
        {
          label: "Fluxo de documentos",
          description: "Envio, assinatura e organização",
          href: "/documentos",
          tone: "secondary",
          icon: "🗂️",
        },
        {
          label: "Suporte ao cliente",
          description: "Atendimentos e protocolo",
          href: "/clientes",
          tone: "success",
          icon: "🤝",
        },
      );
      break;
    case "FINANCEIRO":
      actions.push(
        {
          label: "Faturas",
          description: "Emitir, enviar e registrar pagamentos",
          href: "/financeiro",
          tone: "primary",
          icon: "🧾",
        },
        {
          label: "Clientes inadimplentes",
          description: "Negociações em andamento",
          href: "/clientes",
          tone: "danger",
          icon: "📉",
        },
        {
          label: "Relatórios",
          description: "Receita, repasses e indicadores",
          href: "/relatorios",
          tone: "secondary",
          icon: "📈",
        },
      );
      break;
    case "CLIENTE":
      actions.push(
        {
          label: "Acompanhar processo",
          description: "Linha do tempo e movimentações",
          href: "/processos",
          tone: "primary",
          icon: "🔍",
        },
        {
          label: "Meus documentos",
          description: "Contratos e comprovantes",
          href: "/documentos",
          tone: "secondary",
          icon: "🗃️",
        },
      );
      if (permissions.canViewFinancialData) {
        actions.push({
          label: "Pagamentos",
          description: "Faturas e recibos",
          href: "/financeiro",
          tone: "warning",
          icon: "💳",
        });
      }
      actions.push({
        label: "Suporte",
        description: "Abra um chamado ou fale com o time",
        href: "/help",
        tone: "success",
        icon: "💬",
      });
      break;
    default:
      actions.push(
        {
          label: "Explorar módulos",
          description: "Conheça os recursos disponíveis",
          href: "/help",
          tone: "primary",
          icon: "✨",
        },
        {
          label: "Configurar perfil",
          description: "Preferências e notificações",
          href: "/usuario/perfil/editar",
          tone: "secondary",
          icon: "⚙️",
        },
      );
  }

  return actions;
}

function renderStatCard(stat: DashboardStatDto) {
  const styles = toneStyles[stat.tone] ?? toneStyles.default;

  return (
    <div
      key={stat.id}
      className={`rounded-2xl border p-4 min-w-0 ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-2xl">
          {stat.icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-default-400">
            {stat.label}
          </p>
          <p className={`truncate text-xl font-semibold ${styles.title}`}>
            {formatStatValue(stat.value, stat.format)}
          </p>
          {stat.helper ? (
            <p className={`text-xs ${styles.helper}`}>{stat.helper}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function renderInsightCard(insight: DashboardInsightDto) {
  const styles = toneStyles[insight.tone] ?? toneStyles.default;

  return (
    <div
      key={insight.id}
      className={`rounded-2xl border p-4 min-w-0 ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-2xl">
          {insight.icon}
        </span>
        <p className={`font-semibold ${styles.title}`}>{insight.title}</p>
      </div>
      <p className="mt-2 text-sm text-default-400">{insight.description}</p>
      {insight.detail ? (
        <p className="mt-1 text-xs text-default-500">{insight.detail}</p>
      ) : null}
    </div>
  );
}

function renderListItem(item: DashboardListItem) {
  const styles = item.tone
    ? (toneStyles[item.tone] ?? toneStyles.default)
    : toneStyles.default;
  const formattedDate = formatListDate(item.date);

  return (
    <li
      key={item.id}
      className={`rounded-2xl border px-4 py-3 ${styles.container}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate font-semibold ${styles.title}`}>
            {item.title}
          </p>
          {item.subtitle ? (
            <p className="text-xs text-default-400 truncate">{item.subtitle}</p>
          ) : null}
          {formattedDate ? (
            <p className="text-xs text-default-500">{formattedDate}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.badge ? (
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white">
              {item.badge}
            </span>
          ) : null}
          {item.href ? (
            <Button
              as={NextLink}
              className="text-xs text-primary"
              href={item.href}
              size="sm"
              variant="light"
            >
              Abrir
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function buildTrendChartSeries(trends: DashboardTrend[]): TrendChartSeries[] {
  const grouped = new Map<
    string,
    {
      key: string;
      metric: string;
      format?: StatFormat;
      points: TrendChartPoint[];
      latestPrevious?: number;
    }
  >();

  trends.forEach((trend) => {
    const [rawMetric, ...rest] = trend.label.trim().split(/\s+/);
    const metric = rawMetric || trend.label;
    const period = rest.join(" ").trim() || trend.label;
    const key = metric.toLowerCase().replace(/[^a-z0-9]+/gi, "-");

    const existing = grouped.get(metric);

    if (!existing) {
      grouped.set(metric, {
        key,
        metric,
        format: trend.format,
        points: [{ period, value: trend.value }],
        latestPrevious:
          typeof trend.previous === "number" ? trend.previous : undefined,
      });

      return;
    }

    existing.points.push({
      period,
      value: trend.value,
    });
    existing.format = existing.format || trend.format;
    existing.latestPrevious =
      typeof trend.previous === "number" ? trend.previous : existing.latestPrevious;
  });

  return Array.from(grouped.values())
    .map((series) => {
      const latestPoint = series.points[series.points.length - 1];
      const previousPoint = series.points[series.points.length - 2];
      const previousValue = previousPoint?.value ?? series.latestPrevious;
      const deltaPercent =
        typeof previousValue === "number" && previousValue !== 0
          ? ((latestPoint.value - previousValue) / previousValue) * 100
          : undefined;

      return {
        key: series.key,
        metric: series.metric,
        format: series.format,
        points: series.points,
        latestValue: latestPoint.value,
        deltaPercent,
      };
    })
    .filter((series) => series.points.length > 0);
}

function renderTrendChartCard(series: TrendChartSeries, index: number) {
  const palette = trendChartPalette[index % trendChartPalette.length];
  const gradientId = `dashboard-trend-${series.key}-${index}`;
  const deltaTone =
    series.deltaPercent === undefined
      ? "text-default-500"
      : series.deltaPercent >= 0
        ? "text-success"
        : "text-danger";

  return (
    <div
      key={`${series.key}-${index}`}
      className="rounded-2xl border border-white/10 bg-background/45 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-default-500">
            Tendência
          </p>
          <p className="truncate text-base font-semibold text-white">
            {series.metric}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">
            {formatStatValue(series.latestValue, series.format)}
          </p>
          {series.deltaPercent !== undefined ? (
            <p className={`text-xs font-semibold ${deltaTone}`}>
              {series.deltaPercent >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(series.deltaPercent).toFixed(1)}%
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={series.points}
            margin={{ top: 12, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={palette.stroke} stopOpacity={0.7} />
                <stop offset="95%" stopColor={palette.stroke} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="period"
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "rgba(5, 8, 16, 0.92)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                color: "white",
              }}
              formatter={(value) =>
                formatStatValue(Number(value), series.format)
              }
              labelStyle={{ color: "rgba(255, 255, 255, 0.75)" }}
            />
            <Area
              dataKey="value"
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              stroke={palette.stroke}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderAlertCard(alert: DashboardAlert) {
  const styles = toneStyles[alert.tone] ?? toneStyles.default;

  return (
    <div
      key={alert.id}
      className={`rounded-2xl border p-4 ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-2xl">
          {alert.icon ?? "⚠️"}
        </span>
        <div className="min-w-0">
          <p className={`font-semibold ${styles.title}`}>{alert.title}</p>
          <p className="text-sm text-default-400">{alert.description}</p>
        </div>
      </div>
      {alert.href ? (
        <Button
          as={NextLink}
          className="mt-3 text-xs text-primary"
          href={alert.href}
          size="sm"
          variant="light"
        >
          Ver detalhes
        </Button>
      ) : null}
    </div>
  );
}

function renderActivityItem(item: DashboardActivity) {
  const styles = item.tone
    ? (toneStyles[item.tone] ?? toneStyles.default)
    : toneStyles.default;
  const formattedDate = formatListDate(item.date);
  const actionLabel = item.href ? getActivityActionLabel(item.href) : null;

  return (
    <li
      key={item.id}
      className={`rounded-2xl border px-4 py-3 ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-xl">
          {item.icon ?? "📝"}
        </span>
        <div className="min-w-0">
          <p className={`truncate font-semibold ${styles.title}`}>
            {item.title}
          </p>
          <p className="text-xs text-default-400 truncate">
            {item.description}
          </p>
          {formattedDate ? (
            <p className="text-xs text-default-500">{formattedDate}</p>
          ) : null}
        </div>
      </div>
      {item.href ? (
        <Button
          as={NextLink}
          className="mt-3 text-xs text-primary"
          href={item.href}
          size="sm"
          variant="light"
        >
          {actionLabel ?? "Abrir registro"}
        </Button>
      ) : null}
    </li>
  );
}

export function DashboardContent() {
  const { permissions, userRole } = useUserPermissions();
  const { getDashboardTitle, getDashboardDescription, getWelcomeMessage } =
    useProfileNavigation();
  const {
    data,
    role,
    stats,
    insights,
    highlights,
    pending,
    trends,
    alerts,
    activity,
    isLoading,
    isError,
    error,
    refresh,
  } = useDashboardData();

  const effectiveRole = role ?? data?.role ?? userRole ?? null;
  const quickActions = buildQuickActions(effectiveRole, permissions);
  const showStatsSkeleton = isLoading && stats.length === 0;
  const showInsightsSkeleton = isLoading && insights.length === 0;
  const showHighlightsSkeleton = isLoading && highlights.length === 0;
  const showPendingSkeleton = isLoading && pending.length === 0;
  const showTrendsSkeleton = isLoading && trends.length === 0;
  const showAlertsSkeleton = isLoading && alerts.length === 0;
  const showActivitySkeleton = isLoading && activity.length === 0;
  const trendSeries = buildTrendChartSeries(trends);
  const primaryQuickActions = quickActions.slice(0, 6);
  const urgentAlertCount = alerts.filter(
    (alert) => alert.tone === "danger" || alert.tone === "warning",
  ).length;
  const commandCenterItems = [
    {
      id: "prioridades",
      label: "Prioridades abertas",
      value: pending.length + alerts.length,
      helper: `${urgentAlertCount} críticas`,
      tone: urgentAlertCount > 0 ? "danger" : "secondary",
    },
    {
      id: "agenda",
      label: "Itens em destaque",
      value: highlights.length,
      helper: "Compromissos próximos",
      tone: highlights.length > 0 ? "primary" : "default",
    },
    {
      id: "insights",
      label: "Insights acionáveis",
      value: insights.length,
      helper: "Leituras de contexto",
      tone: insights.length > 0 ? "success" : "default",
    },
    {
      id: "atividade",
      label: "Eventos recentes",
      value: activity.length,
      helper: "Últimos registros",
      tone: activity.length > 0 ? "warning" : "default",
    },
  ] as const;

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-3 py-10 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Visão geral
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              {getDashboardTitle()}
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              {getDashboardDescription()}
            </p>
          </div>
        </div>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody>
            <p className="text-default-600">{getWelcomeMessage()}</p>
          </CardBody>
        </Card>
      </header>

      {isError ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">
                Não foi possível carregar o dashboard
              </p>
              <p className="text-sm text-danger/80">
                {(error as Error | undefined)?.message ||
                  "Tente atualizar a página ou recarregar os dados."}
              </p>
            </div>
            <Button color="danger" variant="flat" onPress={() => refresh()}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.6fr]">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Central de comando</h2>
            <p className="text-sm text-default-400">
              O que precisa de atenção agora.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {commandCenterItems.map((item) => {
                const styles = toneStyles[item.tone] ?? toneStyles.default;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${styles.container}`}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-default-500">
                      {item.label}
                    </p>
                    <p className={`mt-1 text-2xl font-semibold ${styles.title}`}>
                      {formatStatValue(item.value, "integer")}
                    </p>
                    <p className="text-xs text-default-400">{item.helper}</p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Atalhos estratégicos</h2>
            <p className="text-sm text-default-400">
              Rotas de maior uso para o seu perfil.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {primaryQuickActions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {primaryQuickActions.map((action) => {
                  const styles = toneStyles[action.tone] ?? toneStyles.default;

                  return (
                    <Button
                      key={action.label}
                      as={NextLink}
                      className={`h-auto w-full justify-start gap-3 rounded-2xl border bg-background/40 p-4 text-left ${styles.container} hover:bg-white/10`}
                      href={action.href}
                      variant="bordered"
                    >
                      <span aria-hidden className="text-2xl">
                        {action.icon}
                      </span>
                      <div className="min-w-0 text-left">
                        <p className={`truncate font-semibold ${styles.title}`}>
                          {action.label}
                        </p>
                        <p className="text-xs text-default-400">
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Nenhuma ação disponível para o seu perfil no momento.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Métricas principais
          </h2>
          <p className="text-sm text-default-400">
            Indicadores consolidados com base na sua atuação.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {showStatsSkeleton ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`stat-skeleton-${index}`}
                  className="rounded-2xl border border-white/10 bg-background/40 p-4 animate-pulse"
                >
                  <div className="h-9 w-9 rounded-full bg-white/10" />
                  <div className="mt-4 h-4 w-1/2 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : stats.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {stats.map(renderStatCard)}
            </div>
          ) : (
            <p className="text-sm text-default-500">
              Nenhuma métrica disponível para o seu perfil ainda.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Evolução mensal</h2>
          <p className="text-sm text-default-400">
            Gráficos dos principais indicadores para decisão rápida.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {showTrendsSkeleton ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`trend-chart-skeleton-${index}`}
                  className="h-64 rounded-2xl border border-white/10 bg-background/40 animate-pulse"
                />
              ))}
            </div>
          ) : trendSeries.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {trendSeries.map((series, index) =>
                renderTrendChartCard(series, index),
              )}
            </div>
          ) : (
            <p className="text-sm text-default-500">
              Ainda sem séries históricas suficientes para exibir tendências.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">
              Prioridades e insights
            </h2>
            <p className="text-sm text-default-400">
              Contexto rápido para orientar as próximas ações.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {showInsightsSkeleton ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`insight-skeleton-${index}`}
                    className="rounded-2xl border border-white/10 bg-background/40 p-4 animate-pulse"
                  >
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="mt-3 h-3 w-3/4 rounded bg-white/5" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {insights.map(renderInsightCard)}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Ainda não temos insights para exibir. Continue usando a plataforma
                para gerar tendências.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Alertas</h2>
            <p className="text-sm text-default-400">
              Itens críticos que impactam seu dia a dia.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {showAlertsSkeleton ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={`alert-skeleton-${index}`}
                    className="h-20 rounded-2xl border border-white/10 bg-background/40 animate-pulse"
                  />
                ))}
              </div>
            ) : alerts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {alerts.map(renderAlertCard)}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Nenhum alerta crítico neste momento.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Em destaque</h2>
            <p className="text-sm text-default-400">
              Próximos compromissos e registros relevantes para você.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {showHighlightsSkeleton ? (
              <ul className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={`highlight-skeleton-${index}`}
                    className="h-16 rounded-2xl border border-white/10 bg-background/40 animate-pulse"
                  />
                ))}
              </ul>
            ) : highlights.length > 0 ? (
              <ul className="space-y-3">{highlights.map(renderListItem)}</ul>
            ) : (
              <p className="text-sm text-default-500">
                Nada agendado por aqui. Assim que novos eventos surgirem,
                listaremos nesta seção.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Pendências</h2>
            <p className="text-sm text-default-400">
              Itens que exigem acompanhamento para evitar atrasos.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {showPendingSkeleton ? (
              <ul className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={`pending-skeleton-${index}`}
                    className="h-16 rounded-2xl border border-white/10 bg-background/40 animate-pulse"
                  />
                ))}
              </ul>
            ) : pending.length > 0 ? (
              <ul className="space-y-3">{pending.map(renderListItem)}</ul>
            ) : (
              <p className="text-sm text-default-500">
                Nenhuma pendência urgente. Aproveite para revisar os próximos
                passos com calma.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Atividades recentes
          </h2>
          <p className="text-sm text-default-400">
            Últimas ações registradas em sua conta.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {showActivitySkeleton ? (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <li
                  key={`activity-skeleton-${index}`}
                  className="h-16 rounded-2xl border border-white/10 bg-background/40 animate-pulse"
                />
              ))}
            </ul>
          ) : activity.length > 0 ? (
            <ul className="space-y-3">{activity.map(renderActivityItem)}</ul>
          ) : (
            <p className="text-sm text-default-500">
              Nenhuma atividade recente registrada.
            </p>
          )}
        </CardBody>
      </Card>

    </section>
  );
}
