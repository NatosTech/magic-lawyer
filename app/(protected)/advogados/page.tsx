import { redirect } from "next/navigation";

import AdvogadosContent from "./advogados-content";

import { getSession } from "@/app/lib/auth";

export default async function AdvogadosPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar se é admin do tenant (não SuperAdmin)
  const user = session.user as any;

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdvogadosContent />;
}
