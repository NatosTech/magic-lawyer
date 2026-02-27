import { redirect } from "next/navigation";

import { NovoProcessoContent } from "./novo-processo-content";

import { getSession } from "@/app/lib/auth";
import { checkPermission } from "@/app/actions/equipe";
import { UserRole } from "@/generated/prisma";

export default async function NovoProcessoPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role === UserRole.SUPER_ADMIN) {
    redirect("/admin/dashboard");
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    const podeCriar = await checkPermission("processos", "criar");

    if (!podeCriar) {
      redirect("/processos");
    }
  }

  return <NovoProcessoContent />;
}
