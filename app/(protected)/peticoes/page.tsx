import { redirect } from "next/navigation";

import PeticoesContent from "./peticoes-content";
import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export default async function PeticoesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // SuperAdmin vai para dashboard admin
  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Admin sempre tem acesso
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return <PeticoesContent />;
  }

  // Para outros roles, verificar permissão processos.visualizar
  // (peticoes estão relacionadas a processos)
  try {
    const hasPermission = await checkPermission("processos", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <PeticoesContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /peticoes:", error);
    redirect("/dashboard");
  }
}

