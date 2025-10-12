"use client";

/* eslint-disable no-console */

import { Suspense, useCallback, useEffect, useState } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { addToast, closeToast } from "@heroui/toast";
import NextLink from "next/link";

import { Logo } from "@/components/icons";

function LoginPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get("callbackUrl");

  const resolveRedirectTarget = useCallback(
    (role?: string | null) => {
      const defaultTarget =
        role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard";

      if (!callbackUrl) {
        return defaultTarget;
      }

      const parsedTarget = (() => {
        // Permitir somente rotas internas
        if (callbackUrl.startsWith("/")) {
          return callbackUrl;
        }

        try {
          if (typeof window === "undefined") {
            return null;
          }

          const url = new URL(callbackUrl, window.location.origin);

          if (url.origin !== window.location.origin) {
            return null;
          }

          return `${url.pathname}${url.search}${url.hash}` || null;
        } catch (error) {
          console.warn("[login] Callback inválida, usando padrão", {
            callbackUrl,
            error,
          });

          return null;
        }
      })();

      if (!parsedTarget) {
        return defaultTarget;
      }

      // Bloquear acesso indevido às áreas erradas conforme o perfil
      if (role === "SUPER_ADMIN" && !parsedTarget.startsWith("/admin")) {
        return "/admin/dashboard";
      }

      if (role !== "SUPER_ADMIN" && parsedTarget.startsWith("/admin")) {
        return defaultTarget;
      }

      return parsedTarget;
    },
    [callbackUrl],
  );

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const role = (session?.user as any)?.role as string | undefined;
    const target = resolveRedirectTarget(role);

    router.replace(target);
  }, [status, session, router, resolveRedirectTarget]);

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

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitizedEmail)) {
      addToast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
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
        throw new Error(
          "Não foi possível contatar o servidor de autenticação.",
        );
      }

      if (!response.ok) {
        // Tratamento específico de erros
        if (response.error === "CredentialsSignin") {
          throw new Error(
            "Usuário não encontrado ou credenciais inválidas. Verifique seu e-mail, senha e escritório.",
          );
        }
        throw new Error(
          response.error ??
            "Credenciais inválidas. Verifique seus dados e tente novamente.",
        );
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

      const freshSession = await getSession();
      const role = (freshSession?.user as any)?.role as string | undefined;
      const target = resolveRedirectTarget(role);

      router.replace(target);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado durante o login.";

      console.warn("[login] Falha na autenticação", {
        ...attemptContext,
        error: message,
      });

      if (loaderKey) {
        closeToast(loaderKey);
      }

      // Mensagens mais específicas baseadas no tipo de erro
      let title = "Erro ao entrar";
      let description = message;
      let color: "danger" | "warning" = "danger";

      if (
        message.includes("Usuário não encontrado") ||
        message.includes("credenciais inválidas")
      ) {
        title = "Credenciais inválidas";
        description =
          "Verifique se seu e-mail, senha e escritório estão corretos. Se não souber o slug do escritório, deixe o campo vazio.";
        color = "warning";
      } else if (message.includes("Não foi possível contatar")) {
        title = "Erro de conexão";
        description = "Verifique sua conexão com a internet e tente novamente.";
      }

      addToast({
        title,
        description,
        color,
        timeout: 6000,
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
        startContent={
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        }
        variant="bordered"
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
          <h1 className="text-2xl font-bold text-white mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-default-400 text-sm">
            Entre na sua conta para acessar o escritório
          </p>
        </div>

        {/* Card de login */}
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔐</span>
              <h2 className="text-lg font-semibold text-white">
                Acesso seguro
              </h2>
            </div>
            <p className="text-sm text-default-400">
              Suas credenciais são protegidas com criptografia de ponta
            </p>
            <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-sm">💡</span>
                <div>
                  <p className="text-xs font-medium text-blue-300">Dica:</p>
                  <p className="text-xs text-blue-200">
                    Se não souber o slug do escritório, deixe o campo vazio. O
                    sistema tentará encontrar automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <Divider className="border-white/10" />
          <CardBody className="pt-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                isRequired
                className="mb-4"
                label="E-mail"
                startContent={
                  <span className="text-default-400 text-sm">📧</span>
                }
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                isRequired
                className="mb-4"
                label="Senha"
                startContent={
                  <span className="text-default-400 text-sm">🔒</span>
                }
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                className="mb-6"
                description="Opcional. Se não souber, deixe vazio. Exemplo: meu-escritorio ou meuescritorio.com.br"
                label="Escritório (slug/domínio)"
                placeholder="meu-escritorio"
                startContent={
                  <span className="text-default-400 text-sm">🏢</span>
                }
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              />
              <Button
                fullWidth
                color="primary"
                isLoading={loading}
                size="lg"
                startContent={loading ? null : <span>🚀</span>}
                type="submit"
              >
                {loading ? "Conectando..." : "Entrar no sistema"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Links úteis */}
        <div className="mt-6 text-center">
          <p className="text-xs text-default-500 mb-4">
            Não tem uma conta ainda?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              as={NextLink}
              className="border-white/20 text-white"
              href="/precos"
              radius="full"
              size="sm"
              startContent={<span>💎</span>}
              variant="bordered"
            >
              Ver planos disponíveis
            </Button>
            <Button
              as={NextLink}
              className="text-default-400"
              href="/about"
              radius="full"
              size="sm"
              startContent={<span>ℹ️</span>}
              variant="light"
            >
              Saiba mais sobre a plataforma
            </Button>
          </div>
        </div>

        {/* Recursos destacados */}
        <Card className="mt-8 border border-white/10 bg-white/5">
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-semibold text-white">
                Recursos em destaque
              </h3>
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
          <Chip
            color="success"
            size="sm"
            startContent={<span>🛡️</span>}
            variant="flat"
          >
            Login 100% seguro
          </Chip>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginPageInner />
    </Suspense>
  );
}
