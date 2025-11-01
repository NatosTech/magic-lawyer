import { redirect } from "next/navigation";

type PageProps = {
  params: {
    processoId: string;
  };
};

export default function ProcessoAliasPage({ params }: PageProps) {
  redirect(`/processos/${params.processoId}`);
}
