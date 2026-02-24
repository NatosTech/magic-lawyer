import { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiligenciasContent } from "./diligencias-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Diligências",
  description:
    "Organize diligências e ações operacionais vinculadas aos processos.",
};

export default async function DiligenciasPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // SuperAdmin vai para dashboard admin
  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Cliente não tem acesso
  if (user.role === "CLIENTE") {
    redirect("/dashboard");
  }

  // Admin sempre tem acesso
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return <DiligenciasContent />;
  }

  // Para outros roles, verificar permissão processos.visualizar
  // (diligências estão relacionadas a processos)
  try {
    const hasPermission = await checkPermission("processos", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <DiligenciasContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /diligencias:", error);
    redirect("/dashboard");
  }
}
