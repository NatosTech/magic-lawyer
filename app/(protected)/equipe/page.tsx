import { Suspense } from "react";
import { Metadata } from "next";

import EquipeContent from "./equipe-content";

export const metadata: Metadata = {
  title: "Gestão de Equipe - Magic Lawyer",
  description: "Gerencie cargos, permissões e vinculações da equipe",
};

export default function EquipePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<div>Carregando...</div>}>
        <EquipeContent />
      </Suspense>
    </div>
  );
}
