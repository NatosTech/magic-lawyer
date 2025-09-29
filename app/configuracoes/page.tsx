import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Configurações do escritório",
  description: "Personalize branding, integrações e preferências avançadas.",
};

export default function ConfiguracoesPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Preferências
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Central de configurações do tenant
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Customize identidade visual, domínios, integrações externas e
          políticas de segurança do seu escritório em um só lugar.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Itens em desenvolvimento
          </h2>
          <p className="text-sm text-default-400">
            Personalização completa do tenant.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4 text-sm text-default-400">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary">Tema white label</p>
            <p className="mt-2 text-primary/80">
              Logotipos, paleta, domínios customizados e e-mails transacionais.
            </p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="font-semibold text-success">Integrações externas</p>
            <p className="mt-2 text-success/80">
              Configuração de assinaturas digitais, e-mail e CRMs parceiros.
            </p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Políticas de segurança</p>
            <p className="mt-2 text-warning/80">
              Autenticação multifator, rotinas de backup e retention policies.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-white/5">
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-400">
          <div>
            <p className="text-white">Precisando de ajuda com branding?</p>
            <p>
              Conte com nosso time para acelerar o setup white label do
              escritório.
            </p>
          </div>
          <Button as={NextLink} color="primary" href="/help" radius="full">
            Falar sobre branding
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
