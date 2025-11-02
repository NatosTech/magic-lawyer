import { redirect } from "next/navigation";

import { getSession } from "@/app/lib/auth";
import { AdminAppShell } from "@/components/admin-app-shell";
import prisma from "@/app/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar se é SuperAdmin
  const userRole = (session.user as any)?.role;
  const userId = (session.user as any)?.id;

  if (userRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Validar se o SuperAdmin ainda existe e está ativo
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });

  if (!superAdmin || superAdmin.status !== "ACTIVE") {
    // SuperAdmin não existe ou está inativo, forçar logout
    // O cookie será limpo pelo middleware quando detectar o reason
    redirect("/login?reason=SUPER_ADMIN_NOT_FOUND");
  }

  return <AdminAppShell>{children}</AdminAppShell>;
}
