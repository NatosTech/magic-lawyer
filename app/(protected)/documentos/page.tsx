import { Metadata } from "next";

import { DocumentosContent } from "./documentos-content";

import { getDocumentExplorerData } from "@/app/actions/documentos-explorer";

export const metadata: Metadata = {
  title: "Documentos",
  description:
    "Gestão de documentos jurídicos com organização em árvore por cliente e processo.",
};

export default async function DocumentosPage() {
  const explorerResult = await getDocumentExplorerData();

  return (
    <DocumentosContent
      initialData={
        explorerResult.success ? (explorerResult.data ?? null) : null
      }
      initialError={!explorerResult.success ? explorerResult.error : undefined}
    />
  );
}
