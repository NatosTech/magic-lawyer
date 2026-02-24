import { redirect } from "next/navigation";

import AndamentosContent from "./andamentos-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export default async function AndamentosPage() {
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
    return <AndamentosContent />;
  }

  // Cliente sempre tem acesso (para ver seus próprios andamentos)
  if (user.role === "CLIENTE") {
    return <AndamentosContent />;
  }

  // Para outros roles, verificar permissão processos.visualizar
  // (andamentos estão relacionados a processos)
  try {
    const hasPermission = await checkPermission("processos", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <AndamentosContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /andamentos:", error);
    redirect("/dashboard");
  }
}
