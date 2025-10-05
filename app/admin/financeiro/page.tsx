import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { FinanceiroContent } from "./financeiro-content";

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
