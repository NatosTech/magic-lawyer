"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useProfileNavigation } from "@/app/hooks/use-profile-navigation";

export function DashboardContent() {
  const { permissions, userRole } = useUserPermissions();
  const { getDashboardTitle, getDashboardDescription, getWelcomeMessage } =
    useProfileNavigation();

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case "ADMIN":
        return "danger";
      case "ADVOGADO":
        return "primary";
      case "SECRETARIA":
        return "secondary";
      case "FINANCEIRO":
        return "success";
      case "CLIENTE":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "ADMIN":
        return "Administrador";
      case "ADVOGADO":
        return "Advogado";
      case "SECRETARIA":
        return "Secretaria";
      case "FINANCEIRO":
        return "Financeiro";
      case "CLIENTE":
        return "Cliente";
      default:
        return "Usuário";
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Visão geral
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              {getDashboardTitle()}
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              {getDashboardDescription()}
            </p>
          </div>
        </div>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody>
            <p className="text-default-600">{getWelcomeMessage()}</p>
          </CardBody>
        </Card>
      </header>

      {/* Permissões do Usuário */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Suas Permissões</h2>
          <p className="text-sm text-default-400">
            Recursos disponíveis para o seu perfil.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${value ? "bg-success" : "bg-default-300"}`}
                />
                <span className="text-sm text-default-600 truncate">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">O que vem por aí</h2>
          <p className="text-sm text-default-400">
            Alguns widgets planejados para o lançamento beta.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid gap-4 text-sm text-default-400 grid-cols-1 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 min-w-0">
            <p className="font-semibold text-primary">
              Monitor de prazos críticos
            </p>
            <p className="mt-2 text-primary/80">
              Alertas de audiências, vencimentos e SLA do escritório por tenant.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4 min-w-0">
            <p className="font-semibold text-success">
              Indicadores financeiros
            </p>
            <p className="mt-2 text-success/80">
              Receita recorrente, inadimplência e margem por plano.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 min-w-0">
            <p className="font-semibold text-warning">Engajamento do cliente</p>
            <p className="mt-2 text-warning/80">
              Uso do portal, documentos acessados e feedback dos clientes.
            </p>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 min-w-0">
            <p className="font-semibold text-secondary">Saúde operacional</p>
            <p className="mt-2 text-secondary/80">
              Capacidade da equipe, tarefas pendentes e automações em execução.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-col gap-3 text-sm text-default-400 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-white">Quer testar o dashboard completo?</p>
            <p>
              O roadmap inclui painéis customizados por tenant e exportação em
              PDF.
            </p>
          </div>
          <Button
            as={NextLink}
            className="flex-shrink-0"
            color="primary"
            href="/help"
            radius="full"
          >
            Entrar na lista beta
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
