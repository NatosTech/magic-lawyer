"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

/**
 * Atualiza o domínio de um tenant
 */
export async function updateTenantDomain(tenantId: string, domain: string | null) {
  const user = await getCurrentUser();

  // Verificar se o usuário tem permissão para editar este tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado");
  }

  // Verificar se o usuário é SuperAdmin ou tem permissão para editar este tenant
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Sem permissão para editar domínios");
  }

  // Se domain não é null, verificar se já existe
  if (domain) {
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        domain,
        id: { not: tenantId },
      },
      select: { id: true, name: true },
    });

    if (existingTenant) {
      throw new Error(`O domínio ${domain} já está sendo usado pelo tenant ${existingTenant.name}`);
    }
  }

  // Atualizar o domínio
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { domain },
  });

  revalidatePath("/admin/tenants");

  return { success: true, message: "Domínio atualizado com sucesso" };
}

/**
 * Lista todos os domínios configurados
 */
export async function getTenantDomains() {
  const user = await getCurrentUser();

  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Sem permissão para acessar esta informação");
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      domain: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  return tenants;
}

/**
 * Valida se um domínio pode ser usado
 */
export async function validateDomain(domain: string, excludeTenantId?: string) {
  if (!domain) return { valid: true, message: "" };

  // Verificar formato básico do domínio
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;

  if (!domainRegex.test(domain)) {
    return { valid: false, message: "Formato de domínio inválido" };
  }

  // Verificar se já existe
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      domain,
      ...(excludeTenantId ? { id: { not: excludeTenantId } } : {}),
    },
    select: { id: true, name: true },
  });

  if (existingTenant) {
    return {
      valid: false,
      message: `O domínio ${domain} já está sendo usado pelo tenant ${existingTenant.name}`,
    };
  }

  return { valid: true, message: "" };
}

/**
 * Detecta o tenant baseado no domínio
 */
export async function getTenantByDomain(host: string) {
  const cleanHost = host.split(":")[0];

  // Buscar por domínio exato
  const tenant = await prisma.tenant.findFirst({
    where: {
      domain: cleanHost,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      status: true,
    },
  });

  if (tenant) {
    return tenant;
  }

  // Buscar por subdomínio (ex: sandra.magiclawyer.vercel.app)
  if (cleanHost.endsWith(".magiclawyer.vercel.app")) {
    const subdomain = cleanHost.replace(".magiclawyer.vercel.app", "");
    if (subdomain && subdomain !== "magiclawyer") {
      return await prisma.tenant.findFirst({
        where: {
          slug: subdomain,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true,
        },
      });
    }
  }

  return null;
}
