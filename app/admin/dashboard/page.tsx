import { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { AdminDashboardContent } from "./admin-dashboard-content";

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
