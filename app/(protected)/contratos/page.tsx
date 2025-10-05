import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";
import { PermissionGuard } from "@/components/permission-guard";

export const metadata: Metadata = {
  title: "Contratos",
  description: "Gestão completa de contratos e modelos jurídicos.",
};

export default function ContratosPage() {
  return (
    <PermissionGuard permission="canViewAllDocuments">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Gestão contratual</p>
          <h1 className={title({ size: "lg", color: "blue" })}>Contratos e modelos jurídicos</h1>
          <p className={subtitle({ fullWidth: true })}>Centralize todos os contratos do seu escritório, gerencie modelos reutilizáveis e automatize a criação de documentos contratuais.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Contratos Ativos</h2>
              <p className="text-sm text-default-400">Gestão de contratos em andamento.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Contratos por cliente</p>
                <p className="mt-2 text-primary/80">Visualize e gerencie todos os contratos por cliente.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Controle de vencimentos</p>
                <p className="mt-2 text-warning/80">Alertas automáticos para renovação e vencimentos.</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Assinatura digital</p>
                <p className="mt-2 text-success/80">Integração com plataformas de assinatura eletrônica.</p>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Modelos de Contratos</h2>
              <p className="text-sm text-default-400">Biblioteca de modelos reutilizáveis.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Templates personalizáveis</p>
                <p className="mt-2 text-primary/80">Crie e customize modelos para diferentes tipos de contrato.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Versionamento</p>
                <p className="mt-2 text-warning/80">Controle de versões e histórico de alterações.</p>
              </div>
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Geração automática</p>
                <p className="mt-2 text-success/80">Criação rápida de contratos a partir de modelos.</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/5">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
            <div>
              <p className="text-white">Precisa de integração com assinatura digital?</p>
              <p>Conecte com DocuSign, ClickSign ou outras plataformas.</p>
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
