import { Metadata } from "next";

import { AuditoriaContent } from "./auditoria-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

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
