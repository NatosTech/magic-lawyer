"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

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
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      tenant,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) router.push(callbackUrl);
    else alert("Falha ao entrar. Verifique suas credenciais.");
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold mb-6">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} isRequired />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} isRequired />
        <Input label="Escritório (slug/domínio)" value={tenant} onChange={(e) => setTenant(e.target.value)} description="Opcional. Se vazio, buscamos pelo e-mail dentro do tenant associado." />
        <Button type="submit" color="primary" isLoading={loading} fullWidth>
          Entrar
        </Button>
      </form>
    </div>
  );
}
