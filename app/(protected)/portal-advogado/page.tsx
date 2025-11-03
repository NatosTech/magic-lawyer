import { getSession } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/app/generated/prisma";
import { PortalAdvogadoContent } from "./portal-advogado-content";

export default async function PortalAdvogadoPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role as UserRole | undefined;
  const isAdmin = userRole === UserRole.ADMIN;
  const isAdvogado = userRole === UserRole.ADVOGADO;

  // Apenas ADMIN e ADVOGADO podem acessar
  if (!isAdmin && !isAdvogado) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Portal do Advogado
        </h1>
        <p className="text-default-500">
          Acesse portais dos tribunais, consulte recessos forenses e acompanhe
          comunicados importantes
        </p>
      </div>

      <PortalAdvogadoContent />
    </div>
  );
}

