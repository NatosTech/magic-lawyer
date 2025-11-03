"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { useTenantFromDomain } from "@/hooks/use-tenant-from-domain";

function LoginPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, data: session } = useSession();
  const tenantFromDomain = useTenantFromDomain();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const [devQuickLogins, setDevQuickLogins] = useState<
    Array<{
      group: string;
      description?: string;
      options: Array<{
        name: string;
        roleLabel: string;
        email: string;
        password: string;
        tenant?: string;
        chipColor?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
      }>;
    }>
  >([]);
  const callbackUrl = params.get("callbackUrl");
  const reason = params.get("reason"); // Motivo do redirecionamento
  const isDevMode = process.env.NODE_ENV === "development";
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

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

  const attemptLogin = useCallback(
    async ({
      email: rawEmail,
      password: rawPassword,
      tenantOverride,
    }: {
      email: string;
      password: string;
      tenantOverride?: string;
    }) => {
      const sanitizedEmail = rawEmail.trim();
      const sanitizedPassword = rawPassword.trim();
      const baseTenant =
        tenantOverride !== undefined ? tenantOverride : tenant;
      const sanitizedTenant = baseTenant ? baseTenant.trim() : "";

      if (!sanitizedEmail || !sanitizedPassword) {
        addToast({
          title: "Campos obrigatórios",
          description: "Preencha e-mail e senha para continuar.",
          color: "warning",
          timeout: 4000,
        });

        return false;
      }

      if (!emailRegex.test(sanitizedEmail)) {
        addToast({
          title: "E-mail inválido",
          description: "Por favor, insira um e-mail válido.",
          color: "warning",
          timeout: 4000,
        });

        return false;
      }

      setLoading(true);

      const loginPromise = (async () => {
        const response = await signIn("credentials", {
          email: sanitizedEmail,
          password: sanitizedPassword,
          tenant: sanitizedTenant || tenantFromDomain || undefined,
          redirect: false,
        });

        if (!response) {
          throw new Error(
            "Não foi possível contatar o servidor de autenticação.",
          );
        }

        if (!response.ok) {
          if (response.error === "TENANT_SUSPENDED") {
            throw new Error("TENANT_SUSPENDED");
          }
          if (response.error === "TENANT_CANCELLED") {
            throw new Error("TENANT_CANCELLED");
          }

          if (response.error === "CredentialsSignin") {
            const currentHost = window.location.hostname;

            if (currentHost === "magiclawyer.vercel.app") {
              const tenantMappings: Record<string, string[]> = {
                sandra: ["sandra@adv.br", "ana@sandraadv.br"],
                salba: ["luciano@salbaadvocacia.com.br"],
              };

              for (const [tenantSlug, emails] of Object.entries(
                tenantMappings,
              )) {
                if (emails.includes(sanitizedEmail)) {
                  const redirectUrl = `https://${tenantSlug}.magiclawyer.vercel.app/login`;

                  addToast({
                    title: "Redirecionamento automático",
                    description:
                      "Você será redirecionado para o domínio correto do seu escritório.",
                    color: "primary",
                    timeout: 3000,
                  });

                  setTimeout(() => {
                    window.location.href = redirectUrl;
                  }, 2000);

                  return;
                }
              }
            }

            throw new Error(
              "Email ou senha incorretos. Verifique suas credenciais e tente novamente.",
            );
          }

          if (response.error?.startsWith("REDIRECT_TO_TENANT:")) {
            const tenantSlug = response.error.replace(
              "REDIRECT_TO_TENANT:",
              "",
            );
            const redirectUrl = `https://${tenantSlug}.magiclawyer.vercel.app/login`;

            addToast({
              title: "Redirecionamento automático",
              description:
                "Você será redirecionado para o domínio correto do seu escritório.",
              color: "primary",
              timeout: 3000,
            });

            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 2000);

            return;
          }

          throw new Error(
            response.error ??
              "Credenciais inválidas. Verifique seus dados e tente novamente.",
          );
        }

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
        const role = (freshSession?.user as any)?.role as
          | string
          | undefined;
        const target = resolveRedirectTarget(role);

        router.replace(target);
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado durante o login.";

        if (loaderKey) {
          closeToast(loaderKey);
        }

        let title = "Erro ao entrar";
        let description = message;
        let color: "danger" | "warning" = "danger";

        if (message === "TENANT_SUSPENDED") {
          title = "🔒 Escritório Suspenso";
          description =
            "Sua conta foi temporariamente suspensa. Entre em contato com o suporte para mais informações.";
          color = "warning";
        } else if (message === "TENANT_CANCELLED") {
          title = "❌ Escritório Cancelado";
          description =
            "Sua conta foi cancelada. Entre em contato com o suporte para reativar.";
          color = "danger";
        } else if (
          message.includes("Email ou senha incorretos") ||
          message.includes("credenciais inválidas")
        ) {
          title = "❌ Email ou senha incorretos";
          description =
            "Verifique se digitou corretamente seu email e senha. Lembre-se: a senha é sensível a maiúsculas e minúsculas.";
          color = "warning";
        } else if (message.includes("Não foi possível contatar")) {
          title = "Erro de conexão";
          description =
            "Verifique sua conexão com a internet e tente novamente.";
        }

        addToast({
          title,
          description,
          color,
          timeout: 6000,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [emailRegex, resolveRedirectTarget, router, tenant, tenantFromDomain],
  );
  // Exibir mensagem de motivo do redirecionamento
  useEffect(() => {
    if (reason && status !== "authenticated") {
      let title = "";
      let description = "";
      let color: "danger" | "warning" = "danger";

      switch (reason) {
        case "SUSPENDED":
        case "TENANT_SUSPENDED":
          title = "🔒 Escritório Suspenso";
          description =
            "Sua conta foi temporariamente suspensa. Entre em contato com o suporte para mais informações.";
          color = "warning";
          break;
        case "CANCELLED":
        case "TENANT_CANCELLED":
          title = "❌ Escritório Cancelado";
          description =
            "Sua conta foi cancelada. Entre em contato com o suporte para reativar.";
          color = "danger";
          break;
        case "TENANT_NOT_FOUND":
          title = "❌ Escritório Não Encontrado";
          description =
            "O escritório informado não existe ou foi removido do sistema.";
          color = "danger";
          break;
        case "SESSION_VERSION_MISMATCH":
          title = "🔄 Sessão Expirada";
          description =
            "Suas credenciais foram alteradas. Por favor, faça login novamente.";
          color = "warning";
          break;
        case "SESSION_REVOKED":
          title = "🔒 Sessão Revogada";
          description =
            "Sua sessão foi encerrada por segurança. Por favor, faça login novamente.";
          color = "warning";
          break;
        case "USER_DISABLED":
          title = "🚫 Usuário Desativado";
          description =
            "Sua conta foi desativada. Entre em contato com o administrador do escritório.";
          color = "warning";
          break;
        case "USER_ID_MISMATCH":
          title = "⚠️ Erro de Autenticação";
          description =
            "Houve um problema com sua sessão. Por favor, faça login novamente.";
          color = "warning";
          break;
        case "USER_NOT_FOUND":
          title = "❌ Usuário Não Encontrado";
          description = "Usuário não encontrado no sistema.";
          color = "danger";
          break;
        case "NOT_AUTHENTICATED":
          title = "❌ Não Autenticado";
          description = "Você precisa fazer login para acessar esta página.";
          color = "warning";
          break;
        case "INVALID_PAYLOAD":
          title = "⚠️ Erro de Comunicação";
          description =
            "Houve um problema ao validar sua sessão. Tente novamente.";
          color = "warning";
          break;
        case "INTERNAL_ERROR":
          title = "⚠️ Erro Interno";
          description =
            "Ocorreu um erro no servidor. Tente novamente mais tarde.";
          color = "danger";
          break;
        default:
          title = "⚠️ Acesso Negado";
          description = `Motivo: ${reason}. Entre em contato com o suporte.`;
          color = "danger";
      }

      addToast({
        title,
        description,
        color,
        timeout: 8000,
      });
    }
  }, [reason, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const role = (session?.user as any)?.role as string | undefined;
    const target = resolveRedirectTarget(role);

    router.replace(target);
  }, [status, session, router, resolveRedirectTarget]);

  useEffect(() => {
    if (!isDevMode) {
      setDevQuickLogins([]);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const host = window.location.host;

    if (host === "sandra.localhost:9192") {
      setDevQuickLogins([
        {
          group: "Sandra Advocacia",
          description: "Apenas para desenvolvimento local",
          options: [
            {
              name: "Sandra (Admin)",
              roleLabel: "ADMIN",
              email: "sandra@adv.br",
              password: "Sandra@123",
              tenant: "sandra",
              chipColor: "danger",
            },
            {
              name: "Jaqueline (Secretaria)",
              roleLabel: "SECRETARIA",
              email: "jaqueline.souza@sandraadv.br",
              password: "Funcionario@123",
              tenant: "sandra",
              chipColor: "secondary",
            },
            {
              name: "Ricardo (Advogado)",
              roleLabel: "ADVOGADO",
              email: "ricardo@sandraadv.br",
              password: "Advogado@123",
              tenant: "sandra",
              chipColor: "primary",
            },
            {
              name: "Fernanda (Advogada)",
              roleLabel: "ADVOGADA",
              email: "fernanda@sandraadv.br",
              password: "Advogado@123",
              tenant: "sandra",
              chipColor: "primary",
            },
            {
              name: "Marcos (Cliente)",
              roleLabel: "CLIENTE",
              email: "cliente@sandraadv.br",
              password: "Cliente@123",
              tenant: "sandra",
              chipColor: "success",
            },
            {
              name: "Ana (Cliente)",
              roleLabel: "CLIENTE",
              email: "ana@sandraadv.br",
              password: "Cliente@123",
              tenant: "sandra",
              chipColor: "success",
            },
            {
              name: "Carlos (Cliente Inova)",
              roleLabel: "CLIENTE",
              email: "inova@sandraadv.br",
              password: "Cliente@123",
              tenant: "sandra",
              chipColor: "success",
            },
          ],
        },
      ]);
    } else if (host === "localhost:9192") {
      setDevQuickLogins([
        {
          group: "Super Admins",
          description: "Acesso administrativo global",
          options: [
            {
              name: "Robson (Super Admin)",
              roleLabel: "SUPER_ADMIN",
              email: "robsonnonatoiii@gmail.com",
              password: "Robson123!",
              chipColor: "warning",
            },
            {
              name: "Talisia (Super Admin)",
              roleLabel: "SUPER_ADMIN",
              email: "talisiavmatos@gmail.com",
              password: "Talisia123!",
              chipColor: "warning",
            },
          ],
        },
      ]);
    } else {
      setDevQuickLogins([]);
    }
  }, [isDevMode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = email.trim();
    const sanitizedTenant = tenant.trim();

    await attemptLogin({
      email: sanitizedEmail,
      password,
      tenantOverride: sanitizedTenant,
    });
  };

  const handleDevQuickLogin = useCallback(
    async (option: {
      email: string;
      password: string;
      tenant?: string;
    }) => {
      if (loading) {
        return;
      }

      setEmail(option.email);
      setPassword(option.password);

      if (option.tenant !== undefined) {
        setTenant(option.tenant);
      }

      await attemptLogin({
        email: option.email,
        password: option.password,
        tenantOverride: option.tenant,
      });
    },
    [attemptLogin, loading],
  );

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

      {isDevMode && devQuickLogins.length > 0 && (
        <aside className="hidden lg:block fixed top-24 right-6 z-30 w-[320px] space-y-3">
          <Card className="border border-primary/20 shadow-2xl backdrop-blur bg-white/95 dark:bg-content1/90">
            <CardHeader className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-default-700 dark:text-default-200">
                  Painel Dev
                </p>
                <p className="text-xs text-default-400">
                  Logins rápidos para testes locais
                </p>
              </div>
              <Chip color="primary" size="sm" variant="flat">
                Dev only
              </Chip>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-5">
              {devQuickLogins.map((group, groupIndex) => (
                <div key={group.group} className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-default-600 dark:text-default-300">
                      {group.group}
                    </p>
                    {group.description ? (
                      <p className="text-xs text-default-400">{group.description}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <div
                        key={option.email}
                        className="flex items-center justify-between gap-2 rounded-lg border border-default-200 bg-default-50 px-3 py-2 dark:border-default-100/20 dark:bg-default-50/10"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-default-600 dark:text-default-100 truncate">
                            {option.name}
                          </p>
                          <Chip
                            className="mt-1"
                            color={option.chipColor ?? "default"}
                            size="sm"
                            variant="flat"
                          >
                            {option.roleLabel}
                          </Chip>
                        </div>
                        <Button
                          color="primary"
                          isDisabled={loading}
                          size="sm"
                          variant="flat"
                          onPress={() => handleDevQuickLogin(option)}
                        >
                          Logar
                        </Button>
                      </div>
                    ))}
                  </div>
                  {groupIndex !== devQuickLogins.length - 1 && <Divider />}
                </div>
              ))}
              <p className="text-[10px] text-default-400">
                Disponível apenas em ambientes de desenvolvimento. Usa as credenciais padrão do seed.
              </p>
            </CardBody>
          </Card>
        </aside>
      )}

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
