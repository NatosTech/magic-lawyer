"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";

export function AdminDashboardContent() {
  // Estatísticas mockadas por enquanto
  const totalTenants = 0;
  const activeTenants = 0;
  const totalJuizes = 0;
  const publicJuizes = 0;
  const premiumJuizes = 0;
  const totalUsuarios = 0;
  const totalFaturas = 0;
  const faturamento = 0;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              🔑 Dashboard Administrativo
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Visão geral do sistema Magic Lawyer
            </p>
          </div>
        </div>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody>
            <p className="text-default-600">
              Bem-vindo ao painel administrativo do Magic Lawyer. Aqui você pode
              gerenciar todos os aspectos do sistema white label.
            </p>
          </CardBody>
        </Card>
      </header>

      {/* Estatísticas do Sistema */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            📊 Estatísticas do Sistema
          </h2>
          <p className="text-sm text-default-400">
            Visão geral dos recursos e usuários do sistema.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tenants */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <span className="text-xl">🏢</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-primary/80">Tenants</p>
                  <p className="text-lg font-semibold text-primary">
                    {totalTenants}
                  </p>
                  <p className="text-xs text-primary/60">
                    {activeTenants} ativos
                  </p>
                </div>
              </div>
            </div>

            {/* Juízes */}
            <div className="rounded-2xl border border-success/20 bg-success/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/20">
                  <span className="text-xl">👨‍⚖️</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-success/80">Juízes Globais</p>
                  <p className="text-lg font-semibold text-success">
                    {totalJuizes}
                  </p>
                  <p className="text-xs text-success/60">
                    {publicJuizes} públicos, {premiumJuizes} premium
                  </p>
                </div>
              </div>
            </div>

            {/* Usuários */}
            <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/20">
                  <span className="text-xl">👥</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-secondary/80">Usuários</p>
                  <p className="text-lg font-semibold text-secondary">
                    {totalUsuarios}
                  </p>
                  <p className="text-xs text-secondary/60">
                    Em todos os tenants
                  </p>
                </div>
              </div>
            </div>

            {/* Faturamento */}
            <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <span className="text-xl">💰</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-warning/80">Faturamento</p>
                  <p className="text-lg font-semibold text-warning">
                    R${" "}
                    {faturamento.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-warning/60">
                    {totalFaturas} faturas pagas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Ações Rápidas */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">⚡ Ações Rápidas</h2>
          <p className="text-sm text-default-400">
            Acesso rápido às principais funcionalidades administrativas.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              as={NextLink}
              className="h-auto p-6 border-primary/20 bg-primary/5 hover:bg-primary/10"
              href="/admin/tenants"
              variant="bordered"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">🏢</span>
                <div className="text-center">
                  <p className="font-semibold text-primary">
                    Gerenciar Tenants
                  </p>
                  <p className="text-sm text-primary/70">
                    Ver todos os escritórios
                  </p>
                </div>
              </div>
            </Button>

            <Button
              as={NextLink}
              className="h-auto p-6 border-success/20 bg-success/5 hover:bg-success/10"
              href="/admin/juizes"
              variant="bordered"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">👨‍⚖️</span>
                <div className="text-center">
                  <p className="font-semibold text-success">Gerenciar Juízes</p>
                  <p className="text-sm text-success/70">Juízes globais</p>
                </div>
              </div>
            </Button>

            <Button
              as={NextLink}
              className="h-auto p-6 border-secondary/20 bg-secondary/5 hover:bg-secondary/10"
              href="/admin/pacotes"
              variant="bordered"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">💎</span>
                <div className="text-center">
                  <p className="font-semibold text-secondary">
                    Pacotes Premium
                  </p>
                  <p className="text-sm text-secondary/70">
                    Configurar monetização
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Recursos Administrativos */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            🛠️ Recursos Administrativos
          </h2>
          <p className="text-sm text-default-400">
            Funcionalidades disponíveis para gerenciar o sistema white label.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid gap-4 text-sm text-default-400 grid-cols-1 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 min-w-0">
            <p className="font-semibold text-primary">
              Gerenciamento de Tenants
            </p>
            <p className="mt-2 text-primary/80">
              Criar, editar e gerenciar escritórios de advocacia no sistema
              white label.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4 min-w-0">
            <p className="font-semibold text-success">Base de Juízes Globais</p>
            <p className="mt-2 text-success/80">
              Manter e atualizar a base de juízes públicos e premium do sistema.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 min-w-0">
            <p className="font-semibold text-warning">Monetização Premium</p>
            <p className="mt-2 text-warning/80">
              Configurar pacotes premium e estratégias de monetização.
            </p>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 min-w-0">
            <p className="font-semibold text-secondary">Auditoria e Logs</p>
            <p className="mt-2 text-secondary/80">
              Monitorar ações administrativas e logs de sistema.
            </p>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
