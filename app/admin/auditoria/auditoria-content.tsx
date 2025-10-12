"use client";

import React from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { title, subtitle } from "@/components/primitives";
import { getSystemAuditLogs } from "@/app/actions/auditoria";

export function AuditoriaContent() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR("system-audit-logs", () => getSystemAuditLogs(100), {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });

  const logs = data?.data?.logs ?? [];
  const summary = data?.data?.summary;

  const totalLogs = summary?.total ?? 0;
  const totalCreates = summary?.porCategoria.create ?? 0;
  const totalUpdates = summary?.porCategoria.update ?? 0;
  const totalDeletes = summary?.porCategoria.delete ?? 0;

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
            <Button color="primary" variant="flat">
              📥 Exportar Logs
            </Button>
            <Button
              color="secondary"
              isDisabled={isLoading}
              onPress={() => mutate()}
              variant="flat"
            >
              🔄 Atualizar
            </Button>
          </div>
        </div>
      </header>

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
              <p className="text-2xl font-bold text-green-600">{totalCreates}</p>
              <p className="text-sm text-gray-600">Novos registros</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">✏️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Atualizações</p>
              <p className="text-2xl font-bold text-yellow-600">{totalUpdates}</p>
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
                          <span className="text-sm text-white">{origemLabel}</span>
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
                              Campos alterados: {camposAlterados.slice(0, 3).join(", ")}
                              {camposAlterados.length > 3
                                ? ` +${camposAlterados.length - 3}`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-default-400">
                              {log.dadosNovos ? "Dados atualizados" : "Sem alterações registradas"}
                            </span>
                          )}
                          <Button color="primary" size="sm" variant="light">
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
    </section>
  );
}
