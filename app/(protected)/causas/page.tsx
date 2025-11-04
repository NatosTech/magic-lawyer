import { Metadata } from "next";
import { redirect } from "next/navigation";

import { CausasContent } from "./causas-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export const metadata: Metadata = {
  title: "Causas",
  description: "Catálogo de causas e assuntos processuais do escritório.",
};

export const dynamic = "force-dynamic";

export default async function CausasPage() {
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
    return <CausasContent />;
  }

  // Para outros roles, verificar permissão processos.visualizar OU equipe.editar
  // (causas requerem canViewAllProcesses ou canManageOfficeSettings)
  try {
    const hasProcessosPermission = await checkPermission(
      "processos",
      "visualizar",
    );
    const hasEquipePermission = await checkPermission("equipe", "editar");

    if (!hasProcessosPermission && !hasEquipePermission) {
      redirect("/dashboard");
    }

    return <CausasContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /causas:", error);
    redirect("/dashboard");
  }
}
