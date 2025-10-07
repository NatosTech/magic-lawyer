import { Metadata } from "next";

import { TenantsContent } from "./tenants-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

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
