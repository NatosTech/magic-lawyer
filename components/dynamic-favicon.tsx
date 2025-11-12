"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const DEFAULT_FAVICON = "/favicon.svg"; // Usa SVG do Logo ao invés do .ico

export function DynamicFavicon() {
  const { data: session } = useSession();

  useEffect(() => {
    // Busca o favicon do tenant da sessão ou usa o padrão (Logo SVG)
    const tenantFaviconUrl = (session?.user as any)?.tenantFaviconUrl;
    const faviconUrl = tenantFaviconUrl || DEFAULT_FAVICON;

    // Remove todos os favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingFavicons.forEach((favicon) => {
      favicon.remove();
    });

    // Adiciona novo favicon
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = faviconUrl;
    
    // Determina o tipo baseado na URL
    if (faviconUrl.endsWith(".png")) {
      favicon.type = "image/png";
    } else if (faviconUrl.endsWith(".svg")) {
      favicon.type = "image/svg+xml";
    } else {
      favicon.type = "image/x-icon";
    }
    
    document.head.appendChild(favicon);
  }, [session]);

  return null;
}
