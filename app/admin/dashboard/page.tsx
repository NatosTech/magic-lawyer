import { Metadata } from "next";

import { AdminDashboardContent } from "./admin-dashboard-content";

import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Painel Administrativo",
  description: "Visão geral do sistema Magic Lawyer - SuperAdmin",
};

export default function AdminDashboard() {
  return (
    <ProfileDashboard>
      <AdminDashboardContent />
    </ProfileDashboard>
  );
}
