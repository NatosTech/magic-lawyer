import { Metadata } from "next";

import { TenantCreateContent } from "./tenant-create-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Criar novo tenant",
  description: "Cadastro de novos escritórios na plataforma",
};

export default function NewTenantPage() {
  return (
    <ProfileDashboard>
      <TenantCreateContent />
    </ProfileDashboard>
  );
}

