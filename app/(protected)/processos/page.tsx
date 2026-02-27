import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProcessosContent } from "./processos-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Processos",
  description: "Gestão centralizada de processos, audiências e diligências.",
};

export default async function ProcessosPage() {
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
    return <ProcessosContent canCreateProcesso canSyncOab />;
  }

  // Para outros roles, verificar permissão processos.visualizar
  try {
    const hasPermission = await checkPermission("processos", "visualizar");

    if (!hasPermission) {
      redirect("/dashboard");
    }

    const [canCreateProcesso, canSyncOab] = await Promise.all([
      checkPermission("processos", "criar"),
      checkPermission("processos", "editar"),
    ]);

    return (
      <ProcessosContent
        canCreateProcesso={canCreateProcesso}
        canSyncOab={canSyncOab}
      />
    );
  } catch (error) {
    console.error("Erro ao verificar permissões para /processos:", error);
    redirect("/dashboard");
  }
}
