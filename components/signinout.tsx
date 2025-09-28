"use client";

import Link from "next/link";
import { Button } from "@heroui/button";
import { signOut, useSession } from "next-auth/react";

export function SignInOut() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button isLoading size="sm" variant="light">
        Carregando
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button as={Link} color="primary" href="/login" variant="flat">
        Entrar
      </Button>
    );
  }

  const displayName = session.user.name || session.user.email;

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-default-500">{displayName}</span>
      <Button size="sm" variant="ghost" onPress={handleSignOut}>
        Sair
      </Button>
    </div>
  );
}
