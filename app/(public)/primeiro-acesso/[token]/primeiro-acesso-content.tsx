"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { Button, Card, CardBody, CardHeader, Input, Spinner } from "@heroui/react";
import { addToast } from "@heroui/toast";

import {
  concluirPrimeiroAcesso,
  validarLinkPrimeiroAcesso,
} from "@/app/actions/primeiro-acesso";

interface PrimeiroAcessoContentProps {
  token: string;
}

type ValidacaoLinkState =
  | {
      status: "loading";
    }
  | {
      status: "valid";
      email: string;
      maskedEmail: string;
      tenantName: string;
    }
  | {
      status: "invalid";
      message: string;
      email?: string;
    };

export function PrimeiroAcessoContent({ token }: PrimeiroAcessoContentProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [validationState, setValidationState] = useState<ValidacaoLinkState>({
    status: "loading",
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const result = await validarLinkPrimeiroAcesso(token);

      if (!mounted) return;

      if (result.success) {
        if (!result.email || !result.maskedEmail || !result.tenantName) {
          setValidationState({
            status: "invalid",
            message:
              "Não foi possível validar os dados do primeiro acesso. Solicite um novo link.",
          });
          return;
        }

        setValidationState({
          status: "valid",
          email: result.email,
          maskedEmail: result.maskedEmail,
          tenantName: result.tenantName,
        });
        return;
      }

      if (result.reason === "EXPIRED") {
        setValidationState({
          status: "invalid",
          message:
            "Este link expirou. Volte ao login, informe seu e-mail e solicite um novo link de primeiro acesso.",
        });
        return;
      }

      setValidationState({
        status: "invalid",
        message:
          "Link inválido ou já utilizado. Volte ao login para solicitar um novo link.",
      });
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [token]);

  const submitDisabled = useMemo(
    () =>
      saving ||
      validationState.status !== "valid" ||
      password.length < 8 ||
      confirmPassword.length < 8,
    [confirmPassword.length, password.length, saving, validationState.status],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validationState.status !== "valid") return;

    setSaving(true);
    const result = await concluirPrimeiroAcesso({
      token,
      password,
      confirmPassword,
    });
    setSaving(false);

    if (!result.success) {
      addToast({
        title: "Não foi possível concluir",
        description: result.error,
        color: "danger",
      });
      return;
    }

    addToast({
      title: "Senha definida com sucesso",
      description: "Agora você já pode entrar no sistema.",
      color: "success",
    });

    const nextEmail = encodeURIComponent(result.email || validationState.email);
    router.replace(`/login?firstAccessReady=1&firstAccessEmail=${nextEmail}`);
  };

  if (validationState.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardBody className="flex items-center gap-3 py-10">
            <Spinner size="lg" />
            <p className="text-sm text-default-500">Validando link...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (validationState.status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-start gap-1">
            <h1 className="text-lg font-semibold">Primeiro acesso indisponível</h1>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-default-500">{validationState.message}</p>
            <Button as={NextLink} color="primary" href="/login">
              Voltar para login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md border border-default-200/70">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold">Definir senha de acesso</h1>
          <p className="text-sm text-default-500">
            {validationState.tenantName} · {validationState.maskedEmail}
          </p>
        </CardHeader>
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              isRequired
              label="Nova senha"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              isRequired
              label="Confirmar senha"
              minLength={8}
              placeholder="Repita a nova senha"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button
              color="primary"
              fullWidth
              isDisabled={submitDisabled}
              isLoading={saving}
              type="submit"
            >
              Salvar senha e entrar
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
