import { redirect } from "next/navigation";

import { getSession } from "@/app/lib/auth";
import { AdminAppShell } from "@/components/admin-app-shell";

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

  if (userRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return <AdminAppShell>{children}</AdminAppShell>;
}
