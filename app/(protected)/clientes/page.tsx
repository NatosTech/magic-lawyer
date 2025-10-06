import { Metadata } from "next";
import { ClientesContent } from "./clientes-content";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Gestão completa da base de clientes do escritório.",
};

export default function ClientesPage() {
  return <ClientesContent />;
}
