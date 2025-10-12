import { Metadata } from "next";

import { DiligenciasContent } from "./diligencias-content";

export const metadata: Metadata = {
  title: "Diligências",
  description:
    "Organize diligências e ações operacionais vinculadas aos processos.",
};

export default function DiligenciasPage() {
  return <DiligenciasContent />;
}
