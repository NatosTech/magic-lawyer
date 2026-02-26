import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";

import { title, subtitle } from "@/components/primitives";
import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Financeiro",
  description: "Análises de faturamento, custos e assinaturas por tenant.",
};

export default async function FinanceiroPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // SuperAdmin vai para dashboard admin
  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Admin sempre tem acesso
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return <FinanceiroContent />;
  }

  // Para outros roles, verificar permissão financeiro.visualizar
  try {
    const hasPermission = await checkPermission("financeiro", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <FinanceiroContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /financeiro:", error);
    redirect("/dashboard");
  }
}

function FinanceiroContent() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Saúde financeira
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Controle completo de receitas e despesas jurídicas
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Estamos construindo integrações com gateways de pagamento e centros de
          custo para que cada escritório acompanhe faturamento, inadimplência e
          fluxo de caixa em tempo real.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Módulos previstos
          </h2>
          <p className="text-sm text-default-400">
            Escopo inicial do financeiro.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Dashboard de receitas</p>
            <p className="mt-2 text-primary/80">
              Visão de MRR, LTV, churn e comparativos por plano.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Controle de cobranças</p>
            <p className="mt-2 text-warning/80">
              Status de pagamentos, tentativas e automações de cobrança.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Centro de custos</p>
            <p className="mt-2 text-success/80">
              Apropriação por caso, cliente e equipe.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Integração contábil é prioridade?</p>
            <p>
              Avise a equipe para conectarmos com o seu ERP ou escritório
              parceiro.
            </p>
          </div>
          <Button as="a" color="primary" href="/help" radius="full">
            Agendar onboarding financeiro
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
