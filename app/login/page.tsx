"use client";

/* eslint-disable no-console */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast, closeToast } from "@heroui/toast";

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
        throw new Error(
          "Não foi possível contatar o servidor de autenticação.",
        );
      }

      if (!response.ok) {
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

      router.push(callbackUrl);
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
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold mb-6">Entrar</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          isRequired
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          isRequired
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          description="Opcional. Se vazio, buscamos pelo e-mail dentro do tenant associado."
          label="Escritório (slug/domínio)"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
        <Button fullWidth color="primary" isLoading={loading} type="submit">
          Entrar
        </Button>
      </form>
    </div>
  );
}
