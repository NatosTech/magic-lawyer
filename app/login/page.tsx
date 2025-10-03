"use client";

/* eslint-disable no-console */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { addToast, closeToast } from "@heroui/toast";
import NextLink from "next/link";
import { Logo } from "@/components/icons";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get("callbackUrl") || "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = email.trim();
    const sanitizedTenant = tenant.trim();

    if (!sanitizedEmail || !password.trim()) {
      addToast({
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para continuar.",
        color: "warning",
        timeout: 4000,
      });

      return;
    }

    const attemptContext = {
      email: sanitizedEmail,
      tenant: sanitizedTenant || "(auto)",
    };

    console.info("[login] Tentativa de login iniciada", attemptContext);

    setLoading(true);

    const loginPromise = (async () => {
      const response = await signIn("credentials", {
        email: sanitizedEmail,
        password,
        tenant: sanitizedTenant || undefined,
        redirect: false,
      });

      if (!response) {
        throw new Error("Não foi possível contatar o servidor de autenticação.");
      }

      if (!response.ok) {
        throw new Error(response.error ?? "Credenciais inválidas. Verifique seus dados e tente novamente.");
      }

      console.info("[login] Autenticação concluída", attemptContext);

      return response;
    })();

    const loaderKey = addToast({
      title: "Conectando ao escritório",
      description: "Validando suas credenciais com segurança...",
      color: "primary",
      promise: loginPromise,
      timeout: 0,
      hideCloseButton: true,
      shouldShowTimeoutProgress: false,
    });

    try {
      await loginPromise;

      if (loaderKey) {
        closeToast(loaderKey);
      }

      addToast({
        title: "Bem-vindo(a)!",
        description: "Login efetuado com sucesso.",
        color: "success",
        timeout: 3500,
      });

      router.push(callbackUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado durante o login.";

      console.warn("[login] Falha na autenticação", {
        ...attemptContext,
        error: message,
      });

      if (loaderKey) {
        closeToast(loaderKey);
      }

      addToast({
        title: "Erro ao entrar",
        description: message,
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      {/* Botão de voltar */}
      <Button
        as={NextLink}
        className="fixed top-6 left-6 z-10"
        color="default"
        href="/"
        radius="full"
        size="sm"
        variant="bordered"
        startContent={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
      >
        Voltar
      </Button>

      <div className="w-full max-w-md">
        {/* Header com logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-primary/15 p-3">
              <Logo className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-default-400 text-sm">Entre na sua conta para acessar o escritório</p>
        </div>

        {/* Card de login */}
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔐</span>
              <h2 className="text-lg font-semibold text-white">Acesso seguro</h2>
            </div>
            <p className="text-sm text-default-400">Suas credenciais são protegidas com criptografia de ponta</p>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody className="pt-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                isRequired
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startContent={<span className="text-default-400 text-sm">📧</span>}
                className="mb-4"
              />
              <Input
                isRequired
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startContent={<span className="text-default-400 text-sm">🔒</span>}
                className="mb-4"
              />
              <Input
                description="Opcional. Se vazio, buscamos pelo e-mail dentro do tenant associado."
                label="Escritório (slug/domínio)"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                startContent={<span className="text-default-400 text-sm">🏢</span>}
                className="mb-6"
              />
              <Button fullWidth color="primary" isLoading={loading} type="submit" size="lg" startContent={loading ? null : <span>🚀</span>}>
                {loading ? "Conectando..." : "Entrar no sistema"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Links úteis */}
        <div className="mt-6 text-center">
          <p className="text-xs text-default-500 mb-4">Não tem uma conta ainda?</p>
          <div className="flex flex-col gap-2">
            <Button as={NextLink} className="border-white/20 text-white" href="/precos" radius="full" size="sm" variant="bordered" startContent={<span>💎</span>}>
              Ver planos disponíveis
            </Button>
            <Button as={NextLink} className="text-default-400" href="/about" radius="full" size="sm" variant="light" startContent={<span>ℹ️</span>}>
              Saiba mais sobre a plataforma
            </Button>
          </div>
        </div>

        {/* Recursos destacados */}
        <Card className="mt-8 border border-white/10 bg-white/5">
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-semibold text-white">Recursos em destaque</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">⚡</span>
                <span className="text-xs text-default-400">Automação</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">📊</span>
                <span className="text-xs text-default-400">Relatórios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">🔔</span>
                <span className="text-xs text-default-400">Alertas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">👥</span>
                <span className="text-xs text-default-400">Equipe</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Badge de segurança */}
        <div className="mt-6 text-center">
          <Chip color="success" size="sm" variant="flat" startContent={<span>🛡️</span>}>
            Login 100% seguro
          </Chip>
        </div>
      </div>
    </div>
  );
}
