import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Painel do escritório",
  description: "Resumo operacional e indicadores principais da banca.",
};

export default function DashboardPage() {
  return (
    <ProfileDashboard>
      <DashboardContent />
    </ProfileDashboard>
  );
}
