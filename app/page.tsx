"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

const stats = [
  { label: "Processos monitorados", value: "3.200+" },
  { label: "Clientes atendidos", value: "1.540" },
  { label: "Prazo zero perdido", value: "99,2%" },
];

export default function Home() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const role = (session?.user as any)?.role as string | undefined;
    const target = role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard";

    router.replace(target);
  }, [status, session, router]);

  return (
    <section className="relative flex flex-col items-center justify-center gap-10 py-12 sm:py-16">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#3b82f6_0%,transparent_65%)] opacity-70" />

      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-black/70 px-6 py-10 text-center backdrop-blur-md shadow-[0px_25px_60px_-35px_rgba(59,130,246,0.65)]">
        <Chip className="mb-6 px-4 py-2 text-sm uppercase tracking-[0.3em] text-primary-200" color="primary" variant="flat">
          SaaS jurídico multi-tenant
        </Chip>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">Automação e inteligência para escritórios de advocacia premium</h1>
        <p className="mt-6 text-base text-default-300 sm:text-lg md:text-xl">
          Centralize processos, documentos e relacionamentos com clientes em um painel elegante, seguro e personalizado para cada escritório.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={NextLink} className="min-w-[200px]" color="primary" href="/login" radius="full" size="lg">
            Entrar na plataforma
          </Button>
          <Button as={NextLink} className="border-white/20 text-white" href="/precos" radius="full" size="lg" variant="bordered">
            Ver planos e recursos
          </Button>
        </div>
        <p className="mt-6 text-xs text-default-400">Totens de auditoria, timeline inteligente e área do cliente com marca branca em minutos.</p>
      </div>

      <div className="flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-white/5 bg-white/5 p-6 text-white backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        {stats.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-3xl font-semibold text-primary-200 sm:text-4xl">{item.value}</span>
            <span className="text-sm uppercase tracking-wide text-default-300">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="max-w-4xl text-center text-default-300">
        <p>
          Magic Lawyer foi desenhado com os melhores escritórios do país para reduzir trabalho manual, garantir conformidade com a OAB e encantar clientes com transparência. A mesma infraestrutura
          pode ser personalizada por tenant, com domínio, cores, documentos e notificações exclusivas.
        </p>
      </div>
    </section>
  );
}
