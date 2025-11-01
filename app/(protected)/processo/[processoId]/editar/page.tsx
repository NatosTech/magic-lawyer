import { redirect } from "next/navigation";

type PageProps = {
  params: {
    processoId: string;
  };
};

export default function ProcessoEditarAliasPage({ params }: PageProps) {
  redirect(`/processos/${params.processoId}/editar`);
}
