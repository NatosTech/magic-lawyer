"use server";

import { headers } from "next/headers";
import { getTenantBySlugWithBranding, getTenantByDomainWithBranding } from "@/app/lib/tenant";

/**
 * Extrai o tenant do domínio (mesma lógica do middleware)
 */
function extractTenantFromDomain(host: string): string | null {
  const cleanHost = host.split(":")[0];

  // Para desenvolvimento local: subdomain.localhost
  if (cleanHost.endsWith(".localhost")) {
    const subdomain = cleanHost.replace(".localhost", "");
    if (subdomain) {
      return subdomain;
    }
  }

  // Para domínios Vercel: subdomain.magiclawyer.vercel.app
  if (cleanHost.endsWith(".magiclawyer.vercel.app")) {
    const subdomain = cleanHost.replace(".magiclawyer.vercel.app", "");
    if (subdomain && subdomain !== "magiclawyer") {
      return subdomain;
    }
  }

  // Para domínios customizados: subdomain.magiclawyer.com.br
  if (cleanHost.endsWith(".magiclawyer.com.br")) {
    const subdomain = cleanHost.replace(".magiclawyer.com.br", "");
    if (subdomain) {
      return subdomain;
    }
  }

  // Para domínios diretos: sandra.com.br
  if (
    !cleanHost.includes("magiclawyer") &&
    !cleanHost.includes("vercel.app") &&
    !cleanHost.includes("localhost")
  ) {
    return cleanHost;
  }

  return null;
}

/**
 * Busca o branding do tenant baseado no domínio da requisição
 */
export async function getTenantBrandingFromDomain() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    // Tentar buscar por subdomínio/slug primeiro
    const tenantSlug = extractTenantFromDomain(host);
    
    if (tenantSlug) {
      // Tentar buscar por slug
      const tenantBySlug = await getTenantBySlugWithBranding(tenantSlug.toLowerCase());
      if (tenantBySlug) {
        return {
          success: true,
          data: {
            name: tenantBySlug.name,
            logoUrl: tenantBySlug.branding?.logoUrl || null,
            faviconUrl: tenantBySlug.branding?.faviconUrl || null,
            primaryColor: tenantBySlug.branding?.primaryColor || null,
          },
        };
      }

      // Tentar buscar por domínio completo
      const tenantByDomain = await getTenantByDomainWithBranding(host);
      if (tenantByDomain) {
        return {
          success: true,
          data: {
            name: tenantByDomain.name,
            logoUrl: tenantByDomain.branding?.logoUrl || null,
            faviconUrl: tenantByDomain.branding?.faviconUrl || null,
            primaryColor: tenantByDomain.branding?.primaryColor || null,
          },
        };
      }
    }

    return {
      success: false,
      data: null,
    };
  } catch (error) {
    console.error("Erro ao buscar branding do tenant:", error);
    return {
      success: false,
      data: null,
    };
  }
}
