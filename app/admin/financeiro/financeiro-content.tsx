"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";

import { title, subtitle } from "@/components/primitives";

export function FinanceiroContent() {
  // Mock data - em produção viria de actions
  const faturamento = {
    total: 125000.50,
    mensal: 8500.25,
    anual: 125000.50,
    crescimento: 15.2,
  };

  const tenants = [
    {
      id: "1",
      nome: "Sandra Advocacia",
      slug: "sandra",
      status: "ACTIVE",
      plano: "Premium",
      valorMensal: 299.90,
      usuarios: 12,
      ultimoPagamento: "2025-01-01",
      proximoVencimento: "2025-02-01",
    },
    {
      id: "2",
      nome: "Escritório Silva",
      slug: "silva",
      status: "ACTIVE",
      plano: "Básico",
      valorMensal: 99.90,
      usuarios: 5,
      ultimoPagamento: "2024-12-15",
      proximoVencimento: "2025-01-15",
    },
    {
      id: "3",
      nome: "Advocacia & Associados",
      slug: "advocacia",
      status: "SUSPENDED",
      plano: "Premium",
      valorMensal: 299.90,
      usuarios: 8,
      ultimoPagamento: "2024-11-30",
      proximoVencimento: "2024-12-30",
    },
  ];

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "success" : status === "SUSPENDED" ? "warning" : "danger";
  };

  const getPlanoColor = (plano: string) => {
    return plano === "Premium" ? "secondary" : "primary";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>Financeiro Global</h1>
            <p className={subtitle({ fullWidth: true })}>Gestão financeira de todos os tenants do sistema</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button color="primary" variant="flat">
              📊 Relatório Mensal
            </Button>
            <Button color="secondary" variant="flat">
              💰 Cobranças
            </Button>
          </div>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">💰</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(faturamento.total)}</p>
              <p className="text-sm text-green-600">+{faturamento.crescimento}% vs ano anterior</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📅</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(faturamento.mensal)}</p>
              <p className="text-sm text-blue-600">Janeiro 2025</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-purple-600 mr-4">🏢</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Tenants Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.filter(t => t.status === "ACTIVE").length}</p>
              <p className="text-sm text-purple-600">de {tenants.length} total</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-yellow-600 mr-4">⚠️</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Inadimplentes</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.filter(t => t.status === "SUSPENDED").length}</p>
              <p className="text-sm text-yellow-600">Necessitam atenção</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lista de Tenants */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">💳 Gestão de Assinaturas</h2>
          <p className="text-sm text-default-400">Controle de pagamentos e status dos tenants</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {tenants.length > 0 ? (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-white">{tenant.nome}</h3>
                        <Badge color={getStatusColor(tenant.status) as any} variant="flat" size="sm">
                          {tenant.status === "ACTIVE" ? "Ativo" : "Suspenso"}
                        </Badge>
                        <Badge color={getPlanoColor(tenant.plano) as any} variant="flat" size="sm">
                          {tenant.plano}
                        </Badge>
                      </div>
                      <p className="text-xs text-default-400 mb-2">{tenant.slug} • {tenant.usuarios} usuários</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(tenant.valorMensal)}/mês</p>
                      <p className="text-xs text-default-400">Próximo vencimento: {formatDate(tenant.proximoVencimento)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" color="primary" variant="flat">
                        💳 Ver Pagamentos
                      </Button>
                      <Button size="sm" variant="light">
                        📧 Enviar Lembrete
                      </Button>
                      {tenant.status === "SUSPENDED" && (
                        <Button size="sm" color="warning" variant="flat">
                          🔄 Reativar
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-default-400">
                      Último pagamento: {formatDate(tenant.ultimoPagamento)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum tenant encontrado</h3>
              <p className="text-default-400 mb-4">Os dados financeiros dos tenants aparecerão aqui</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Resumo de Pagamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">📈 Crescimento</h2>
            <p className="text-sm text-default-400">Evolução do faturamento</p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-default-400">Crescimento mensal:</span>
                <span className="text-sm font-medium text-green-600">+{faturamento.crescimento}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-default-400">Novos tenants este mês:</span>
                <span className="text-sm font-medium text-white">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-default-400">Churn rate:</span>
                <span className="text-sm font-medium text-red-600">2.1%</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">⚡ Ações Rápidas</h2>
            <p className="text-sm text-default-400">Operações financeiras comuns</p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2">
              <Button color="primary" variant="flat" className="justify-start">
                💰 Processar Cobranças
              </Button>
              <Button color="success" variant="flat" className="justify-start">
                📊 Gerar Relatório
              </Button>
              <Button color="warning" variant="flat" className="justify-start">
                📧 Lembretes de Vencimento
              </Button>
              <Button color="secondary" variant="flat" className="justify-start">
                🔄 Sincronizar Pagamentos
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
