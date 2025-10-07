import { Metadata } from "next";
import ContratosContent from "./contratos-content";

export const metadata: Metadata = {
  title: "Contratos",
  description: "Gestão completa de contratos e modelos jurídicos.",
};

export default function ContratosPage() {
  return <ContratosContent />;
}
