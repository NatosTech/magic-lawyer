import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { TenantsContent } from "./tenants-content";

export const metadata: Metadata = {
  title: "Gerenciar Tenants",
  description: "Administre todos os escritórios de advocacia do sistema",
};

export default function TenantsPage() {
  return (
    <ProfileDashboard>
      <TenantsContent />
    </ProfileDashboard>
  );
}
