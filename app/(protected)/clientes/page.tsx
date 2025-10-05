import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";
import { PermissionGuard } from "@/components/permission-guard";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Gestão completa da base de clientes do escritório.",
};

export default function ClientesPage() {
  return (
    <PermissionGuard permission="canViewAllClients">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Base de clientes</p>
          <h1 className={title({ size: "lg", color: "blue" })}>Gestão de Clientes</h1>
          <p className={subtitle({ fullWidth: true })}>Centralize informações dos seus clientes, histórico de relacionamento e dados importantes para um atendimento personalizado.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Informações do Cliente</h2>
              <p className="text-sm text-default-400">Dados completos e histórico.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Perfil completo</p>
                <p className="mt-2 text-primary/80">Dados pessoais, contatos, documentos e informações relevantes.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Histórico de relacionamento</p>
                <p className="mt-2 text-warning/80">Timeline de interações, reuniões e comunicações.</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Preferências</p>
                <p className="mt-2 text-success/80">Formas de contato preferidas, horários e observações importantes.</p>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Gestão de Relacionamento</h2>
              <p className="text-sm text-default-400">Ferramentas para melhor atendimento.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Segmentação</p>
                <p className="mt-2 text-primary/80">Categorize clientes por tipo, área de atuação ou importância.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Lembretes automáticos</p>
                <p className="mt-2 text-warning/80">Alertas para follow-ups, aniversários e datas importantes.</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Portal do cliente</p>
                <p className="mt-2 text-success/80">Acesso restrito para clientes visualizarem seus processos.</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/5">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
            <div>
              <p className="text-white">Quer integrar com CRM existente?</p>
              <p>Conecte com HubSpot, Pipedrive ou outras ferramentas.</p>
            </div>
            <Button as={NextLink} color="primary" href="/help" radius="full">
              Solicitar integração
            </Button>
          </CardBody>
        </Card>
      </section>
    </PermissionGuard>
  );
}
