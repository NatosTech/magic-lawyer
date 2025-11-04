import { redirect } from "next/navigation";

import RecibosContent from "./recibos-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export default async function RecibosPage() {
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
    return <RecibosContent />;
  }

  // Para outros roles, verificar permissão financeiro.visualizar
  try {
    const hasPermission = await checkPermission("financeiro", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <RecibosContent />;
  } catch (error) {
    console.error(
      "Erro ao verificar permissões para /financeiro/recibos:",
      error,
    );
    redirect("/dashboard");
  }
}
