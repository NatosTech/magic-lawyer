import prisma from "./prisma";

export type TenantWithBranding = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  branding?: {
    id: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    loginBackgroundUrl?: string | null;
    emailFromName?: string | null;
    emailFromAddress?: string | null;
    customDomainText?: string | null;
  } | null;
};

/**
 * Busca dados do tenant com branding por ID
 */
export async function getTenantWithBranding(tenantId: string): Promise<TenantWithBranding | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      branding: {
        select: {
          id: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          logoUrl: true,
          faviconUrl: true,
          loginBackgroundUrl: true,
          emailFromName: true,
          emailFromAddress: true,
          customDomainText: true,
        },
      },
    },
  });

  return tenant;
}

/**
 * Busca dados do tenant com branding por slug
 */
export async function getTenantBySlugWithBranding(slug: string): Promise<TenantWithBranding | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      branding: {
        select: {
          id: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          logoUrl: true,
          faviconUrl: true,
          loginBackgroundUrl: true,
          emailFromName: true,
          emailFromAddress: true,
          customDomainText: true,
        },
      },
    },
  });

  return tenant;
}

/**
 * Busca dados do tenant com branding por domain
 */
export async function getTenantByDomainWithBranding(domain: string): Promise<TenantWithBranding | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { domain },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      branding: {
        select: {
          id: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          logoUrl: true,
          faviconUrl: true,
          loginBackgroundUrl: true,
          emailFromName: true,
          emailFromAddress: true,
          customDomainText: true,
        },
      },
    },
  });

  return tenant;
}
