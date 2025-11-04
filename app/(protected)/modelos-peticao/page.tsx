import { redirect } from "next/navigation";

import ModelosPeticaoContent from "./modelos-peticao-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/app/generated/prisma";

export default async function ModelosPeticaoPage() {
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
    return <ModelosPeticaoContent />;
  }

  // Para outros roles, verificar permissão processos.visualizar
  // (modelos de petição estão relacionados a processos)
  try {
    const hasPermission = await checkPermission("processos", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    return <ModelosPeticaoContent />;
  } catch (error) {
    console.error("Erro ao verificar permissões para /modelos-peticao:", error);
    redirect("/dashboard");
  }
}
