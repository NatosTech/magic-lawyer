import { Metadata } from "next";

import { CausasContent } from "./causas-content";

export const metadata: Metadata = {
  title: "Causas",
  description: "Catálogo de causas e assuntos processuais do escritório.",
};

export default function CausasPage() {
  return <CausasContent />;
}
