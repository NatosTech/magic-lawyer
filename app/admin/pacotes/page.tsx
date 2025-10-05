import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { PacotesContent } from "./pacotes-content";

export const metadata: Metadata = {
  title: "Planos de Assinatura",
  description: "Gerencie os planos de assinatura e monetização do sistema",
};

export default function PacotesPage() {
  return (
    <ProfileDashboard>
      <PacotesContent />
    </ProfileDashboard>
  );
}
