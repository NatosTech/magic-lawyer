import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { JuizesContent } from "./juizes-content";

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
