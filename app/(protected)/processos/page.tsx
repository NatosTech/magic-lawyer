import { Metadata } from "next";

import { ProcessosContent } from "./processos-content";

export const metadata: Metadata = {
  title: "Processos",
  description: "Gestão centralizada de processos, audiências e diligências.",
};

export default function ProcessosPage() {
  return <ProcessosContent />;
}
