"use server";

import { headers } from "next/headers";
import { getTenantBrandingByHost } from "@/lib/tenant-branding";

/**
 * Busca o branding do tenant baseado no domínio da requisição
 */
export async function getTenantBrandingFromDomain() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    const branding = await getTenantBrandingByHost(host);

    if (!branding) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: branding,
    };
  } catch (error) {
    console.error("Erro ao buscar branding do tenant:", error);
    return {
      success: false,
      data: null,
    };
  }
}
