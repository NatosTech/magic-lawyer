import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { JuizesContent } from "./juizes-content";

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
