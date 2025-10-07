"use client";

import React from "react";
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

export function AuditoriaContent() {
  // Mock data - em produção viria de uma action
  const logs = [
    {
      id: "1",
      acao: "CREATE_TENANT",
      entidade: "TENANT",
      entidadeId: "tenant_123",
      superAdminId: "admin_123",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
      createdAt: "2025-01-04T10:30:00Z",
      dadosAntigos: null,
      dadosNovos: { nome: "Escritório Silva", slug: "silva" },
    },
    {
      id: "2",
      acao: "UPDATE_TENANT",
      entidade: "TENANT",
      entidadeId: "tenant_456",
      superAdminId: "admin_123",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
      createdAt: "2025-01-04T09:15:00Z",
      dadosAntigos: { status: "ACTIVE" },
      dadosNovos: { status: "SUSPENDED" },
    },
  ];

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
            <Button color="secondary" variant="flat">
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
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
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
                {logs.filter((l) => l.acao.includes("CREATE")).length}
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
                {logs.filter((l) => l.acao.includes("UPDATE")).length}
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
              <p className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.acao.includes("DELETE")).length}
              </p>
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
          {logs.length > 0 ? (
            <Table aria-label="Tabela de Logs de Auditoria">
              <TableHeader>
                <TableColumn>Data/Hora</TableColumn>
                <TableColumn>Ação</TableColumn>
                <TableColumn>Entidade</TableColumn>
                <TableColumn>IP</TableColumn>
                <TableColumn>Detalhes</TableColumn>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
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
                        {log.acao.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {log.entidade}
                        </span>
                        <span className="text-xs text-default-400">
                          ID: {log.entidadeId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-400">
                        {log.ipAddress}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button color="primary" size="sm" variant="light">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                realizadas
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
