"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton, Tooltip } from "@heroui/react";
import NextLink from "next/link";
import Image from "next/image";
import { Input } from "@heroui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter, RotateCcw } from "lucide-react";

import { getAllTenants, type TenantResponse } from "@/app/actions/admin";
import { title, subtitle } from "@/components/primitives";
import { useRealtimeTenantStatus } from "@/app/hooks/use-realtime-tenant-status";

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
    const active = tenants.filter(
      (tenant) => tenant.status === "ACTIVE",
    ).length;
    const suspended = tenants.filter(
      (tenant) => tenant.status === "SUSPENDED",
    ).length;
    const cancelled = tenants.filter(
      (tenant) => tenant.status === "CANCELLED",
    ).length;

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
            <Skeleton
              key={`stat-${index}`}
              className="h-20 w-full rounded-xl"
              isLoaded={false}
            />
          ))}
        </CardBody>
      </Card>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={`tenant-${index}`}
          className="border border-white/10 bg-background/70"
        >
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
  const { status, statusChanged, isUpdating } = useRealtimeTenantStatus(
    tenant.id,
  );

  // Se tivermos status em tempo real, usar esse
  const tenantStatus = status?.status ?? tenant.status;
  const statusReason = status?.statusReason ?? null;

  // Animação quando o status muda
  const cardClassName = statusChanged
    ? "border border-white/10 bg-background/70 backdrop-blur transition hover:border-primary/40 animate-pulse border-green-500/50"
    : "border border-white/10 bg-background/70 backdrop-blur transition hover:border-primary/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      layout
    >
      <Card key={tenant.id} className={cardClassName}>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {tenant.branding?.logoUrl ? (
                  <Image
                    alt={`Logo ${tenant.name}`}
                    height={56}
                    src={tenant.branding.logoUrl}
                    width={56}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-semibold text-white">
                    {tenant.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold text-white">{tenant.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {statusReason ? (
                    <Tooltip content={statusReason}>
                      <Chip
                        className={statusChanged ? "animate-bounce" : ""}
                        color={statusTone[tenantStatus] ?? "secondary"}
                        size="sm"
                        variant="flat"
                      >
                        {statusLabel[tenantStatus] ?? tenantStatus}
                        {isUpdating && <span className="ml-1 text-xs">⟳</span>}
                      </Chip>
                    </Tooltip>
                  ) : (
                    <Chip
                      className={statusChanged ? "animate-bounce" : ""}
                      color={statusTone[tenantStatus] ?? "secondary"}
                      size="sm"
                      variant="flat"
                    >
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
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-default-400">
              <span>Slug: {tenant.slug}</span>
              {tenant.domain ? <span>• Domínio: {tenant.domain}</span> : null}
              {tenant.email ? <span>• Email: {tenant.email}</span> : null}
              {tenant.telefone ? (
                <span>• Telefone: {tenant.telefone}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-default-500">
              <span>{tenant.counts.usuarios} usuários</span>
              <span>• {tenant.counts.processos} processos</span>
              <span>• {tenant.counts.clientes} clientes</span>
              <span>
                • Criado em{" "}
                {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              as={NextLink}
              color="primary"
              href={`/admin/tenants/${tenant.id}`}
              radius="full"
              size="sm"
              variant="flat"
            >
              Gerenciar
            </Button>
            <p className="text-xs text-default-400">
              Última atualização em{" "}
              {new Date(tenant.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

export function TenantsContent() {
  const { data, error, isLoading, mutate } = useSWR(
    "admin-tenants",
    fetchTenants,
    {
      revalidateOnFocus: true,
      refreshInterval: 5000, // 5 segundos
    },
  );

  const { tenants, totals } = useTenantsData(data);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const planOptions = useMemo(() => {
    const options = tenants
      .map((tenant) => tenant.plan?.name)
      .filter((plan): plan is string => Boolean(plan));

    return Array.from(new Set(options));
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      if (searchTerm) {
        const normalized = searchTerm.toLowerCase();
        const matchesSearch =
          tenant.name.toLowerCase().includes(normalized) ||
          tenant.slug.toLowerCase().includes(normalized) ||
          tenant.email?.toLowerCase().includes(normalized) ||
          tenant.domain?.toLowerCase().includes(normalized);

        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && tenant.status !== statusFilter) {
        return false;
      }

      if (planFilter !== "all") {
        if (!tenant.plan?.name || tenant.plan.name !== planFilter) {
          return false;
        }
      }

      return true;
    });
  }, [tenants, searchTerm, statusFilter, planFilter]);

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "ACTIVE", label: "Ativos" },
    { value: "SUSPENDED", label: "Suspensos" },
    { value: "CANCELLED", label: "Cancelados" },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              🏢 Gerenciar tenants
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Controle centralizado de todos os escritórios white label da
              plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              as={NextLink}
              color="primary"
              href="/admin/tenants/new"
              radius="full"
            >
              ➕ Criar novo tenant
            </Button>
          </div>
        </div>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur">
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              className="w-full md:max-w-lg"
              placeholder="Buscar por nome, domínio, e-mail ou slug..."
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                startContent={<Filter className="h-4 w-4" />}
                variant={showFilters ? "solid" : "bordered"}
                onPress={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              </Button>
              <Button
                startContent={<RotateCcw className="h-4 w-4" />}
                variant="light"
                onPress={resetFilters}
              >
                Limpar
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters ? (
              <motion.div
                key="filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-default-500">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                          <Button
                            key={option.value}
                            color={
                              statusFilter === option.value
                                ? "primary"
                                : "default"
                            }
                            radius="full"
                            size="sm"
                            variant={
                              statusFilter === option.value
                                ? "solid"
                                : "bordered"
                            }
                            onPress={() => setStatusFilter(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-default-500">
                        Plano
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          color={planFilter === "all" ? "primary" : "default"}
                          radius="full"
                          size="sm"
                          variant={planFilter === "all" ? "solid" : "bordered"}
                          onPress={() => setPlanFilter("all")}
                        >
                          Todos
                        </Button>
                        {planOptions.map((plan) => (
                          <Button
                            key={plan}
                            color={planFilter === plan ? "primary" : "default"}
                            radius="full"
                            size="sm"
                            variant={
                              planFilter === plan ? "solid" : "bordered"
                            }
                            onPress={() => setPlanFilter(plan)}
                          >
                            {plan}
                          </Button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="text-xs text-default-500">
            Mostrando{" "}
            <span className="font-semibold text-white">
              {filteredTenants.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-white">{tenants.length}</span>{" "}
            tenants
          </p>
        </CardBody>
      </Card>

      {error ? (
        <Card className="border border-danger/30 bg-danger/10 text-danger">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                Não foi possível carregar os tenants
              </p>
              <p className="text-sm text-danger/80">
                {error instanceof Error ? error.message : "Erro inesperado"}
              </p>
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
              <h2 className="text-lg font-semibold text-white">
                📊 Estatísticas dos tenants
              </h2>
              <p className="text-sm text-default-400">
                Visão geral dos escritórios cadastrados na Magic Lawyer.
              </p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs uppercase text-primary/70">Total</p>
                <p className="text-2xl font-semibold text-primary">
                  {totals.total}
                </p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="text-xs uppercase text-success/70">Ativos</p>
                <p className="text-2xl font-semibold text-success">
                  {totals.active}
                </p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="text-xs uppercase text-warning/70">Suspensos</p>
                <p className="text-2xl font-semibold text-warning">
                  {totals.suspended}
                </p>
              </div>
              <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                <p className="text-xs uppercase text-danger/70">Cancelados</p>
                <p className="text-2xl font-semibold text-danger">
                  {totals.cancelled}
                </p>
              </div>
            </CardBody>
          </Card>

          {filteredTenants.length ? (
            <motion.div layout className="space-y-4">
              {filteredTenants.map((tenant) => (
                <TenantCard key={tenant.id} mutate={mutate} tenant={tenant} />
              ))}
            </motion.div>
          ) : (
            <Card className="border border-white/10 bg-background/70 backdrop-blur">
              <CardBody className="py-12 text-center">
                <div className="mb-4 text-5xl">🏢</div>
                <h3 className="text-lg font-medium text-white mb-1">
                  Nenhum tenant localizado
                </h3>
                <p className="text-sm text-default-400">
                  {tenants.length === 0
                    ? "Assim que um escritório for criado, você poderá controlá-lo por aqui."
                    : "Nenhum escritório corresponde aos filtros atuais. Ajuste a busca ou limpe os filtros para ver todos."}
                </p>
                {tenants.length > 0 ? (
                  <Button
                    className="mt-4"
                    radius="full"
                    size="sm"
                    variant="bordered"
                    onPress={resetFilters}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
