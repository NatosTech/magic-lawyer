import { Metadata } from "next";

import { PacotesContent } from "./pacotes-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

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
