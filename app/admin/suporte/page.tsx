import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { SuporteContent } from "./suporte-content";

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
