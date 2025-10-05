import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { ConfiguracoesContent } from "./configuracoes-content";

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
