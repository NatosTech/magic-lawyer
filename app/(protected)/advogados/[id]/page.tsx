import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import AdvogadoProfileContent from "./advogado-profile-content";

interface AdvogadoProfilePageProps {
  params: {
    id: string;
  };
}

export default async function AdvogadoProfilePage({ params }: AdvogadoProfilePageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar se o usuário tem permissão para acessar esta página
  if (session.user.role !== "ADMIN" && session.user.role !== "ADVOGADO") {
    redirect("/dashboard");
  }

  // Se for um advogado, só pode ver seu próprio perfil
  if (session.user.role === "ADVOGADO" && session.user.advogadoId !== params.id) {
    redirect("/dashboard");
  }

  return <AdvogadoProfileContent advogadoId={params.id} />;
}
