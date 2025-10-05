import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { RelatoriosContent } from "./relatorios-content";

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
