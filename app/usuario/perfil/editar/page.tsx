import { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Editar perfil",
  description: "Personalize seus dados, preferências e informações de contato.",
};

export default function EditUserProfilePage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Área do usuário
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Atualize seu perfil com segurança
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Em breve você poderá ajustar seus dados pessoais, preferências de
          notificação e autenticação diretamente por aqui. Enquanto finalizamos
          o formulário inteligente, você encontra abaixo as próximas etapas e
          pontos de atenção.
        </p>
      </header>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <h2 className="text-lg font-semibold text-white">
            O que você poderá fazer
          </h2>
          <p className="text-sm text-default-400">
            Planejamos liberar os recursos em ondas para garantir máxima
            segurança.
          </p>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-default-400">
          <p className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              1
            </span>
            Atualize nome, e-mail e imagem de perfil sincronizada com seu
            escritório.
          </p>
          <Divider className="border-white/5" />
          <p className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              2
            </span>
            Revise preferências de acesso, autenticação em duas etapas e
            notificações críticas.
          </p>
          <Divider className="border-white/5" />
          <p className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              3
            </span>
            Centralize documentos pessoais e garantias LGPD com rastreabilidade
            do Magic Lawyer.
          </p>
        </CardBody>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-default-400">
            Última atualização: setembro/2025 · Versão piloto do módulo de
            perfil.
          </div>
          <Button
            as={NextLink}
            color="primary"
            href="/"
            radius="full"
            size="sm"
          >
            Voltar ao dashboard
          </Button>
        </CardFooter>
      </Card>

      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <h2 className="text-base font-semibold text-primary">
            Precisa editar algo agora?
          </h2>
          <p className="text-sm text-primary/80">
            Enquanto o formulário não está liberado, nossa equipe pode ajudar
            você pela central de suporte.
          </p>
        </CardHeader>
        <CardBody className="text-sm text-primary/90">
          Abra um ticket e selecione a categoria{" "}
          <strong>Perfil e acesso</strong>. Nosso time responde em até 1 dia
          útil com as orientações.
        </CardBody>
        <CardFooter>
          <Button
            as={NextLink}
            color="primary"
            href="/about"
            radius="full"
            variant="bordered"
          >
            Falar com suporte
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
