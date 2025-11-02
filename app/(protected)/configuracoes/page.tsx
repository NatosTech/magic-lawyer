import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import NextLink from "next/link";

import { EmailCredentialsCard } from "./email-credentials-card";
import { TenantSettingsForm } from "./tenant-settings-form";
import { TenantBrandingForm } from "./tenant-branding-form";

import { title, subtitle } from "@/components/primitives";
import { getSession } from "@/app/lib/auth";
import { TENANT_PERMISSIONS } from "@/types";
import { getTenantConfigData } from "@/app/actions/tenant-config";

export const metadata: Metadata = {
  title: "Configurações do escritório",
  description: "Personalize branding, integrações e preferências avançadas.",
};

export default async function ConfiguracoesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role as string | undefined;
  const permissions = ((session.user as any)?.permissions ?? []) as string[];
  const allowed =
    role === "SUPER_ADMIN" ||
    permissions.includes(TENANT_PERMISSIONS.manageOfficeSettings);

  if (!allowed) {
    redirect("/dashboard");
  }

  // Buscar dados do tenant
  const tenantData = await getTenantConfigData();

  if (!tenantData.success || !tenantData.data) {
    redirect("/dashboard");
  }

  const { tenant, branding, subscription, modules, metrics } = tenantData.data;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Configurações
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Central de configurações do escritório
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Visualize informações do seu plano, módulos disponíveis e dados do
          escritório.
        </p>
      </header>

      {/* Informações do Plano */}
      {subscription && (
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Plano Atual</h2>
              <Badge
                color={subscription.status === "ATIVA" ? "success" : "warning"}
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
                  {new Date(subscription.renovaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Informações do Escritório - Formulário Editável */}
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
            Módulos disponíveis no seu plano atual ({modules.accessible.length}{" "}
            de {modules.allAvailable.length} ativos).
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

      {/* Branding - Formulário Editável */}
      {branding && (
        <TenantBrandingForm
          initialData={{
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
          }}
        />
      )}

      {/* Credenciais SMTP */}
      <EmailCredentialsCard />

      {/* Ações */}
      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Precisando de ajuda com configurações?</p>
            <p>Conte com nosso time para personalizar seu escritório.</p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Falar com suporte
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
