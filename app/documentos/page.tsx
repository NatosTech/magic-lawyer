import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Documentos",
  description: "Gestão de documentos jurídicos com controle de visibilidade e auditoria.",
};

export default function DocumentosPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Central de arquivos</p>
        <h1 className={title({ size: "lg", color: "blue" })}>Biblioteca segura por cliente, processo e tenant</h1>
        <p className={subtitle({ fullWidth: true })}>Consolidaremos uploads com versionamento, expiração de links e visibilidade granular para clientes, equipe interna e parceiros.</p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Funcionalidades em andamento</h2>
          <p className="text-sm text-default-400">Planejamento do módulo de documentos.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Armazenamento criptografado</p>
            <p className="mt-2 text-primary/80">Integração com storage seguro e antivírus automático.</p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Fluxos de aprovação</p>
            <p className="mt-2 text-warning/80">Controle de liberação para clientes com registro de auditoria.</p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Busca semântica</p>
            <p className="mt-2 text-success/80">OCR e tags automáticas para documentos recorrentes.</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Precisa migrar acervos antigos?</p>
            <p>Nossa equipe auxilia com scripts de importação e deduplicação.</p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Falar com especialistas
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
