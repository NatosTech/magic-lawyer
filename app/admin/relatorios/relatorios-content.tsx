"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";

import { title, subtitle } from "@/components/primitives";

export function RelatoriosContent() {
  const relatorios = [
    {
      id: "1",
      nome: "Relatório de Tenants",
      descricao: "Análise completa de todos os escritórios cadastrados",
      categoria: "Tenants",
      frequencia: "Mensal",
      ultimaExecucao: "2025-01-01",
      status: "Ativo",
    },
    {
      id: "2",
      nome: "Faturamento Global",
      descricao: "Receita total da plataforma por período",
      categoria: "Financeiro",
      frequencia: "Semanal",
      ultimaExecucao: "2025-01-03",
      status: "Ativo",
    },
    {
      id: "3",
      nome: "Uso de Juízes",
      descricao: "Estatísticas de acesso à base de juízes",
      categoria: "Uso",
      frequencia: "Diário",
      ultimaExecucao: "2025-01-04",
      status: "Ativo",
    },
    {
      id: "4",
      nome: "Performance do Sistema",
      descricao: "Métricas de performance e disponibilidade",
      categoria: "Sistema",
      frequencia: "Diário",
      ultimaExecucao: "2025-01-04",
      status: "Ativo",
    },
  ];

  const getStatusColor = (status: string) => {
    return status === "Ativo" ? "success" : "warning";
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Tenants: "primary",
      Financeiro: "success",
      Uso: "warning",
      Sistema: "secondary",
    };
    return colors[categoria] || "default";
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>Relatórios e Analytics</h1>
            <p className={subtitle({ fullWidth: true })}>Análise completa do sistema e métricas de negócio</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button color="primary" variant="flat">
              📊 Novo Relatório
            </Button>
            <Button color="secondary" variant="flat">
              📥 Exportar Todos
            </Button>
          </div>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📈</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Relatórios Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{relatorios.filter((r) => r.status === "Ativo").length}</p>
              <p className="text-sm text-blue-600">de {relatorios.length} total</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">⏱️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Execuções Hoje</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-green-600">+3 vs ontem</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">📊</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Dados Processados</p>
              <p className="text-2xl font-bold text-gray-900">2.4M</p>
              <p className="text-sm text-yellow-600">registros este mês</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-purple-600 mr-4">💾</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Armazenamento</p>
              <p className="text-2xl font-bold text-gray-900">45GB</p>
              <p className="text-sm text-purple-600">dados históricos</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">📋 Relatórios Disponíveis</h2>
          <p className="text-sm text-default-400">Gerencie e execute relatórios do sistema</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatorios.map((relatorio) => (
              <div key={relatorio.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">{relatorio.nome}</h3>
                    <p className="text-xs text-default-400 mb-2">{relatorio.descricao}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={getCategoriaColor(relatorio.categoria) as any} variant="flat" size="sm">
                        {relatorio.categoria}
                      </Badge>
                      <Badge color={getStatusColor(relatorio.status) as any} variant="flat" size="sm">
                        {relatorio.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-default-400">Frequência:</span>
                    <span className="text-white">{relatorio.frequencia}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-default-400">Última execução:</span>
                    <span className="text-white">{relatorio.ultimaExecucao}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" color="primary" variant="flat" className="flex-1">
                    ▶️ Executar
                  </Button>
                  <Button size="sm" variant="light">
                    ⚙️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Dashboards Rápidos */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">📊 Dashboards Rápidos</h2>
          <p className="text-sm text-default-400">Acesso rápido aos principais indicadores</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button color="primary" variant="flat" className="h-20 flex-col gap-2">
              <span className="text-2xl">🏢</span>
              <span className="text-sm">Dashboard Tenants</span>
            </Button>
            <Button color="success" variant="flat" className="h-20 flex-col gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-sm">Dashboard Financeiro</span>
            </Button>
            <Button color="warning" variant="flat" className="h-20 flex-col gap-2">
              <span className="text-2xl">👥</span>
              <span className="text-sm">Dashboard Usuários</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
