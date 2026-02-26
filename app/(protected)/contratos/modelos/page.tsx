import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";
import { PermissionGuard } from "@/components/permission-guard";

export const metadata: Metadata = {
  title: "Modelos de Contratos",
  description: "Biblioteca de modelos de contratos reutilizáveis.",
};

export default function ModelosContratosPage() {
  return (
    <PermissionGuard permission="canViewAllDocuments">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 py-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Biblioteca de modelos
          </p>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Modelos de Contratos
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Gerencie sua biblioteca de modelos contratuais, crie templates
            personalizáveis e acelere a criação de novos contratos.
          </p>
        </header>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <h2 className="text-lg font-semibold text-white">
              Funcionalidades em desenvolvimento
            </h2>
            <p className="text-sm text-default-400">
              Recursos que serão implementados em breve.
            </p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody className="space-y-4 text-sm text-default-400">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="font-semibold text-primary">Editor de modelos</p>
              <p className="mt-2 text-primary/80">
                Interface visual para criar e editar modelos de contratos com
                campos dinâmicos.
              </p>
            </div>
            <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
              <p className="font-semibold text-warning">Categorização</p>
              <p className="mt-2 text-warning/80">
                Organize modelos por tipo: contratos de prestação de serviços,
                acordos, termos, etc.
              </p>
            </div>
            <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
              <p className="font-semibold text-success">Variáveis dinâmicas</p>
              <p className="mt-2 text-success/80">
                Use campos como {`{nome_cliente}`}, {`{data_contrato}`} para
                personalização automática.
              </p>
            </div>
            <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
              <p className="font-semibold text-secondary">Versionamento</p>
              <p className="mt-2 text-secondary/80">
                Controle de versões, histórico de alterações e aprovação de
                mudanças.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-white/5">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
            <div>
              <p className="text-white">
                Tem modelos específicos que gostaria de ver implementados?
              </p>
              <p>Entre em contato para sugerir funcionalidades.</p>
            </div>
            <Button as="a" color="primary" href="/help" radius="full">
              Sugerir funcionalidade
            </Button>
          </CardBody>
        </Card>
      </section>
    </PermissionGuard>
  );
}
