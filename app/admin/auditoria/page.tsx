import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { AuditoriaContent } from "./auditoria-content";

export const metadata: Metadata = {
  title: "Auditoria",
  description: "Logs de sistema e auditoria do Magic Lawyer",
};

export default function AuditoriaPage() {
  return (
    <ProfileDashboard>
      <AuditoriaContent />
    </ProfileDashboard>
  );
}
