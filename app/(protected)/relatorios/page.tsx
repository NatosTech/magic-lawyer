import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";
import { RelatoriosContent } from "./relatorios-content";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Insights avançados sobre performance jurídica e financeira.",
};

export default async function RelatoriosPage() {
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
    return <RelatoriosContent />;
  }

  // Para outros roles, verificar permissão relatorios.visualizar
  try {
    const hasPermission = await checkPermission("relatorios", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <RelatoriosContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /relatorios:", error);
    redirect("/dashboard");
  }
}
