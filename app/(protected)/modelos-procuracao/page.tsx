import { redirect } from "next/navigation";

import ModelosProcuracaoContent from "./modelos-procuracao-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export default async function ModelosProcuracaoPage() {
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
    return <ModelosProcuracaoContent />;
  }

  // Para outros roles, verificar permissão clientes.visualizar
  // (modelos de procuração estão relacionados a clientes)
  try {
    const hasPermission = await checkPermission("clientes", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <ModelosProcuracaoContent />;
  } catch (error) {
    console.error(
      "Erro ao verificar permissões para /modelos-procuracao:",
      error,
    );
    redirect("/dashboard");
  }
}
