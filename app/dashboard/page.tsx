import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Painel do escritório",
  description: "Resumo operacional e indicadores principais da banca.",
};

export default function DashboardPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Visão geral</p>
        <h1 className={title({ size: "lg", color: "blue" })}>Painel inteligente do escritório</h1>
        <p className={subtitle({ fullWidth: true })}>
          Esta área exibirá métricas resumidas sobre prazos, satisfação dos clientes e produtividade da equipe. Estamos estruturando integrações com os módulos de processos, documentos e financeiro
          para consolidar tudo aqui.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">O que vem por aí</h2>
          <p className="text-sm text-default-400">Alguns widgets planejados para o lançamento beta.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="grid gap-4 text-sm text-default-400 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Monitor de prazos críticos</p>
            <p className="mt-2 text-primary/80">Alertas de audiências, vencimentos e SLA do escritório por tenant.</p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Indicadores financeiros</p>
            <p className="mt-2 text-success/80">Receita recorrente, inadimplência e margem por plano.</p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Engajamento do cliente</p>
            <p className="mt-2 text-warning/80">Uso do portal, documentos acessados e feedback dos clientes.</p>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
            <p className="font-semibold text-secondary">Saúde operacional</p>
            <p className="mt-2 text-secondary/80">Capacidade da equipe, tarefas pendentes e automações em execução.</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-col gap-3 text-sm text-default-400 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-white">Quer testar o dashboard completo?</p>
            <p>O roadmap inclui painéis customizados por tenant e exportação em PDF.</p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Entrar na lista beta
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
