import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    processoId: string;
  }>;
};

export default async function ProcessoEditarAliasPage({ params }: PageProps) {
  const { processoId } = await params;

  redirect(`/processos/${processoId}/editar`);
}
