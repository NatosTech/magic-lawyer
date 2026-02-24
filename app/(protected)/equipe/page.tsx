import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import EquipeContent from "./equipe-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Gestão de Equipe - Magic Lawyer",
  description: "Gerencie cargos, permissões e vinculações da equipe",
};

export default async function EquipePage() {
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
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <EquipeContent />
        </Suspense>
      </div>
    );
  }

  // Para outros roles, verificar permissão equipe.visualizar
  try {
    const hasPermission = await checkPermission("equipe", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return (
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <EquipeContent />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Erro ao verificar permissões para /equipe:", error);
    redirect("/dashboard");
  }
}
