"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { RangeCalendar } from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { Download, Filter, Info, Shield, Users } from "lucide-react";
import { toast } from "sonner";

import { title, subtitle } from "@/components/primitives";
import {
  exportSystemAuditLogs,
  getSystemAuditLogs,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/app/actions/auditoria";

function formatCalendarRange(value?: RangeValue<CalendarDate> | null) {
  if (!value?.start) {
    return "Selecionar intervalo";
  }

  const startDate = value.start.toDate(getLocalTimeZone());
  const endDate = value.end?.toDate(getLocalTimeZone()) ?? startDate;

  return `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`;
}

function formatJson(data: unknown) {
  if (!data) {
    return "{}";
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Erro ao formatar JSON de auditoria", error);

    return String(data);
  }
}

export function AuditoriaContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fonteFiltro, setFonteFiltro] = useState<
    "ALL" | "SUPER_ADMIN" | "TENANT"
  >("ALL");
  const [entidadeFiltro, setEntidadeFiltro] = useState<string>("ALL");
  const [acaoFiltro, setAcaoFiltro] = useState<string>("ALL");
  const [calendarRange, setCalendarRange] =
    useState<RangeValue<CalendarDate> | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filters: AuditLogFilters = useMemo(() => {
    const startIso = calendarRange?.start
      ? calendarRange.start.toDate(getLocalTimeZone()).toISOString()
      : undefined;
    const endIso = calendarRange?.end
      ? calendarRange.end.toDate(getLocalTimeZone()).toISOString()
      : undefined;

    return {
      limit: 250,
      search: searchTerm || undefined,
      fonte: fonteFiltro === "ALL" ? undefined : fonteFiltro,
      entidade: entidadeFiltro === "ALL" ? undefined : entidadeFiltro,
      acao: acaoFiltro === "ALL" ? undefined : acaoFiltro,
      startDate: startIso,
      endDate: endIso,
    };
  }, [searchTerm, fonteFiltro, entidadeFiltro, acaoFiltro, calendarRange]);

  const { data, error, isLoading } = useSWR(
    ["system-audit-logs", filters],
    ([, params]) => getSystemAuditLogs(params),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    },
  );

  const logs = data?.data?.logs ?? [];
  const summary = data?.data?.summary;

  const totalLogs = summary?.total ?? 0;
  const totalCreates = summary?.porCategoria.create ?? 0;
  const totalUpdates = summary?.porCategoria.update ?? 0;
  const totalDeletes = summary?.porCategoria.delete ?? 0;

  const entidadeOptions = useMemo(() => {
    const set = new Set<string>();

    logs.forEach((log) => {
      if (log.entidade) {
        set.add(log.entidade);
      }
    });

    return [
      { key: "ALL", label: "Todas" },
      ...Array.from(set)
        .sort()
        .map((entidade) => ({
          key: entidade,
          label: entidade.replace(/_/g, " "),
        })),
    ];
  }, [logs]);

  const acaoOptions = useMemo(() => {
    const set = new Set<string>();

    logs.forEach((log) => {
      if (log.acao) {
        set.add(log.acao);
      }
    });

    return [
      { key: "ALL", label: "Todas" },
      ...Array.from(set)
        .sort()
        .map((acao) => ({
          key: acao,
          label: acao.replace(/_/g, " "),
        })),
    ];
  }, [logs]);

  const getActionColor = (acao: string) => {
    if (acao.includes("CREATE")) return "success";
    if (acao.includes("UPDATE")) return "warning";
    if (acao.includes("DELETE")) return "danger";

    return "default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              Auditoria do Sistema
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Logs de todas as ações administrativas realizadas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              color="primary"
              isLoading={isExporting}
              startContent={<Download className="h-4 w-4" />}
              variant="flat"
              onPress={async () => {
                try {
                  setIsExporting(true);
                  const response = await exportSystemAuditLogs(filters);

                  if (
                    !response.success ||
                    !response.data ||
                    !response.filename
                  ) {
                    throw new Error(response.error ?? "Falha ao exportar logs");
                  }

                  const blob = new Blob([response.data], {
                    type: "text/csv;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");

                  link.href = url;
                  link.download = response.filename;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Logs exportados com sucesso");
                } catch (err) {
                  console.error(err);
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Não foi possível exportar os logs",
                  );
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              Exportar Logs
            </Button>
          </div>
        </div>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex items-center gap-2 pb-2">
          <Filter className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-white">Filtros</h2>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <Input
            label="Busca"
            placeholder="Buscar por ação, entidade ou usuário"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select
            label="Origem"
            selectedKeys={[fonteFiltro]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as
                | typeof fonteFiltro
                | undefined;

              setFonteFiltro(value ?? "ALL");
            }}
          >
            <SelectItem key="ALL">Todas</SelectItem>
            <SelectItem key="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem key="TENANT">Tenant</SelectItem>
          </Select>
          <Select
            label="Entidade"
            items={entidadeOptions}
            selectedKeys={[entidadeFiltro]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string | undefined;

              setEntidadeFiltro(value ?? "ALL");
            }}
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>
          <Select
            label="Ação"
            items={acaoOptions}
            selectedKeys={[acaoFiltro]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string | undefined;

              setAcaoFiltro(value ?? "ALL");
            }}
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-default-400">Período</span>
            <Popover offset={10} placement="bottom">
              <PopoverTrigger>
                <Button className="justify-start" variant="flat">
                  {formatCalendarRange(calendarRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <RangeCalendar
                  aria-label="Filtro de período"
                  value={calendarRange as any}
                  onChange={(value) =>
                    setCalendarRange((value as RangeValue<CalendarDate> | null) ?? null)
                  }
                />
              </PopoverContent>
            </Popover>
            {calendarRange ? (
              <Button
                size="sm"
                variant="light"
                onPress={() => setCalendarRange(null)}
              >
                Limpar período
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📝</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Logs</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
              <p className="text-sm text-blue-600">Últimos 30 dias</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">✅</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Criações</p>
              <p className="text-2xl font-bold text-green-600">
                {totalCreates}
              </p>
              <p className="text-sm text-gray-600">Novos registros</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">✏️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Atualizações</p>
              <p className="text-2xl font-bold text-yellow-600">
                {totalUpdates}
              </p>
              <p className="text-sm text-gray-600">Modificações</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-red-600 mr-4">🗑️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Exclusões</p>
              <p className="text-2xl font-bold text-red-600">{totalDeletes}</p>
              <p className="text-sm text-gray-600">Registros removidos</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabela de Logs */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Logs de Auditoria
          </h2>
          <p className="text-sm text-default-400">
            Histórico detalhado de todas as ações administrativas
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Não foi possível carregar os logs
              </h3>
              <p className="text-default-400">
                {(error as Error)?.message ||
                  "Tente atualizar a página ou tente novamente mais tarde."}
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Carregando logs...
              </h3>
              <p className="text-default-400">
                Buscando os registros de auditoria mais recentes.
              </p>
            </div>
          ) : logs.length > 0 ? (
            <Table aria-label="Tabela de Logs de Auditoria">
              <TableHeader>
                <TableColumn>Data/Hora</TableColumn>
                <TableColumn>Ação</TableColumn>
                <TableColumn>Entidade</TableColumn>
                <TableColumn>Origem</TableColumn>
                <TableColumn>IP</TableColumn>
                <TableColumn>Detalhes</TableColumn>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const origemLabel =
                    log.fonte === "SUPER_ADMIN" ? "Super Admin" : "Tenant";
                  const origemDescricao =
                    log.fonte === "SUPER_ADMIN"
                      ? log.superAdmin?.nome || log.superAdmin?.email || "—"
                      : log.tenant?.nome || log.usuario?.nome || "—";
                  const camposAlterados = log.changedFields ?? [];

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="capitalize"
                          color={getActionColor(log.acao) as any}
                          variant="flat"
                        >
                          {log.acao.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {log.entidade.replace(/_/g, " ")}
                          </span>
                          {log.entidadeId && (
                            <span className="text-xs text-default-400">
                              ID: {log.entidadeId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-white">
                            {origemLabel}
                          </span>
                          <span className="text-xs text-default-400">
                            {origemDescricao}
                          </span>
                          {log.tenant?.slug && log.fonte !== "SUPER_ADMIN" && (
                            <span className="text-xs text-primary">
                              {log.tenant.slug}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-400">
                          {log.ipAddress || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {camposAlterados.length > 0 ? (
                            <span className="text-xs text-default-400">
                              Campos alterados:{" "}
                              {camposAlterados.slice(0, 3).join(", ")}
                              {camposAlterados.length > 3
                                ? ` +${camposAlterados.length - 3}`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-default-400">
                              {log.dadosNovos
                                ? "Dados atualizados"
                                : "Sem alterações registradas"}
                            </span>
                          )}
                          <Button
                            color="primary"
                            size="sm"
                            startContent={<Info className="h-3.5 w-3.5" />}
                            variant="light"
                            onPress={() => {
                              setSelectedLog(log);
                              setIsDetailsOpen(true);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-default-400 mb-4">
                Os logs de auditoria aparecerão aqui conforme as ações forem
                registradas no sistema.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
      <Modal
        isOpen={isDetailsOpen}
        scrollBehavior="inside"
        size="xl"
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSelectedLog(null);
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-sm uppercase tracking-widest text-primary">
                  Detalhes do Log
                </span>
                <div className="flex items-center gap-3">
                  <Badge
                    color={
                      selectedLog?.fonte === "SUPER_ADMIN"
                        ? "secondary"
                        : "primary"
                    }
                  >
                    {selectedLog?.fonte === "SUPER_ADMIN"
                      ? "Super Admin"
                      : "Tenant"}
                  </Badge>
                  <Badge
                    color={getActionColor(selectedLog?.acao ?? "") as any}
                    variant="flat"
                  >
                    {selectedLog?.acao
                      ? selectedLog.acao.replace(/_/g, " ")
                      : ""}
                  </Badge>
                </div>
                <span className="text-xs text-default-400">
                  {selectedLog ? formatDate(selectedLog.createdAt) : ""}
                </span>
              </ModalHeader>
              <ModalBody>
                {selectedLog ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-default/20 p-4">
                        <h3 className="text-sm font-semibold text-white">
                          Origem
                        </h3>
                        <div className="mt-1 text-sm text-default-400">
                          <div className="flex items-center gap-2">
                            {selectedLog.fonte === "SUPER_ADMIN" ? (
                              <Shield className="h-4 w-4 text-secondary" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                            <span>
                              {selectedLog.fonte === "SUPER_ADMIN"
                                ? selectedLog.superAdmin?.nome ||
                                  selectedLog.superAdmin?.email ||
                                  "—"
                                : selectedLog.tenant?.nome ||
                                  selectedLog.usuario?.nome ||
                                  "—"}
                            </span>
                          </div>
                          {selectedLog.tenant?.slug ? (
                            <p className="text-xs text-default-500">
                              Tenant: {selectedLog.tenant.slug}
                            </p>
                          ) : null}
                          {selectedLog.superAdmin?.email &&
                          selectedLog.fonte === "SUPER_ADMIN" ? (
                            <p className="text-xs text-default-500">
                              Email: {selectedLog.superAdmin.email}
                            </p>
                          ) : null}
                          {selectedLog.usuario?.email &&
                          selectedLog.fonte === "TENANT" ? (
                            <p className="text-xs text-default-500">
                              Email: {selectedLog.usuario.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-default/20 p-4">
                        <h3 className="text-sm font-semibold text-white">
                          Metadados
                        </h3>
                        <dl className="mt-1 space-y-2 text-sm text-default-400">
                          <div className="flex flex-col">
                            <dt className="text-xs uppercase tracking-widest text-default-500">
                              Entidade
                            </dt>
                            <dd>
                              {selectedLog.entidade
                                ? selectedLog.entidade.replace(/_/g, " ")
                                : "—"}
                            </dd>
                          </div>
                          {selectedLog.entidadeId ? (
                            <div className="flex flex-col">
                              <dt className="text-xs uppercase tracking-widest text-default-500">
                                ID da Entidade
                              </dt>
                              <dd>{selectedLog.entidadeId}</dd>
                            </div>
                          ) : null}
                          <div className="flex flex-col">
                            <dt className="text-xs uppercase tracking-widest text-default-500">
                              IP / User Agent
                            </dt>
                            <dd>{selectedLog.ipAddress ?? "—"}</dd>
                            <dd className="text-xs text-default-500">
                              {selectedLog.userAgent ?? "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">
                        Campos Alterados
                      </h3>
                      {selectedLog.changedFields &&
                      selectedLog.changedFields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedLog.changedFields.map((field) => (
                            <Badge key={field} color="primary" variant="flat">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-default-400">
                          Nenhuma alteração registrada.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Dados Anteriores
                        </h3>
                        <pre className="max-h-60 overflow-auto rounded-lg bg-default-50/50 p-4 text-xs text-default-300">
                          {formatJson(selectedLog.dadosAntigos)}
                        </pre>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Dados Novos
                        </h3>
                        <pre className="max-h-60 overflow-auto rounded-lg bg-default-50/50 p-4 text-xs text-default-300">
                          {formatJson(selectedLog.dadosNovos)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-default-400">
                    Nenhum log selecionado.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => onClose()}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
