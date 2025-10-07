import { Metadata } from "next";

import { RelatoriosContent } from "./relatorios-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Analytics e relatórios do sistema Magic Lawyer",
};

export default function RelatoriosPage() {
  return (
    <ProfileDashboard>
      <RelatoriosContent />
    </ProfileDashboard>
  );
}
