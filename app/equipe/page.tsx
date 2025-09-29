import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Equipe e permissões",
  description: "Administre usuários, papéis e convites do escritório.",
};

export default function EquipePage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Gestão de acesso</p>
        <h1 className={title({ size: "lg", color: "blue" })}>Controle total da equipe e das permissões</h1>
        <p className={subtitle({ fullWidth: true })}>Este módulo centralizará convites, papéis customizados, auditoria de sessões e sincronização com diretórios externos.</p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">Funcionalidades previstas</h2>
          <p className="text-sm text-default-400">O que estamos modelando para a equipe.</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Papéis personalizados</p>
            <p className="mt-2 text-primary/80">Defina permissões por módulo e ações sensíveis.</p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Convites com expiração</p>
            <p className="mt-2 text-success/80">Fluxo seguro para novos membros e prestadores.</p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Auditoria de sessões</p>
            <p className="mt-2 text-warning/80">Histórico de acessos, IPs e dispositivos por tenant.</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Deseja migrar permissões existentes?</p>
            <p>Preparamos scripts para importar usuários de planilhas ou outros sistemas.</p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Falar com suporte técnico
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
