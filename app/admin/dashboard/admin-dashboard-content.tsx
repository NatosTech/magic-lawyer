"use client";

import { useId, useMemo } from "react";
import useSWR from "swr";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/react";
import NextLink from "next/link";

import {
  getSuperAdminDashboardData,
  type AdminDashboardData,
  type AdminDashboardStat,
  type AdminDashboardAlert,
  type AdminTrendPoint,
  type AdminTenantHighlight,
  type AdminTenantSummary,
  type AdminAuditEntry,
} from "@/app/actions/admin-dashboard";
import { title, subtitle } from "@/components/primitives";

const toneColors: Record<string, string> = {
  primary: "from-primary/10 via-primary/5 to-primary/0",
  success: "from-success/10 via-success/5 to-success/0",
  warning: "from-warning/10 via-warning/5 to-warning/0",
  secondary: "from-secondary/10 via-secondary/5 to-secondary/0",
  danger: "from-danger/10 via-danger/5 to-danger/0",
  default: "from-default-200/10 via-default-200/5 to-default-200/0",
};

const toneBorder: Record<string, string> = {
  primary: "border-primary/30",
  success: "border-success/30",
  warning: "border-warning/30",
  secondary: "border-secondary/30",
  danger: "border-danger/30",
  default: "border-white/10",
};

const toneText: Record<string, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  secondary: "text-secondary",
  danger: "text-danger",
  default: "text-default-500",
};

const toneStroke: Record<string, string> = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f97316",
  secondary: "#a855f7",
  danger: "#ef4444",
  default: "#9ca3af",
};

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

function formatValue(value: number, format?: string) {
  if (format === "currency") {
    return currencyFormatter.format(value);
  }

  if (format === "percentage") {
    return `${value.toFixed(1)}%`;
  }

  return numberFormatter.format(value);
}

function fetchAdminDashboard() {
  return getSuperAdminDashboardData().then((response) => {
    if (!response.success || !response.data) {
      throw new Error(response.error ?? "Falha ao carregar dashboard");
    }

    return response.data;
  });
}

interface SparklineChartProps {
  points: AdminTrendPoint[];
  tone: string;
}

function SparklineChart({ points, tone }: SparklineChartProps) {
  const id = useId();

  const { path, areaPath, gradientId, minLabel, maxLabel } = useMemo(() => {
    if (points.length === 0) {
      return {
        path: "",
        areaPath: "",
        gradientId: `sparkline-gradient-${id}`,
        minLabel: "0",
        maxLabel: "0",
      };
    }

    const values = points.map((point) => point.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = points.length > 1 ? points.length - 1 : 1;

    const coords = points.map((point, index) => {
      const x = (index / width) * 100;
      const normalized = (point.value - min) / range;
      const y = 100 - normalized * 80 - 10; // padding 10 top/bottom

      return { x, y };
    });

    const linePath = coords
      .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x},${coord.y}`)
      .join(" ");

    const areaPath = `M ${coords[0]?.x ?? 0},100 ${coords
      .map((coord) => `L ${coord.x},${coord.y}`)
      .join(" ")} L ${coords[coords.length - 1]?.x ?? 100},100 Z`;

    return {
      path: linePath,
      areaPath,
      gradientId: `sparkline-gradient-${id}`,
      minLabel: formatValue(min, points[0]?.format),
      maxLabel: formatValue(max, points[0]?.format),
    };
  }, [points, id]);

  const color = toneStroke[tone] ?? toneStroke.default;

  if (!path) {
    return (
      <div className="flex h-24 w-full items-center justify-center text-sm text-default-400">
        Sem dados suficientes ainda
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <svg
        className="h-24 w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
      <div className="flex items-center justify-between text-xs text-default-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: AdminDashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className={`border ${toneBorder[stat.tone] ?? "border-white/10"} bg-linear-to-br ${toneColors[stat.tone] ?? toneColors.default} backdrop-blur`}
        >
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-default-400">
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-semibold ${toneText[stat.tone] ?? "text-white"}`}
                >
                  {formatValue(stat.value, stat.format)}
                </p>
              </div>
              <div aria-hidden className="text-3xl">
                {stat.icon}
              </div>
            </div>
            {stat.helper ? (
              <p className="text-xs text-default-500">{stat.helper}</p>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AlertsList({ alerts }: { alerts: AdminDashboardAlert[] }) {
  if (!alerts.length) {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur">
        <CardBody className="text-sm text-default-400">
          Nenhum alerta no momento. Tudo em ordem! 🎉
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`border ${toneBorder[alert.tone] ?? "border-white/10"} bg-linear-to-br ${toneColors[alert.tone] ?? toneColors.default} backdrop-blur`}
        >
          <CardBody className="space-y-2">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                {alert.icon ?? "ℹ️"}
              </span>
              <p className="font-semibold text-white">{alert.title}</p>
            </div>
            <p className="text-sm text-default-200">{alert.description}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function TenantsTable({ tenants }: { tenants: AdminTenantHighlight[] }) {
  if (!tenants.length) {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur">
        <CardBody className="text-sm text-default-400">
          Ainda não há faturamento registrado para destacar tenants. Assim que
          os pagamentos começarem a entrar você verá seus clientes mais valiosos
          aqui.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => (
        <div
          key={tenant.id}
          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-background/80 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-white">
                {tenant.name}
              </p>
              <Chip
                color={
                  tenant.status === "ACTIVE"
                    ? "success"
                    : tenant.status === "SUSPENDED"
                      ? "warning"
                      : "danger"
                }
                size="sm"
                variant="flat"
              >
                {tenant.status === "ACTIVE"
                  ? "Ativo"
                  : tenant.status === "SUSPENDED"
                    ? "Suspenso"
                    : "Cancelado"}
              </Chip>
            </div>
            <p className="text-xs text-default-400">{tenant.slug}</p>
            <div className="flex flex-wrap gap-3 text-xs text-default-500">
              <span>
                {tenant.users} usuários • {tenant.processos} processos •{" "}
                {tenant.clientes} clientes
              </span>
              <span>
                • Receita 90d: {formatValue(tenant.revenue90d, "currency")}
              </span>
              <span>
                • Receita 30d: {formatValue(tenant.revenue30d, "currency")}
              </span>
              {tenant.pendingInvoices > 0 ? (
                <span className="text-warning">
                  • {tenant.pendingInvoices} fatura(s) em aberto
                </span>
              ) : null}
              {tenant.plan ? (
                <span>
                  • Plano {tenant.plan.name}
                  {tenant.plan.price
                    ? ` (${formatValue(tenant.plan.price, "currency")} / ${tenant.plan.billing})`
                    : ""}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              as={NextLink}
              color="primary"
              href={`/admin/tenants?tenant=${tenant.slug}`}
              radius="full"
              size="sm"
              variant="flat"
            >
              Gerenciar tenant
            </Button>
            <p className="text-xs text-default-400">
              Ativo desde{" "}
              {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestTenants({ tenants }: { tenants: AdminTenantSummary[] }) {
  if (!tenants.length) {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur">
        <CardBody className="text-sm text-default-400">
          Ainda não existem novos tenants cadastrados.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => (
        <div
          key={tenant.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/60 p-3"
        >
          <div>
            <p className="text-sm font-semibold text-white">{tenant.name}</p>
            <p className="text-xs text-default-400">{tenant.slug}</p>
            <p className="text-xs text-default-500">
              Criado em {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="text-right text-xs text-default-500">
            <p>{tenant.users} usuários</p>
            <p>{tenant.processos} processos</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTimeline({ entries }: { entries: AdminAuditEntry[] }) {
  if (!entries.length) {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur">
        <CardBody className="text-sm text-default-400">
          Nenhum evento registrado recentemente pela auditoria.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="relative border-l border-white/10 pl-4">
          <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
          <p className="text-xs text-default-400">
            {new Date(entry.createdAt).toLocaleString("pt-BR")}
          </p>
          <p className="text-sm font-medium text-white">{entry.action}</p>
          <p className="text-xs text-default-500">{entry.summary}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={`stat-skeleton-${index}`}
            className="border border-white/10 bg-background/70"
          >
            <CardBody className="space-y-3">
              <Skeleton className="h-4 w-32 rounded-lg" isLoaded={false} />
              <Skeleton className="h-7 w-20 rounded-lg" isLoaded={false} />
              <Skeleton className="h-3 w-40 rounded-lg" isLoaded={false} />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border border-white/10 bg-background/70">
        <CardHeader className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded-lg" isLoaded={false} />
          <Skeleton className="h-8 w-24 rounded-full" isLoaded={false} />
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton
              key={`chart-skeleton-${index}`}
              className="h-40 w-full rounded-xl"
              isLoaded={false}
            />
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-white/10 bg-background/70">
          <CardHeader>
            <Skeleton className="h-5 w-60 rounded-lg" isLoaded={false} />
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`tenant-skeleton-${index}`}
                className="h-20 w-full rounded-xl"
                isLoaded={false}
              />
            ))}
          </CardBody>
        </Card>
        <Card className="border border-white/10 bg-background/70">
          <CardHeader>
            <Skeleton className="h-5 w-40 rounded-lg" isLoaded={false} />
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`alert-skeleton-${index}`}
                className="h-14 w-full rounded-xl"
                isLoaded={false}
              />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function AdminDashboardContent() {
  const { data, error, isLoading } = useSWR<AdminDashboardData>(
    "admin-dashboard-overview",
    fetchAdminDashboard,
    {
      revalidateOnFocus: false,
    },
  );

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 py-6 px-2 sm:py-8 sm:px-4 md:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              🔑 Inteligência corporativa da Magic Lawyer
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Visão executiva com faturamento, crescimento de tenants e sinais
              de atenção
            </p>
          </div>
          <div className="flex items-center gap-2" />
        </div>
      </header>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                Não foi possível carregar as métricas
              </p>
              <p className="text-sm text-danger/80">
                {error instanceof Error ? error.message : "Erro inesperado"}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {(!data && isLoading) || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          <StatsGrid stats={data.stats} />

          <Card className="border border-white/10 bg-background/70 backdrop-blur">
            <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  📈 Tendências de receita e crescimento
                </h2>
                <p className="text-sm text-default-400">
                  Acompanhe o pulso financeiro da plataforma e o ritmo de novos
                  tenants.
                </p>
              </div>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-default-400">
                    Receita confirmada (últimos 6 meses)
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {formatValue(data.totals.totalRevenueAllTime, "currency")}
                  </p>
                </div>
                <SparklineChart points={data.revenueSeries} tone="primary" />
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-default-400">
                    Novos tenants mensais
                  </p>
                  <SparklineChart
                    points={data.tenantGrowthSeries}
                    tone="secondary"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-default-400">
                    Usuários criados por mês
                  </p>
                  <SparklineChart
                    points={data.userGrowthSeries}
                    tone="success"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardHeader className="flex flex-col gap-2 pb-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    🏆 Tenants de maior valor
                  </h2>
                  <p className="text-sm text-default-400">
                    Monitoramento dos escritórios que mais contribuem para o
                    faturamento nos últimos 90 dias.
                  </p>
                </div>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody>
                <TenantsTable tenants={data.topTenants} />
              </CardBody>
            </Card>

            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardHeader className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    🔔 Alertas
                  </h2>
                  <p className="text-sm text-default-400">
                    Situações que exigem acompanhamento do super admin.
                  </p>
                </div>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody>
                <AlertsList alerts={data.alerts} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardHeader className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    🆕 Entradas recentes
                  </h2>
                  <p className="text-sm text-default-400">
                    Últimos tenants implantados na plataforma.
                  </p>
                </div>
                <Button
                  as={NextLink}
                  color="primary"
                  href="/admin/tenants"
                  radius="full"
                  size="sm"
                  variant="flat"
                >
                  Ver todos
                </Button>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody>
                <LatestTenants tenants={data.latestTenants} />
              </CardBody>
            </Card>

            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardHeader className="flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    🗂️ Auditoria executiva
                  </h2>
                  <p className="text-sm text-default-400">
                    Acompanha as últimas ações de super admins.
                  </p>
                </div>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody>
                <AuditTimeline entries={data.auditLog} />
              </CardBody>
            </Card>
          </div>

          <Card className="border border-white/10 bg-background/70 backdrop-blur">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  🧮 Resumo numérico
                </h2>
                <p className="text-sm text-default-400">
                  Totalizadores globais do Magic Lawyer
                </p>
              </div>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Tenants ativos
                </p>
                <p className="text-xl font-semibold text-white">
                  {data.totals.activeTenants} / {data.totals.totalTenants}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Usuários ativos
                </p>
                <p className="text-xl font-semibold text-white">
                  {data.totals.activeUsers} / {data.totals.totalUsers}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Clientes cadastrados
                </p>
                <p className="text-xl font-semibold text-white">
                  {numberFormatter.format(data.totals.totalClientes)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Processos totais
                </p>
                <p className="text-xl font-semibold text-white">
                  {numberFormatter.format(data.totals.totalProcessos)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Receita acumulada
                </p>
                <p className="text-xl font-semibold text-success">
                  {formatValue(data.totals.totalRevenueAllTime, "currency")}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Ticket médio por tenant
                </p>
                <p className="text-xl font-semibold text-secondary">
                  {formatValue(data.totals.averageRevenuePerTenant, "currency")}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Faturamento 30 dias
                </p>
                <p className="text-xl font-semibold text-primary">
                  {formatValue(data.totals.revenueLast30Days, "currency")}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                <p className="text-xs uppercase text-default-400">
                  Faturas pendentes
                </p>
                <p className="text-xl font-semibold text-warning">
                  {numberFormatter.format(data.totals.outstandingInvoices)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </section>
  );
}
