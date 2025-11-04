import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientesContent } from "./clientes-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Gestão completa da base de clientes do escritório.",
};

export default async function ClientesPage() {
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
    return <ClientesContent />;
  }

  // Para outros roles, verificar permissão clientes.visualizar
  try {
    const hasPermission = await checkPermission("clientes", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <ClientesContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /clientes:", error);
    redirect("/dashboard");
  }
}
