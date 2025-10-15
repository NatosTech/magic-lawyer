import { Metadata } from "next";
import { notFound } from "next/navigation";

import { TenantManagementContent } from "./tenant-management-content";

import {
  getTenantManagementData,
  type TenantManagementData,
} from "@/app/actions/admin";
import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Detalhes do Tenant",
  description: "Gerencie um tenant específico da Magic Lawyer",
};

export default async function TenantManagementPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const response = await getTenantManagementData(tenantId);

  if (!response.success || !response.data) {
    notFound();
  }

  const initialData = response.data as TenantManagementData;

  return (
    <ProfileDashboard>
      <TenantManagementContent initialData={initialData} tenantId={tenantId} />
    </ProfileDashboard>
  );
}
