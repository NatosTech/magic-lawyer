import { Metadata } from "next";

import { PlanosContent } from "./planos-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Controle de Planos",
  description:
    "Gerencie os planos comerciais e os módulos liberados por versão",
};

export default function PlanosAdminPage() {
  return (
    <ProfileDashboard>
      <PlanosContent />
    </ProfileDashboard>
  );
}
