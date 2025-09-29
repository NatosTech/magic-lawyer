import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Central de suporte",
  description: "Abra tickets, consulte status e converse com nossa equipe.",
};

export default function HelpPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Suporte Magic Lawyer
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Estamos aqui para ajudar
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Utilize a central para abrir tickets técnicos, solicitar treinamentos
          ou acompanhar o status de integrações personalizadas do seu
          escritório.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <h2 className="text-lg font-semibold text-white">
            Canais disponíveis
          </h2>
          <p className="text-sm text-default-400">
            Escolha o que melhor atende sua necessidade.
          </p>
        </CardHeader>
        <CardBody className="grid gap-4 pt-4 text-sm text-default-400 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Abrir ticket</p>
            <p className="mt-2 text-primary/80">
              Registro oficial com SLA e acompanhamento por e-mail.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Agendar onboarding</p>
            <p className="mt-2 text-success/80">
              Sessões remotas para treinar sua equipe no Magic Lawyer.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Base de conhecimento</p>
            <p className="mt-2 text-warning/80">
              Artigos e vídeos de apoio, disponíveis 24/7.
            </p>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
            <p className="font-semibold text-secondary">Canal de emergências</p>
            <p className="mt-2 text-secondary/80">
              Contato prioritário para incidentes críticos e falhas de produção.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          as={NextLink}
          color="primary"
          href="mailto:suporte@magiclawyer.com"
          radius="full"
        >
          Enviar e-mail
        </Button>
        <Button
          as={NextLink}
          color="primary"
          href="/docs"
          radius="full"
          variant="bordered"
        >
          Abrir base de conhecimento
        </Button>
      </div>
    </section>
  );
}
