import { Metadata } from "next";

import { RegimesPrazoContent } from "./regimes-prazo-content";

export const metadata: Metadata = {
  title: "Regimes de Prazo",
  description: "Configuração de regimes de contagem de prazos processuais.",
};

export default function RegimesPrazoPage() {
  return <RegimesPrazoContent />;
}
