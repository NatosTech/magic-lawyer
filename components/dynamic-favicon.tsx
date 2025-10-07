"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function DynamicFavicon() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Busca o favicon do tenant da sessão
    const tenantFaviconUrl = (session.user as any)?.tenantFaviconUrl;

    if (tenantFaviconUrl) {
      // Remove favicon existente
      const existingFavicon = document.querySelector('link[rel="icon"]');

      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Adiciona novo favicon
      const favicon = document.createElement("link");

      favicon.rel = "icon";
      favicon.href = tenantFaviconUrl;
      favicon.type = "image/x-icon";
      document.head.appendChild(favicon);
    }
  }, [session]);

  return null;
}
