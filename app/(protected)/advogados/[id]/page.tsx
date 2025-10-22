import { redirect } from "next/navigation";

import AdvogadoProfileContent from "./advogado-profile-content";

import { getSession } from "@/app/lib/auth";

interface AdvogadoProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdvogadoProfilePage({ params }: AdvogadoProfilePageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar se o usuário tem permissão para acessar esta página
  if (session.user.role !== "ADMIN" && session.user.role !== "ADVOGADO") {
    redirect("/dashboard");
  }

  // Se for um advogado, só pode ver seu próprio perfil
  if (session.user.role === "ADVOGADO" && session.user.advogadoId !== id) {
    redirect("/dashboard");
  }

  return <AdvogadoProfileContent advogadoId={id} />;
}
