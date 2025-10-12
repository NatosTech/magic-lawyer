import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTenantManagementData, type TenantManagementData } from "@/app/actions/admin";
import { ProfileDashboard } from "@/components/profile-dashboard";

import { TenantManagementContent } from "./tenant-management-content";

interface TenantManagementPageProps {
  params: { tenantId: string };
}

export const metadata: Metadata = {
  title: "Detalhes do Tenant",
  description: "Gerencie um tenant específico da Magic Lawyer",
};

export default async function TenantManagementPage({
  params,
}: TenantManagementPageProps) {
  const response = await getTenantManagementData(params.tenantId);

  if (!response.success || !response.data) {
    notFound();
  }

  const initialData = response.data as TenantManagementData;

  return (
    <ProfileDashboard>
      <TenantManagementContent
        tenantId={params.tenantId}
        initialData={initialData}
      />
    </ProfileDashboard>
  );
}

