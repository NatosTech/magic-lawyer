import { Metadata } from "next";

import { JuizesContent } from "./juizes-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Base de Juízes",
  description: "Gestão da base de dados de juízes e suas especialidades.",
};

export default function JuizesPage() {
  return (
    <ProfileDashboard>
      <JuizesContent />
    </ProfileDashboard>
  );
}
