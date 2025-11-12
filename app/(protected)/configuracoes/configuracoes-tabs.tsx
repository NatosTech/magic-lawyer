"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { Building2, Palette, Mail, BarChart3, Shield } from "lucide-react";

import { EmailCredentialsCard } from "./email-credentials-card";
import { TenantSettingsForm } from "./tenant-settings-form";
import { TenantBrandingForm } from "./tenant-branding-form";
import { DigitalCertificatesPanel } from "./digital-certificates-panel";

interface TenantSettingsFormProps {
  tenant: {
    name: string;
    email: string | null;
    telefone: string | null;
    razaoSocial: string | null;
    nomeFantasia: string | null;
    timezone: string;
  };
}

interface TenantBrandingFormProps {
  branding: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null;
}

interface SubscriptionProps {
  subscription: {
    id: string | null;
    status: string | null;
    planId: string | null;
    planName: string | null;
    valorMensal: number | null;
    valorAnual: number | null;
    moeda: string | null;
    planRevision: number;
    trialEndsAt: string | null;
    renovaEm: string | null;
    planoVersao: {
      id: string;
      numero: number;
      status: string;
      titulo: string | null;
      descricao: string | null;
      publicadoEm: string | null;
    } | null;
  } | null;
}

interface ModulesProps {
  modules: {
    accessible: string[];
    allAvailable: string[];
    moduleDetails: Array<{
      slug: string;
      name: string;
      description: string;
      accessible: boolean;
      routes: string[];
    }>;
  };
}

interface MetricsProps {
  metrics: {
    usuarios: number;
    processos: number;
    clientes: number;
    contratos: number;
  };
}

interface DigitalCertificatesProps {
  certificates?: Array<{
    id: string;
    tenantId: string;
    responsavelUsuarioId: string | null;
    label: string | null;
    tipo: string;
    isActive: boolean;
    validUntil: string | null;
    lastValidatedAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
    responsavelUsuario: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  }>;
}

export function ConfiguracoesTabs({
  tenant,
  branding,
  subscription,
  modules,
  metrics,
  certificates,
}: TenantSettingsFormProps &
  TenantBrandingFormProps &
  SubscriptionProps &
  ModulesProps &
  MetricsProps &
  DigitalCertificatesProps) {
  return (
    <Tabs
      aria-label="Configurações"
      className="w-full"
      color="primary"
      variant="underlined"
    >
      {/* Tab 1: Visão Geral */}
      <Tab
        key="overview"
        title={
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </div>
        }
      >
        <div className="space-y-6 mt-6">
          {/* Informações do Plano */}
          {subscription && (
            <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
              <CardHeader className="flex flex-col gap-2 pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Plano Atual
                  </h2>
                  <Badge
                    color={
                      subscription.status === "ATIVA" ? "success" : "warning"
                    }
                    variant="flat"
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-default-400">
                  Informações sobre sua assinatura e plano contratado.
                </p>
              </CardHeader>
              <Divider className="border-white/10" />
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-default-400">
                      Nome do Plano
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {subscription.planName || "Não definido"}
                    </p>
                  </div>

                  {subscription.valorMensal && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-default-400">
                        Valor Mensal
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {subscription.moeda}{" "}
                        {subscription.valorMensal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}

                  {subscription.valorAnual && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-default-400">
                        Valor Anual
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {subscription.moeda}{" "}
                        {subscription.valorAnual.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.planoVersao && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-default-400">
                      Versão do Plano
                    </p>
                    <div className="flex items-center gap-2">
                      <Chip color="primary" size="sm" variant="flat">
                        v{subscription.planoVersao.numero}
                      </Chip>
                      <span className="text-sm text-default-400">
                        {subscription.planoVersao.titulo || "Versão padrão"}
                      </span>
                    </div>
                    {subscription.planoVersao.publicadoEm && (
                      <p className="text-xs text-default-500">
                        Publicado em:{" "}
                        {new Date(
                          subscription.planoVersao.publicadoEm,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}

                {subscription.trialEndsAt && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-default-400">
                      Período de Teste
                    </p>
                    <p className="text-sm text-warning">
                      Expira em:{" "}
                      {new Date(subscription.trialEndsAt).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                )}

                {subscription.renovaEm && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-default-400">
                      Próxima Renovação
                    </p>
                    <p className="text-sm text-success">
                      {new Date(subscription.renovaEm).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Métricas do Escritório */}
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Métricas</h2>
              <p className="text-sm text-default-400">
                Estatísticas gerais do seu escritório.
              </p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-bold text-primary">
                    {metrics.usuarios}
                  </p>
                  <p className="text-sm text-default-400">Usuários</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-2xl font-bold text-success">
                    {metrics.processos}
                  </p>
                  <p className="text-sm text-default-400">Processos</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-2xl font-bold text-warning">
                    {metrics.clientes}
                  </p>
                  <p className="text-sm text-default-400">Clientes</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className="text-2xl font-bold text-secondary">
                    {metrics.contratos}
                  </p>
                  <p className="text-sm text-default-400">Contratos</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Módulos Disponíveis */}
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">
                Módulos do Sistema
              </h2>
              <p className="text-sm text-default-400">
                Módulos disponíveis no seu plano atual (
                {modules.accessible.length} de {modules.allAvailable.length}{" "}
                ativos).
              </p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.moduleDetails.map((module) => (
                  <div
                    key={module.slug}
                    className={`p-4 rounded-lg border ${module.accessible ? "bg-success/10 border-success/20" : "bg-default/10 border-default/20"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {module.name}
                          </h3>
                          <Chip
                            color={module.accessible ? "success" : "default"}
                            size="sm"
                            variant="flat"
                          >
                            {module.accessible ? "Ativo" : "Inativo"}
                          </Chip>
                        </div>
                        <p className="text-sm text-default-400 mb-2">
                          {module.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {module.routes.slice(0, 3).map((route) => (
                            <Chip
                              key={route}
                              color="primary"
                              size="sm"
                              variant="dot"
                            >
                              {route}
                            </Chip>
                          ))}
                          {module.routes.length > 3 && (
                            <Chip color="default" size="sm" variant="dot">
                              +{module.routes.length - 3} mais
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Ações */}
          <Card className="border border-white/10 bg-white/5">
            <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
              <div>
                <p className="text-white">
                  Precisando de ajuda com configurações?
                </p>
                <p>Conte com nosso time para personalizar seu escritório.</p>
              </div>
              <Button as={NextLink} color="primary" href="/help" radius="full">
                Falar com suporte
              </Button>
            </CardBody>
          </Card>
        </div>
      </Tab>

      {/* Tab 2: Informações do Escritório */}
      <Tab
        key="tenant"
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Escritório</span>
          </div>
        }
      >
        <div className="mt-6">
          <TenantSettingsForm
            initialData={{
              name: tenant.name,
              email: tenant.email,
              telefone: tenant.telefone,
              razaoSocial: tenant.razaoSocial,
              nomeFantasia: tenant.nomeFantasia,
              timezone: tenant.timezone,
            }}
          />
        </div>
      </Tab>

      {/* Tab 3: Branding */}
      <Tab
        key="branding"
        title={
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </div>
        }
      >
        <div className="mt-6">
          <TenantBrandingForm
            initialData={{
              primaryColor: branding?.primaryColor || null,
              secondaryColor: branding?.secondaryColor || null,
              accentColor: branding?.accentColor || null,
              logoUrl: branding?.logoUrl || null,
              faviconUrl: branding?.faviconUrl || null,
            }}
          />
        </div>
      </Tab>

      {/* Tab 4: Email */}
      <Tab
        key="email"
        title={
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
        }
      >
        <div className="mt-6">
          <EmailCredentialsCard />
        </div>
      </Tab>

      {/* Tab 5: Integrações PJe */}
      <Tab
        key="certificates"
        title={
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Integrações PJe</span>
          </div>
        }
      >
        <div className="mt-6">
          <DigitalCertificatesPanel certificates={certificates ?? []} />
        </div>
      </Tab>
    </Tabs>
  );
}
