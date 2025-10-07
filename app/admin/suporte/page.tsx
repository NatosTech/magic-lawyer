import { Metadata } from "next";

import { SuporteContent } from "./suporte-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Central de suporte e ajuda do Magic Lawyer",
};

export default function SuportePage() {
  return (
    <ProfileDashboard>
      <SuporteContent />
    </ProfileDashboard>
  );
}
