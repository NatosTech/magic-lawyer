import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Processos",
  description: "Gestão centralizada de processos, audiências e diligências.",
};

export default function ProcessosPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Operações jurídicas
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Todos os processos em um painel unificado
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Em breve você poderá acompanhar fases processuais, tarefas da equipe e
          documentos vinculados em um fluxo com filtros por tenant, área e
          responsável.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Roadmap do módulo
          </h2>
          <p className="text-sm text-default-400">
            Principais entregas planejadas.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">
              Kanban por fase processual
            </p>
            <p className="mt-2 text-primary/80">
              Visualize andamento, SLA e times responsáveis.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">
              Automação de diligências
            </p>
            <p className="mt-2 text-success/80">
              Integração com calendários, alertas e geração de relatórios.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Integração com PJe</p>
            <p className="mt-2 text-warning/80">
              Captura de movimentações oficiais por webhooks e cache
              inteligente.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Quer priorizar um tribunal específico?</p>
            <p>
              Nos conte quais integrações fazem mais sentido para sua banca.
            </p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Enviar sugestão
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
