import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    processoId: string;
  }>;
};

export default async function ProcessoAliasPage({ params }: PageProps) {
  const { processoId } = await params;

  redirect(`/processos/${processoId}`);
}
