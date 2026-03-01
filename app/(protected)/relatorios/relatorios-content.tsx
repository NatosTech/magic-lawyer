"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { type DateValue, getLocalTimeZone } from "@internationalized/date";
import { Input } from "@heroui/input";
import type { RangeValue } from "@react-types/shared";

import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Download, Search } from "lucide-react";
import { toast } from "@/lib/toast";

import { type RelatorioPeriodo, type RelatoriosTenantData } from "@/app/actions/relatorios";
import { useRelatorios } from "@/app/hooks/use-relatorios";
import { PeopleMetricCard, PeoplePageHeader, PeoplePanel } from "@/components/people-ui";
import { Select, SelectItem } from "@heroui/react";
import { DateRangeInput } from "@/components/ui/date-range-input";

const PERIOD_OPTIONS: Array<{ key: RelatorioPeriodo; label: string }> = [
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "180d", label: "Últimos 180 dias" },
  { key: "365d", label: "Últimos 12 meses" },
];

const REPORT_CATEGORY_OPTIONS = [
  { key: "TODAS", label: "Todas categorias" },
  { key: "GERENCIAL", label: "Gerencial" },
  { key: "FINANCEIRO", label: "Financeiro" },
  { key: "OPERACIONAL", label: "Operacional" },
  { key: "CLIENTES", label: "Clientes" },
  { key: "JURIDICO", label: "Jurídico" },
  { key: "COMPLIANCE", label: "Compliance" },
] as const;

const REPORT_STATUS_OPTIONS = [
  { key: "TODOS", label: "Todos status" },
  { key: "PRONTO", label: "Pronto para exportar" },
  { key: "ATENCAO", label: "Requer atenção" },
] as const;

const REPORT_FORMAT_FILTER_OPTIONS = [
  { key: "TODOS", label: "Todos formatos" },
  { key: "csv", label: "CSV" },
  { key: "xlsx", label: "XLSX" },
  { key: "pdf", label: "PDF" },
] as const;

const EXPORT_FORMAT_OPTIONS = [
  { key: "csv", label: "CSV" },
  { key: "xlsx", label: "XLSX" },
  { key: "pdf", label: "PDF" },
] as const;

type ReportCategoryFilter = (typeof REPORT_CATEGORY_OPTIONS)[number]["key"];
type ReportCategory = Exclude<ReportCategoryFilter, "TODAS">;
type ReportStatusFilter = (typeof REPORT_STATUS_OPTIONS)[number]["key"];
type ReportStatus = Exclude<ReportStatusFilter, "TODOS">;
type ReportFormatFilter = (typeof REPORT_FORMAT_FILTER_OPTIONS)[number]["key"];
type ExportFormat = (typeof EXPORT_FORMAT_OPTIONS)[number]["key"];

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  GERENCIAL: "Gerencial",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional",
  CLIENTES: "Clientes",
  JURIDICO: "Jurídico",
  COMPLIANCE: "Compliance",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  PRONTO: "Pronto",
  ATENCAO: "Atenção",
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV",
  xlsx: "XLSX",
  pdf: "PDF",
};

interface PrebuiltReportItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: ReportCategory;
  periodicidade: string;
  base: string;
  registros: number;
  status: ReportStatus;
  atualizadoEm: string;
  formatos: ExportFormat[];
  rows: string[][];
}

type PeriodoRange = RangeValue<DateValue>;

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

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvEscape(value: unknown) {
  const serialized = String(value ?? "");

  return `"${serialized.replace(/"/g, '""')}"`;
}

function getSingleSelectionKey(keys: unknown): string | undefined {
  if (!keys || keys === "all") {
    return undefined;
  }

  const selected = Array.from(keys as Set<string>)[0];

  return typeof selected === "string" ? selected : undefined;
}

function buildCsvFromRows(rows: string[][]) {
  return rows.map((row) => row.map(csvEscape).join(";")).join("\n");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCsvFile(rows: string[][], fileName: string) {
  const csvContent = buildCsvFromRows(rows);
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, fileName);
}

async function exportXlsxFile(rows: string[][], fileName: string) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
  XLSX.writeFile(workbook, fileName);
}

async function exportPdfFile(
  reportName: string,
  rows: string[][],
  fileName: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(14);
  doc.text(reportName, 40, 42);
  doc.setFontSize(10);

  let cursorY = 66;

  rows.forEach((row, index) => {
    const line = row.join(" | ");
    const wrapped = doc.splitTextToSize(line, pageWidth - 80);
    const rowHeight = wrapped.length * 14 + (index === 0 ? 10 : 6);

    if (cursorY + rowHeight > pageHeight - 40) {
      doc.addPage();
      cursorY = 40;
    }

    doc.text(wrapped, 40, cursorY);
    cursorY += rowHeight;
  });

  doc.save(fileName);
}

function buildReportCatalog(data: RelatoriosTenantData): PrebuiltReportItem[] {
  const agendaConsolidada = [
    ...data.agenda.prazosProximos,
    ...data.agenda.eventosProximos,
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const processosPorStatus = data.distribuicoes.processosPorStatus.filter(
    (item) => item.total > 0,
  );
  const tarefasPorStatus = data.distribuicoes.tarefasPorStatus.filter(
    (item) => item.total > 0,
  );
  const riscoImediato = data.resumo.prazosUrgentes + data.resumo.faturasVencidas;
  const intervaloBase = `Últimos ${data.intervalo.dias} dias`;
  const mesesBase = `${data.seriesMensais.length} meses`;

  return [
    {
      id: "resumo-executivo",
      nome: "Resumo executivo do tenant",
      descricao: "KPIs centrais para diretoria, operação e financeiro.",
      categoria: "GERENCIAL",
      periodicidade: "Sob demanda",
      base: intervaloBase,
      registros: 10,
      status: riscoImediato > 0 ? "ATENCAO" : "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx", "pdf"],
      rows: [
        ["Indicador", "Valor"],
        ["Processos ativos", formatInteger(data.resumo.processosAtivos)],
        ["Processos novos", formatInteger(data.resumo.processosNovos)],
        ["Clientes ativos", formatInteger(data.resumo.clientesAtivos)],
        ["Novos clientes", formatInteger(data.resumo.novosClientes)],
        ["Contratos ativos", formatInteger(data.resumo.contratosAtivos)],
        ["Receita do período", formatCurrency(data.resumo.receitaPeriodo)],
        [
          "Variação receita (%)",
          `${data.resumo.variacaoReceita >= 0 ? "+" : ""}${data.resumo.variacaoReceita.toFixed(2)}%`,
        ],
        ["Tarefas abertas", formatInteger(data.resumo.tarefasAbertas)],
        ["Prazos urgentes", formatInteger(data.resumo.prazosUrgentes)],
        ["Faturas vencidas", formatInteger(data.resumo.faturasVencidas)],
      ],
    },
    {
      id: "receita-mensal",
      nome: "Receita mensal consolidada",
      descricao: "Evolução de recebimentos confirmados por mês.",
      categoria: "FINANCEIRO",
      periodicidade: "Mensal",
      base: mesesBase,
      registros: data.seriesMensais.length,
      status:
        data.resumo.variacaoReceita < 0 || data.resumo.faturasVencidas > 0
          ? "ATENCAO"
          : "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx", "pdf"],
      rows: [
        ["Mês", "Receita confirmada", "Variação acumulada"],
        ...data.seriesMensais.map((item) => [
          item.mes,
          formatCurrency(item.receita),
          formatInteger(item.processos + item.clientes + item.tarefasConcluidas),
        ]),
      ],
    },
    {
      id: "pipeline-processos",
      nome: "Pipeline de processos por status",
      descricao: "Distribuição da carteira processual por estágio.",
      categoria: "OPERACIONAL",
      periodicidade: "Semanal",
      base: intervaloBase,
      registros: processosPorStatus.length,
      status: "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx", "pdf"],
      rows: [
        ["Status", "Total"],
        ...(processosPorStatus.length > 0
          ? processosPorStatus.map((item) => [item.label, formatInteger(item.total)])
          : [["Sem registros", "0"]]),
      ],
    },
    {
      id: "backlog-tarefas",
      nome: "Backlog de tarefas da equipe",
      descricao: "Situação atual das tarefas por status de execução.",
      categoria: "OPERACIONAL",
      periodicidade: "Diária",
      base: intervaloBase,
      registros: tarefasPorStatus.length,
      status: data.resumo.tarefasAbertas > 0 ? "ATENCAO" : "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx"],
      rows: [
        ["Status", "Total"],
        ...(tarefasPorStatus.length > 0
          ? tarefasPorStatus.map((item) => [item.label, formatInteger(item.total)])
          : [["Sem registros", "0"]]),
      ],
    },
    {
      id: "carteira-clientes",
      nome: "Ranking da carteira de clientes",
      descricao: "Top clientes por faturamento e volume de processos.",
      categoria: "CLIENTES",
      periodicidade: "Mensal",
      base: "Top 5 clientes",
      registros: data.rankings.clientes.length,
      status: "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx", "pdf"],
      rows: [
        ["Cliente", "Processos", "Contratos", "Faturamento"],
        ...(data.rankings.clientes.length > 0
          ? data.rankings.clientes.map((item) => [
              item.nome,
              formatInteger(item.processos),
              formatInteger(item.contratos),
              formatCurrency(item.faturamento),
            ])
          : [["Sem clientes", "0", "0", formatCurrency(0)]]),
      ],
    },
    {
      id: "agenda-critica",
      nome: "Agenda crítica (15 dias)",
      descricao: "Prazos e eventos próximos para gestão preventiva.",
      categoria: "JURIDICO",
      periodicidade: "Diária",
      base: "Próximos 15 dias",
      registros: agendaConsolidada.length,
      status: agendaConsolidada.length > 0 ? "ATENCAO" : "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "pdf"],
      rows: [
        ["Tipo", "Título", "Referência", "Data"],
        ...(agendaConsolidada.length > 0
          ? agendaConsolidada.map((item) => [
              item.tipo,
              item.titulo,
              item.referencia || "-",
              formatDateTime(item.data),
            ])
          : [["Sem itens críticos", "-", "-", "-"]]),
      ],
    },
    {
      id: "risco-conformidade",
      nome: "Risco e conformidade",
      descricao: "Consolidação de sinais de risco operacional e financeiro.",
      categoria: "COMPLIANCE",
      periodicidade: "Semanal",
      base: intervaloBase,
      registros: 4,
      status: riscoImediato > 0 ? "ATENCAO" : "PRONTO",
      atualizadoEm: data.intervalo.fim,
      formatos: ["csv", "xlsx", "pdf"],
      rows: [
        ["Indicador", "Total"],
        ["Prazos urgentes", formatInteger(data.resumo.prazosUrgentes)],
        ["Faturas vencidas", formatInteger(data.resumo.faturasVencidas)],
        ["Tarefas abertas", formatInteger(data.resumo.tarefasAbertas)],
        ["Risco imediato consolidado", formatInteger(riscoImediato)],
      ],
    },
  ];
}

export function RelatoriosContent() {
  const [periodo, setPeriodo] = useState<RelatorioPeriodo>("90d");
  const [periodoRange, setPeriodoRange] = useState<PeriodoRange | null>(null);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] =
    useState<ReportCategoryFilter>("TODAS");
  const [statusFiltro, setStatusFiltro] = useState<ReportStatusFilter>("TODOS");
  const [formatoFiltro, setFormatoFiltro] =
    useState<ReportFormatFilter>("TODOS");
  const [formatoExportacao, setFormatoExportacao] =
    useState<ExportFormat>("csv");
  const [exportingReportId, setExportingReportId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError, error, refresh } = useRelatorios(periodo);

  const periodKeySet = useMemo(
    () => new Set(PERIOD_OPTIONS.map((option) => option.key)),
    [],
  );
  const categoryKeySet = useMemo(
    () => new Set(REPORT_CATEGORY_OPTIONS.map((option) => option.key)),
    [],
  );
  const statusKeySet = useMemo(
    () => new Set(REPORT_STATUS_OPTIONS.map((option) => option.key)),
    [],
  );
  const formatFilterKeySet = useMemo(
    () => new Set(REPORT_FORMAT_FILTER_OPTIONS.map((option) => option.key)),
    [],
  );
  const exportFormatKeySet = useMemo(
    () => new Set(EXPORT_FORMAT_OPTIONS.map((option) => option.key)),
    [],
  );

  const selectedPeriodKeys = periodKeySet.has(periodo) ? [periodo] : ["90d"];
  const selectedCategoryKeys = categoryKeySet.has(categoriaFiltro)
    ? [categoriaFiltro]
    : ["TODAS"];
  const selectedStatusKeys = statusKeySet.has(statusFiltro)
    ? [statusFiltro]
    : ["TODOS"];
  const selectedFormatFilterKeys = formatFilterKeySet.has(formatoFiltro)
    ? [formatoFiltro]
    : ["TODOS"];
  const selectedExportFormatKeys = exportFormatKeySet.has(formatoExportacao)
    ? [formatoExportacao]
    : ["csv"];

  const reportCatalog = useMemo(
    () => (data ? buildReportCatalog(data) : []),
    [data],
  );

  const filteredReports = useMemo(() => {
    const normalizedSearch = busca.trim().toLowerCase();
    const startDate = periodoRange?.start
      ? new Date(periodoRange.start.toDate(getLocalTimeZone()))
      : null;
    const endDate = periodoRange?.end
      ? new Date(periodoRange.end.toDate(getLocalTimeZone()))
      : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return reportCatalog.filter((report) => {
      if (
        categoriaFiltro !== "TODAS" &&
        report.categoria !== categoriaFiltro
      ) {
        return false;
      }

      if (statusFiltro !== "TODOS" && report.status !== statusFiltro) {
        return false;
      }

      if (formatoFiltro !== "TODOS" && !report.formatos.includes(formatoFiltro)) {
        return false;
      }

      if (startDate || endDate) {
        const updatedAt = new Date(report.atualizadoEm);

        if (Number.isNaN(updatedAt.getTime())) {
          return false;
        }

        if (startDate && updatedAt < startDate) {
          return false;
        }

        if (endDate && updatedAt > endDate) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchTarget = [
        report.nome,
        report.descricao,
        CATEGORY_LABELS[report.categoria],
        report.periodicidade,
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(normalizedSearch);
    });
  }, [
    reportCatalog,
    busca,
    categoriaFiltro,
    statusFiltro,
    formatoFiltro,
    periodoRange,
  ]);

  const totalAlertas = useMemo(
    () => reportCatalog.filter((report) => report.status === "ATENCAO").length,
    [reportCatalog],
  );

  const handlePeriodoChange = (keys: unknown) => {
    const selected = getSingleSelectionKey(keys);

    if (
      typeof selected === "string" &&
      periodKeySet.has(selected as RelatorioPeriodo)
    ) {
      setPeriodo(selected as RelatorioPeriodo);
    }
  };

  const handleCategoriaChange = (keys: unknown) => {
    const selected = getSingleSelectionKey(keys);

    if (
      typeof selected === "string" &&
      categoryKeySet.has(selected as ReportCategoryFilter)
    ) {
      setCategoriaFiltro(selected as ReportCategoryFilter);
    }
  };

  const handleStatusChange = (keys: unknown) => {
    const selected = getSingleSelectionKey(keys);

    if (
      typeof selected === "string" &&
      statusKeySet.has(selected as ReportStatusFilter)
    ) {
      setStatusFiltro(selected as ReportStatusFilter);
    }
  };

  const handleFormatoFiltroChange = (keys: unknown) => {
    const selected = getSingleSelectionKey(keys);

    if (
      typeof selected === "string" &&
      formatFilterKeySet.has(selected as ReportFormatFilter)
    ) {
      setFormatoFiltro(selected as ReportFormatFilter);
    }
  };

  const handleFormatoExportacaoChange = (keys: unknown) => {
    const selected = getSingleSelectionKey(keys);

    if (
      typeof selected === "string" &&
      exportFormatKeySet.has(selected as ExportFormat)
    ) {
      setFormatoExportacao(selected as ExportFormat);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleExportReport = async (report: PrebuiltReportItem) => {
    if (!data) {
      return;
    }

    const finalFormat = report.formatos.includes(formatoExportacao)
      ? formatoExportacao
      : report.formatos[0];
    const fileBase = `${report.id}-${periodo}-${new Date().toISOString().slice(0, 10)}`;

    setExportingReportId(report.id);

    try {
      if (finalFormat === "csv") {
        exportCsvFile(report.rows, `${fileBase}.csv`);
      } else if (finalFormat === "xlsx") {
        await exportXlsxFile(report.rows, `${fileBase}.xlsx`);
      } else {
        await exportPdfFile(report.nome, report.rows, `${fileBase}.pdf`);
      }

      toast.success(`${report.nome} exportado em ${FORMAT_LABELS[finalFormat]}.`);
    } catch (exportError) {
      toast.error("Não foi possível exportar o relatório.");
    } finally {
      setExportingReportId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PeoplePageHeader
        description="Lista ERP para busca, filtro e exportação por formato conforme a necessidade do cliente."
        tag="Inteligência jurídica"
        title="Catálogo de relatórios pré-prontos"
      />

      {isError ? (
        <PeoplePanel
          description={(error as Error | undefined)?.message || "Tente novamente em instantes."}
          title="Não foi possível carregar os relatórios"
        >
          <Button color="danger" onPress={handleRefresh} size="sm" variant="flat">
            Tentar novamente
          </Button>
        </PeoplePanel>
      ) : null}

      <PeoplePanel
        description="Indicadores centrais para priorizar exportações e ações do período."
        title="Resumo executivo"
      >
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
            <PeopleMetricCard
              helper={`+${formatInteger(data.resumo.processosNovos)} novos no período`}
              label="Processos ativos"
              tone="primary"
              value={formatInteger(data.resumo.processosAtivos)}
            />
            <PeopleMetricCard
              helper={`+${formatInteger(data.resumo.novosClientes)} novos clientes`}
              label="Clientes ativos"
              tone="success"
              value={formatInteger(data.resumo.clientesAtivos)}
            />
            <PeopleMetricCard
              helper={`${data.resumo.variacaoReceita >= 0 ? "+" : ""}${data.resumo.variacaoReceita.toFixed(1)}% vs período anterior`}
              label="Receita"
              tone={data.resumo.variacaoReceita >= 0 ? "success" : "danger"}
              value={formatCurrency(data.resumo.receitaPeriodo)}
            />
            <PeopleMetricCard
              helper={`${formatInteger(data.resumo.contratosAtivos)} contratos ativos`}
              label="Backlog operacional"
              tone="warning"
              value={formatInteger(data.resumo.tarefasAbertas)}
            />
            <PeopleMetricCard
              helper={`${formatInteger(data.resumo.prazosUrgentes)} prazos + ${formatInteger(data.resumo.faturasVencidas)} faturas`}
              label="Risco imediato"
              tone={
                data.resumo.prazosUrgentes + data.resumo.faturasVencidas > 0
                  ? "danger"
                  : "default"
              }
              value={formatInteger(
                data.resumo.prazosUrgentes + data.resumo.faturasVencidas,
              )}
            />
          </div>
        )}
      </PeoplePanel>

      <PeoplePanel
        actions={
          <Chip
            color={totalAlertas > 0 ? "warning" : "success"}
            size="sm"
            variant="flat"
          >
            {totalAlertas > 0
              ? `${totalAlertas} com atenção`
              : "Sem alertas críticos"}
          </Chip>
        }
        description="Pesquisa, filtro e exportação por relatório."
        title="Lista de relatórios prontos"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            aria-label="Pesquisar relatório"
            placeholder="Buscar por nome, categoria ou periodicidade..."
            size="sm"
            startContent={<Search className="h-4 w-4 text-default-400" />}
            value={busca}
            onValueChange={setBusca}
          />
          <Select
            aria-label="Filtro de categoria"
            selectedKeys={selectedCategoryKeys}
            size="sm"
            onSelectionChange={handleCategoriaChange}
          >
            {REPORT_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Filtro de status"
            selectedKeys={selectedStatusKeys}
            size="sm"
            onSelectionChange={handleStatusChange}
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Filtro por formato"
            selectedKeys={selectedFormatFilterKeys}
            size="sm"
            onSelectionChange={handleFormatoFiltroChange}
          >
            {REPORT_FORMAT_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Período base"
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
          <DateRangeInput
            aria-label="Filtro por data de atualização"
            className="w-full"
            rangeValue={periodoRange}
            size="sm"
            onRangeValueChange={(value) => setPeriodoRange(value ?? null)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-default-500">
            Formato padrão de exportação
          </span>
          <Select
            aria-label="Formato de exportação"
            className="w-[180px]"
            selectedKeys={selectedExportFormatKeys}
            size="sm"
            onSelectionChange={handleFormatoExportacaoChange}
          >
            {EXPORT_FORMAT_OPTIONS.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto">
          {isLoading && !data ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table
              aria-label="Tabela de relatórios pré-prontos"
              classNames={{
                table: "min-w-[1120px]",
              }}
              removeWrapper
            >
              <TableHeader>
                <TableColumn>RELATÓRIO</TableColumn>
                <TableColumn>CATEGORIA</TableColumn>
                <TableColumn>PERIODICIDADE</TableColumn>
                <TableColumn>BASE</TableColumn>
                <TableColumn>REGISTROS</TableColumn>
                <TableColumn>ATUALIZADO EM</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>FORMATOS</TableColumn>
                <TableColumn>AÇÕES</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Nenhum relatório encontrado para os filtros selecionados.">
                {filteredReports.map((report) => {
                  const exportFormat = report.formatos.includes(formatoExportacao)
                    ? formatoExportacao
                    : report.formatos[0];

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <p className="font-medium text-white">{report.nome}</p>
                          <p className="text-xs text-default-400">
                            {report.descricao}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {CATEGORY_LABELS[report.categoria]}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-sm text-default-300">
                        {report.periodicidade}
                      </TableCell>
                      <TableCell className="text-sm text-default-300">
                        {report.base}
                      </TableCell>
                      <TableCell className="text-sm text-default-300">
                        {formatInteger(report.registros)}
                      </TableCell>
                      <TableCell className="text-sm text-default-400">
                        {formatDateTime(report.atualizadoEm)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={report.status === "ATENCAO" ? "warning" : "success"}
                          size="sm"
                          variant="flat"
                        >
                          {STATUS_LABELS[report.status]}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[160px] flex-wrap gap-1">
                          {report.formatos.map((format) => (
                            <Chip
                              key={`${report.id}-${format}`}
                              color={
                                format === exportFormat ? "primary" : "default"
                              }
                              size="sm"
                              variant={format === exportFormat ? "solid" : "flat"}
                            >
                              {FORMAT_LABELS[format]}
                            </Chip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          color="primary"
                          isDisabled={
                            exportingReportId !== null &&
                            exportingReportId !== report.id
                          }
                          isLoading={exportingReportId === report.id}
                          size="sm"
                          startContent={
                            exportingReportId === report.id ? null : (
                              <Download className="h-3.5 w-3.5" />
                            )
                          }
                          variant="flat"
                          onPress={() => handleExportReport(report)}
                        >
                          {exportingReportId === report.id
                            ? "Exportando..."
                            : `Exportar ${FORMAT_LABELS[exportFormat]}`}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </PeoplePanel>
    </div>
  );
}
