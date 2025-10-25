"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/react";
import NextLink from "next/link";

import { getAllTenants, type TenantResponse } from "@/app/actions/admin";
import { title, subtitle } from "@/components/primitives";
import { useRealtimeTenantStatus } from "@/app/hooks/use-realtime-tenant-status";
import { Tooltip } from "@heroui/react";

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  CANCELLED: "Cancelado",
};

const statusTone: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  CANCELLED: "danger",
};

function fetchTenants() {
  return getAllTenants().then((response: TenantResponse) => {
    if (!response.success || !response.data) {
      throw new Error(response.error ?? "Não foi possível carregar os tenants");
    }

    return response.data as any[];
  });
}

function useTenantsData(data: any[] | undefined) {
  const tenants = data ?? [];

  const totals = useMemo(() => {
    const active = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
    const suspended = tenants.filter((tenant) => tenant.status === "SUSPENDED").length;
    const cancelled = tenants.filter((tenant) => tenant.status === "CANCELLED").length;

    return {
      total: tenants.length,
      active,
      suspended,
      cancelled,
    };
  }, [tenants]);

  return { tenants, totals };
}

function TenantsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-background/70">
        <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-56 rounded-lg" isLoaded={false} />
          <Skeleton className="h-9 w-36 rounded-full" isLoaded={false} />
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`stat-${index}`} className="h-20 w-full rounded-xl" isLoaded={false} />
          ))}
        </CardBody>
      </Card>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`tenant-${index}`} className="border border-white/10 bg-background/70">
          <CardBody>
            <Skeleton className="h-16 w-full rounded-xl" isLoaded={false} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

interface TenantCardProps {
  tenant: any;
  mutate: () => void;
}

function TenantCard({ tenant, mutate }: TenantCardProps) {
  const { status, statusChanged, isUpdating } = useRealtimeTenantStatus(tenant.id);

  // Se tivermos status em tempo real, usar esse
  const tenantStatus = status?.status ?? tenant.status;
  const statusReason = status?.statusReason ?? null;

  // Animação quando o status muda
  const cardClassName = statusChanged
    ? "border border-white/10 bg-background/70 backdrop-blur transition hover:border-primary/40 animate-pulse border-green-500/50"
    : "border border-white/10 bg-background/70 backdrop-blur transition hover:border-primary/40";

  return (
    <Card key={tenant.id} className={cardClassName}>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-white">{tenant.name}</p>
            {statusReason ? (
              <Tooltip content={statusReason}>
                <Chip color={statusTone[tenantStatus] ?? "secondary"} size="sm" variant="flat" className={statusChanged ? "animate-bounce" : ""}>
                  {statusLabel[tenantStatus] ?? tenantStatus}
                  {isUpdating && <span className="ml-1 text-xs">⟳</span>}
                </Chip>
              </Tooltip>
            ) : (
              <Chip color={statusTone[tenantStatus] ?? "secondary"} size="sm" variant="flat" className={statusChanged ? "animate-bounce" : ""}>
                {statusLabel[tenantStatus] ?? tenantStatus}
                {isUpdating && <span className="ml-1 text-xs">⟳</span>}
              </Chip>
            )}
            {tenant.plan?.name ? (
              <Badge color="primary" variant="flat">
                Plano {tenant.plan.name}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-default-400">
            <span>Slug: {tenant.slug}</span>
            {tenant.domain ? <span>• Domínio: {tenant.domain}</span> : null}
            {tenant.email ? <span>• Email: {tenant.email}</span> : null}
            {tenant.telefone ? <span>• Telefone: {tenant.telefone}</span> : null}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-default-500">
            <span>{tenant.counts.usuarios} usuários</span>
            <span>• {tenant.counts.processos} processos</span>
            <span>• {tenant.counts.clientes} clientes</span>
            <span>• Criado em {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button as={NextLink} color="primary" href={`/admin/tenants/${tenant.id}`} radius="full" size="sm" variant="flat">
            Gerenciar
          </Button>
          <p className="text-xs text-default-400">Última atualização em {new Date(tenant.updatedAt).toLocaleString("pt-BR")}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function TenantsContent() {
  const { data, error, isLoading, mutate } = useSWR("admin-tenants", fetchTenants, {
    revalidateOnFocus: true,
    refreshInterval: 5000, // 5 segundos
  });

  const { tenants, totals } = useTenantsData(data);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>🏢 Gerenciar tenants</h1>
            <p className={subtitle({ fullWidth: true })}>Controle centralizado de todos os escritórios white label da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Button as={NextLink} color="primary" href="/admin/tenants/new" radius="full">
              ➕ Criar novo tenant
            </Button>
          </div>
        </div>
      </header>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Não foi possível carregar os tenants</p>
              <p className="text-sm text-danger/80">{error instanceof Error ? error.message : "Erro inesperado"}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {(!data && isLoading) || !data ? (
        <TenantsSkeleton />
      ) : (
        <div className="space-y-6">
          <Card className="border border-white/10 bg-background/70 backdrop-blur">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">📊 Estatísticas dos tenants</h2>
              <p className="text-sm text-default-400">Visão geral dos escritórios cadastrados na Magic Lawyer.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs uppercase text-primary/70">Total</p>
                <p className="text-2xl font-semibold text-primary">{totals.total}</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="text-xs uppercase text-success/70">Ativos</p>
                <p className="text-2xl font-semibold text-success">{totals.active}</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="text-xs uppercase text-warning/70">Suspensos</p>
                <p className="text-2xl font-semibold text-warning">{totals.suspended}</p>
              </div>
              <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                <p className="text-xs uppercase text-danger/70">Cancelados</p>
                <p className="text-2xl font-semibold text-danger">{totals.cancelled}</p>
              </div>
            </CardBody>
          </Card>

          {tenants.length ? (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} mutate={mutate} />
              ))}
            </div>
          ) : (
            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardBody className="text-center py-12">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-white mb-1">Nenhum tenant localizado</h3>
                <p className="text-sm text-default-400">Assim que um escritório for criado, você poderá controlá-lo por aqui.</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
