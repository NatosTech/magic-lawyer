import { Metadata } from "next";

import { ConfiguracoesContent } from "./configuracoes-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Configurações do Sistema",
  description: "Configurações gerais do sistema Magic Lawyer",
};

export default function ConfiguracoesPage() {
  return (
    <ProfileDashboard>
      <ConfiguracoesContent />
    </ProfileDashboard>
  );
}
