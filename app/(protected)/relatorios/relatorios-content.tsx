"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { type RelatorioPeriodo, type RelatoriosTenantData } from "@/app/actions/relatorios";
import { useRelatorios } from "@/app/hooks/use-relatorios";
import { title, subtitle } from "@/components/primitives";

const PERIOD_OPTIONS: Array<{ key: RelatorioPeriodo; label: string }> = [
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "180d", label: "Últimos 180 dias" },
  { key: "365d", label: "Últimos 12 meses" },
];

const PIE_COLORS = ["#38bdf8", "#34d399", "#f59e0b", "#f87171", "#a78bfa"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvEscape(value: unknown) {
  const serialized = String(value ?? "");

  return `"${serialized.replace(/"/g, '""')}"`;
}

function buildCsv(data: RelatoriosTenantData) {
  const rows: string[][] = [];

  rows.push(["Relatório", "Tenant - Indicadores"]);
  rows.push(["Período", `${data.intervalo.dias} dias`]);
  rows.push(["Início", new Date(data.intervalo.inicio).toLocaleDateString("pt-BR")]);
  rows.push(["Fim", new Date(data.intervalo.fim).toLocaleDateString("pt-BR")]);
  rows.push([]);

  rows.push(["Resumo"]);
  rows.push(["Processos ativos", String(data.resumo.processosAtivos)]);
  rows.push(["Processos novos", String(data.resumo.processosNovos)]);
  rows.push(["Clientes ativos", String(data.resumo.clientesAtivos)]);
  rows.push(["Clientes novos", String(data.resumo.novosClientes)]);
  rows.push(["Contratos ativos", String(data.resumo.contratosAtivos)]);
  rows.push(["Receita no período", String(data.resumo.receitaPeriodo)]);
  rows.push(["Variação de receita (%)", String(data.resumo.variacaoReceita)]);
  rows.push(["Tarefas abertas", String(data.resumo.tarefasAbertas)]);
  rows.push(["Prazos urgentes", String(data.resumo.prazosUrgentes)]);
  rows.push(["Faturas vencidas", String(data.resumo.faturasVencidas)]);
  rows.push([]);

  rows.push(["Série mensal"]);
  rows.push(["Mês", "Processos", "Clientes", "Receita", "Tarefas concluídas"]);
  data.seriesMensais.forEach((item) => {
    rows.push([
      item.mes,
      String(item.processos),
      String(item.clientes),
      String(item.receita),
      String(item.tarefasConcluidas),
    ]);
  });
  rows.push([]);

  rows.push(["Processos por status"]);
  rows.push(["Status", "Total"]);
  data.distribuicoes.processosPorStatus.forEach((item) => {
    rows.push([item.label, String(item.total)]);
  });
  rows.push([]);

  rows.push(["Tarefas por status"]);
  rows.push(["Status", "Total"]);
  data.distribuicoes.tarefasPorStatus.forEach((item) => {
    rows.push([item.label, String(item.total)]);
  });
  rows.push([]);

  rows.push(["Top clientes"]);
  rows.push(["Cliente", "Processos", "Contratos", "Faturamento"]);
  data.rankings.clientes.forEach((item) => {
    rows.push([
      item.nome,
      String(item.processos),
      String(item.contratos),
      String(item.faturamento),
    ]);
  });

  return rows.map((row) => row.map(csvEscape).join(";")).join("\n");
}

function renderKpiCard(
  titleText: string,
  value: string,
  helper: string,
  tone: "primary" | "success" | "warning" | "danger" | "default",
) {
  const toneClassMap = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    success: "border-success/20 bg-success/5 text-success",
    warning: "border-warning/20 bg-warning/5 text-warning",
    danger: "border-danger/20 bg-danger/5 text-danger",
    default: "border-white/10 bg-background/40 text-white",
  } as const;

  const toneClass = toneClassMap[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-default-500">
        {titleText}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-default-400">{helper}</p>
    </div>
  );
}

export function RelatoriosContent() {
  const [periodo, setPeriodo] = useState<RelatorioPeriodo>("90d");
  const { data, isLoading, isError, error, refresh } = useRelatorios(periodo);
  const quickActions = [
    { label: "Processos", href: "/processos", icon: "⚖️" },
    { label: "Clientes", href: "/clientes", icon: "🤝" },
    { label: "Agenda", href: "/agenda", icon: "🗓️" },
    { label: "Financeiro", href: "/financeiro", icon: "💰" },
    { label: "Documentos", href: "/documentos", icon: "📁" },
    { label: "Configurações", href: "/configuracoes", icon: "⚙️" },
  ] as const;

  const periodKeySet = useMemo(
    () => new Set(PERIOD_OPTIONS.map((option) => option.key)),
    [],
  );
  const selectedPeriodKeys = periodKeySet.has(periodo) ? [periodo] : ["90d"];

  const agendaConsolidada = useMemo(() => {
    if (!data) return [];

    return [...data.agenda.prazosProximos, ...data.agenda.eventosProximos]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 8);
  }, [data]);

  const processosDistribuicao = useMemo(
    () =>
      (data?.distribuicoes.processosPorStatus || []).filter(
        (item) => item.total > 0,
      ),
    [data],
  );
  const tarefasDistribuicao = useMemo(
    () =>
      (data?.distribuicoes.tarefasPorStatus || []).filter(
        (item) => item.total > 0,
      ),
    [data],
  );

  const handlePeriodoChange = (keys: unknown) => {
    const selected = Array.from(keys as Set<string>)[0];

    if (
      typeof selected === "string" &&
      periodKeySet.has(selected as RelatorioPeriodo)
    ) {
      setPeriodo(selected as RelatorioPeriodo);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;

    const csvContent = buildCsv(data);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `relatorios-${periodo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-10 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Inteligência jurídica
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              Relatórios operacionais do escritório
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Visão consolidada de produtividade, receita e riscos para tomada
              de decisão diária.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Período do relatório"
              className="min-w-[220px]"
              selectedKeys={selectedPeriodKeys}
              size="sm"
              onSelectionChange={handlePeriodoChange}
            >
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.key} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Button color="primary" size="sm" variant="flat" onPress={refresh}>
              Atualizar
            </Button>
            <Button
              color="secondary"
              isDisabled={!data}
              size="sm"
              variant="flat"
              onPress={handleExportCsv}
            >
              Exportar CSV
            </Button>
          </div>
        </div>
      </header>

      {isError ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">
                Não foi possível carregar os relatórios
              </p>
              <p className="text-sm text-danger/80">
                {(error as Error | undefined)?.message ||
                  "Tente novamente em instantes."}
              </p>
            </div>
            <Button color="danger" variant="flat" onPress={refresh}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Resumo executivo</h2>
          <p className="text-sm text-default-400">
            Indicadores centrais do período selecionado.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {isLoading || !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`kpi-skeleton-${index}`}
                  className="h-24 animate-pulse rounded-2xl border border-white/10 bg-background/40"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {renderKpiCard(
                "Processos ativos",
                formatInteger(data.resumo.processosAtivos),
                `+${formatInteger(data.resumo.processosNovos)} novos no período`,
                "primary",
              )}
              {renderKpiCard(
                "Clientes ativos",
                formatInteger(data.resumo.clientesAtivos),
                `+${formatInteger(data.resumo.novosClientes)} novos clientes`,
                "success",
              )}
              {renderKpiCard(
                "Receita",
                formatCurrency(data.resumo.receitaPeriodo),
                `${data.resumo.variacaoReceita >= 0 ? "+" : ""}${data.resumo.variacaoReceita.toFixed(1)}% vs período anterior`,
                data.resumo.variacaoReceita >= 0 ? "success" : "danger",
              )}
              {renderKpiCard(
                "Backlog operacional",
                formatInteger(data.resumo.tarefasAbertas),
                `${formatInteger(data.resumo.contratosAtivos)} contratos ativos`,
                "warning",
              )}
              {renderKpiCard(
                "Risco imediato",
                formatInteger(data.resumo.prazosUrgentes + data.resumo.faturasVencidas),
                `${formatInteger(data.resumo.prazosUrgentes)} prazos + ${formatInteger(data.resumo.faturasVencidas)} faturas`,
                data.resumo.prazosUrgentes + data.resumo.faturasVencidas > 0
                  ? "danger"
                  : "default",
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Atalhos operacionais</h2>
          <p className="text-sm text-default-400">
            Rotas críticas para agir sobre os números do relatório.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                as={NextLink}
                className="h-auto w-full justify-start gap-3 rounded-2xl border border-white/10 bg-background/40 p-4 text-left hover:bg-white/10"
                href={action.href}
                variant="bordered"
              >
                <span aria-hidden className="text-2xl">
                  {action.icon}
                </span>
                <div className="min-w-0 text-left">
                  <p className="truncate font-semibold text-white">
                    {action.label}
                  </p>
                  <p className="text-xs text-default-400">
                    Abrir {action.label.toLowerCase()}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Receita mensal</h2>
            <p className="text-sm text-default-400">
              Evolução de recebimentos confirmados.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-72 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={data.seriesMensais}>
                    <defs>
                      <linearGradient id="relatoriosReceita" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="mes"
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 16, 0.92)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Area
                      dataKey="receita"
                      fill="url(#relatoriosReceita)"
                      fillOpacity={1}
                      stroke="#38bdf8"
                      strokeWidth={2.2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Volume operacional</h2>
            <p className="text-sm text-default-400">
              Processos, clientes e tarefas concluídas por mês.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-72 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart data={data.seriesMensais}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="mes"
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 16, 0.92)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Legend />
                    <Line
                      dataKey="processos"
                      dot={false}
                      name="Processos"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="clientes"
                      dot={false}
                      name="Clientes"
                      stroke="#34d399"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="tarefasConcluidas"
                      dot={false}
                      name="Tarefas concluídas"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">
              Processos por status
            </h2>
            <p className="text-sm text-default-400">
              Distribuição atual do pipeline jurídico.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : processosDistribuicao.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={processosDistribuicao} layout="vertical">
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis hide type="number" />
                    <YAxis
                      axisLine={false}
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }}
                      tickLine={false}
                      type="category"
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 16, 0.92)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Bar dataKey="total" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Sem dados de processos para o período.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Tarefas por status</h2>
            <p className="text-sm text-default-400">
              Panorama do backlog operacional da equipe.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : tarefasDistribuicao.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={tarefasDistribuicao}
                      dataKey="total"
                      nameKey="label"
                      outerRadius={85}
                      strokeWidth={0}
                    >
                      {tarefasDistribuicao.map((item, index) => (
                        <Cell
                          key={`tarefas-status-${item.key}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 16, 0.92)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Sem dados de tarefas para o período.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Top clientes</h2>
            <p className="text-sm text-default-400">
              Ranking por faturamento e volume operacional.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : data.rankings.clientes.length > 0 ? (
              <div className="space-y-3">
                {data.rankings.clientes.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    className="grid grid-cols-[32px_1fr_auto_auto_auto] items-center gap-2 rounded-2xl border border-white/10 bg-background/40 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-default-400">
                      #{index + 1}
                    </span>
                    <span className="truncate text-sm text-white">
                      {cliente.nome}
                    </span>
                    <Chip size="sm" variant="flat">
                      {formatInteger(cliente.processos)} proc.
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {formatInteger(cliente.contratos)} ctr.
                    </Chip>
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(cliente.faturamento)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Ainda sem dados suficientes para ranking de clientes.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Agenda crítica</h2>
            <p className="text-sm text-default-400">
              Prazos e eventos mais próximos.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            {isLoading || !data ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : agendaConsolidada.length > 0 ? (
              <div className="space-y-3">
                {agendaConsolidada.map((item) => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className="rounded-2xl border border-white/10 bg-background/40 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Chip
                        color={item.tipo === "PRAZO" ? "danger" : "primary"}
                        size="sm"
                        variant="flat"
                      >
                        {item.tipo}
                      </Chip>
                      <span className="text-xs text-default-400">
                        {formatDateTime(item.data)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {item.titulo}
                    </p>
                    {item.referencia ? (
                      <p className="text-xs text-default-400">
                        Processo {item.referencia}
                      </p>
                    ) : null}
                    {item.href ? (
                      <Button
                        as={NextLink}
                        className="mt-2 p-0 text-xs text-primary"
                        href={item.href}
                        size="sm"
                        variant="light"
                      >
                        Abrir registro
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Sem itens críticos na agenda para os próximos dias.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
