import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { FileSignature, Plus } from "lucide-react";

import { title, subtitle } from "@/components/primitives";
import { PermissionGuard } from "@/components/permission-guard";

export const metadata: Metadata = {
  title: "Procurações",
  description: "Gestão de procurações e poderes jurídicos.",
};

export default function ProcuracoesPage() {
  return (
    <PermissionGuard permission="canViewAllDocuments">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
        <div className="flex items-start justify-between gap-4">
          <header className="space-y-4 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-success">Gestão de Procurações</p>
            <h1 className={title({ size: "lg", color: "green" })}>Procurações e Poderes</h1>
            <p className={subtitle({ fullWidth: true })}>Gerencie procurações ad judicia, vinculação a processos e controle de outorgados.</p>
          </header>
          <Button color="success" startContent={<Plus className="h-5 w-5" />} as={NextLink} href="/procuracoes/novo" size="lg">
            Nova Procuração
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-success" />
                <h2 className="text-lg font-semibold text-white">Procurações Vigentes</h2>
              </div>
              <p className="text-sm text-default-400">Controle de procurações ativas.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Vinculação a Processos</p>
                <p className="mt-2 text-success/80">Associe procurações a processos específicos.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Advogados Outorgados</p>
                <p className="mt-2 text-primary/80">Gerencie quais advogados possuem poderes para cada cliente.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Controle de Validade</p>
                <p className="mt-2 text-warning/80">Alertas de vencimento e renovação automática.</p>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-lg font-semibold text-white">Documentação</h2>
              <p className="text-sm text-default-400">Upload e armazenamento.</p>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="space-y-4 text-sm text-default-400">
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <p className="font-semibold text-success">Armazenamento Seguro</p>
                <p className="mt-2 text-success/80">PDFs organizados por cliente e processo.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary">Histórico Completo</p>
                <p className="mt-2 text-primary/80">Rastreabilidade de todas as procurações emitidas.</p>
              </div>
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="font-semibold text-warning">Revogação</p>
                <p className="mt-2 text-warning/80">Controle de procurações revogadas e substituições.</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/5">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
            <div>
              <p className="text-white">Precisa de integração com cartórios digitais?</p>
              <p>Conecte com e-Notariado ou outras plataformas de reconhecimento de firma digital.</p>
            </div>
            <Button as={NextLink} color="success" href="/help" radius="full">
              Solicitar integração
            </Button>
          </CardBody>
        </Card>
      </section>
    </PermissionGuard>
  );
}
