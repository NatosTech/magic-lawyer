"use server";

import prisma from "@/app/lib/prisma";
import { emailService } from "@/app/lib/email-service";

export async function listTenantEmailCredentials(tenantId: string) {
  const creds = await prisma.tenantEmailCredential.findMany({
    where: { tenantId },
    select: { id: true, type: true, email: true, fromName: true, createdAt: true, updatedAt: true },
    orderBy: { type: "asc" },
  });

  return { success: true, data: creds } as const;
}

export async function upsertTenantEmailCredential(params: {
  tenantId: string;
  type: "DEFAULT" | "ADMIN";
  email: string;
  appPassword: string;
  fromName?: string | null;
}) {
  const { tenantId, type, email, appPassword, fromName } = params;

  await prisma.tenantEmailCredential.upsert({
    where: { tenantId_type: { tenantId, type } },
    update: { email, appPassword, fromName: fromName ?? null },
    create: { tenantId, type, email, appPassword, fromName: fromName ?? null },
  });

  return { success: true } as const;
}

export async function deleteTenantEmailCredential(tenantId: string, type: "DEFAULT" | "ADMIN") {
  await prisma.tenantEmailCredential.delete({ where: { tenantId_type: { tenantId, type } } }).catch(() => void 0);

  return { success: true } as const;
}

export async function testTenantEmailConnection(tenantId: string, type: "DEFAULT" | "ADMIN" = "DEFAULT") {
  const ok = await emailService.testConnection(tenantId, type);

  return { success: ok } as const;
}




