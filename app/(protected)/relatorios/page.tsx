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
  title: "Relatórios",
  description: "Insights avançados sobre performance jurídica e financeira.",
};

export default async function RelatoriosPage() {
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
    return <RelatoriosContent />;
  }

  // Para outros roles, verificar permissão relatorios.visualizar
  try {
    const hasPermission = await checkPermission("relatorios", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <RelatoriosContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /relatorios:", error);
    redirect("/dashboard");
  }
}

function RelatoriosContent() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Inteligência jurídica
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Relatórios inteligentes para decisões estratégicas
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          O módulo de relatórios entregará dashboards dinâmicos, exportação em
          PDF/Excel e agendamento de envios por e-mail com filtros por tenant,
          equipe e área do direito.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Relatórios planejados
          </h2>
          <p className="text-sm text-default-400">
            Ferramentas que estamos projetando.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">
              Performance por cliente
            </p>
            <p className="mt-2 text-primary/80">
              Resultados, tempo médio e investimento por contrato.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">
              Indicadores de produtividade
            </p>
            <p className="mt-2 text-success/80">
              Horas dedicadas, tarefas concluídas e automações executadas.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Compliance & SLA</p>
            <p className="mt-2 text-warning/80">
              Auditoria de prazos e alertas para mitigação de riscos.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Quer acessar a prévia?</p>
            <p>
              Podemos habilitar relatórios personalizados para seu tenant
              durante o beta.
            </p>
          </div>
          <Button as="a" color="primary" href="/help" radius="full">
            Solicitar acesso antecipado
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
