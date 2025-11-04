import { redirect } from "next/navigation";

import AdvogadosContent from "./advogados-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export default async function AdvogadosPage() {
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
    return <AdvogadosContent />;
  }

  // Para outros roles, verificar permissão equipe.visualizar
  // A permissão equipe.visualizar é necessária para acessar /advogados
  // (conforme definido em use-profile-navigation.ts onde canManageTeam = equipe.visualizar)
  try {
    const hasPermission = await checkPermission("equipe", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <AdvogadosContent />;
  } catch (error) {
    // Se houver erro ao verificar permissões, redirecionar
    console.error("Erro ao verificar permissões para /advogados:", error);
    redirect("/dashboard");
  }
}
