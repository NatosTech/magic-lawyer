import { Metadata } from "next";
import { redirect } from "next/navigation";

import { JuizesContent } from "./juizes-content";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export const metadata: Metadata = {
  title: "Base de Juízes",
  description: "Gestão da base de dados de juízes e suas especialidades.",
};

export default async function JuizesPage() {
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
    return (
      <ProfileDashboard>
        <JuizesContent />
      </ProfileDashboard>
    );
  }

  // Para outros roles, verificar permissão advogados.visualizar
  // (juizes usa advogados como proxy)
  try {
    const hasPermission = await checkPermission("advogados", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return (
      <ProfileDashboard>
        <JuizesContent />
      </ProfileDashboard>
    );
  } catch (error) {
    console.error("Erro ao verificar permissões para /juizes:", error);
    redirect("/dashboard");
  }
}
