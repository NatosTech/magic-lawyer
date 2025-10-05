"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export function TenantsContent() {
  // Dados mockados por enquanto
  const tenants: any[] = [];

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspendedTenants = tenants.filter((t) => t.status === "SUSPENDED").length;
  const cancelledTenants = tenants.filter((t) => t.status === "CANCELLED").length;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>🏢 Gerenciar Tenants</h1>
            <p className={subtitle({ fullWidth: true })}>Administre todos os escritórios de advocacia do sistema</p>
          </div>
          <Button as={NextLink} href="/admin/tenants/new" color="primary" radius="full" className="flex-shrink-0">
            ➕ Criar Novo Tenant
          </Button>
        </div>
      </header>

      {/* Estatísticas */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">📊 Estatísticas dos Tenants</h2>
          <p className="text-sm text-default-400">Visão geral dos escritórios cadastrados no sistema.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <span className="text-xl">🏢</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-primary/80">Total</p>
                  <p className="text-lg font-semibold text-primary">{totalTenants}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-success/20 bg-success/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/20">
                  <span className="text-xl">✅</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-success/80">Ativos</p>
                  <p className="text-lg font-semibold text-success">{activeTenants}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-warning/80">Suspensos</p>
                  <p className="text-lg font-semibold text-warning">{suspendedTenants}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-danger/20">
                  <span className="text-xl">❌</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-danger/80">Cancelados</p>
                  <p className="text-lg font-semibold text-danger">{cancelledTenants}</p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Tenants */}
      {tenants.length > 0 ? (
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">Lista de Tenants</h2>
            <p className="text-sm text-default-400">Todos os escritórios de advocacia cadastrados no sistema.</p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody>
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-background/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{tenant.name}</h3>
                      <p className="text-sm text-default-400">{tenant.slug}</p>
                      {tenant.domain && <p className="text-sm text-primary">{tenant.domain}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge color={tenant.status === "ACTIVE" ? "success" : tenant.status === "SUSPENDED" ? "warning" : "danger"} variant="flat">
                      {tenant.status === "ACTIVE" ? "✅ Ativo" : tenant.status === "SUSPENDED" ? "⚠️ Suspenso" : "❌ Cancelado"}
                    </Badge>
                    <Button size="sm" variant="bordered" color="primary">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum tenant encontrado</h3>
            <p className="text-default-400 mb-4">Os tenants aparecerão aqui quando forem criados</p>
            <Button as={NextLink} href="/admin/tenants/new" color="primary" radius="full">
              ➕ Criar Primeiro Tenant
            </Button>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
