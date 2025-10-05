import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { PacotesContent } from "./pacotes-content";

export const metadata: Metadata = {
  title: "Pacotes Premium",
  description: "Gerencie os pacotes de juízes e monetização do sistema",
};

export default function PacotesPage() {
  return (
    <ProfileDashboard>
      <PacotesContent />
    </ProfileDashboard>
  );
}
