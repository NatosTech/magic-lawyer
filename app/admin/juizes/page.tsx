import { Metadata } from "next";

import { JuizesContent } from "./juizes-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Gerenciar Juízes Globais",
  description: "Administre os juízes públicos e pacotes premium do sistema",
};

export default function JuizesPage() {
  return (
    <ProfileDashboard>
      <JuizesContent />
    </ProfileDashboard>
  );
}
