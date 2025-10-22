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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestão de Equipe
        </h1>
        <p className="text-default-500">
          Gerencie cargos, permissões e vinculações da equipe do escritório
        </p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <EquipeContent />
      </Suspense>
    </div>
  );
}
