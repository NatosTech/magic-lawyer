import { Metadata } from "next";

import { FinanceiroContent } from "./financeiro-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Financeiro Global",
  description: "Gestão financeira global do sistema Magic Lawyer",
};

export default function FinanceiroPage() {
  return (
    <ProfileDashboard>
      <FinanceiroContent />
    </ProfileDashboard>
  );
}
