"use client";

import { useEffect, useState } from "react";

/**
 * Hook para detectar o tenant baseado no domínio atual
 * Funciona tanto no cliente quanto no servidor
 */
export function useTenantFromDomain() {
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname;
    const detectedTenant = extractTenantFromDomain(host);
    setTenant(detectedTenant);
  }, []);

  return tenant;
}

/**
 * Função para extrair tenant do domínio (mesma lógica do middleware)
 */
function extractTenantFromDomain(host: string): string | null {
  // Remove porta se existir
  const cleanHost = host.split(":")[0];

  // Para domínios Vercel: subdomain.magiclawyer.vercel.app
  if (cleanHost.endsWith(".magiclawyer.vercel.app")) {
    const subdomain = cleanHost.replace(".magiclawyer.vercel.app", "");
    // Se não é o domínio principal, retorna o subdomínio
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
  // Neste caso, o domínio completo é o identificador do tenant
  if (!cleanHost.includes("magiclawyer") && !cleanHost.includes("vercel.app")) {
    return cleanHost;
  }

  return null;
}

/**
 * Função utilitária para obter tenant do domínio no servidor
 */
export function getTenantFromDomainServer(host: string): string | null {
  return extractTenantFromDomain(host);
}
