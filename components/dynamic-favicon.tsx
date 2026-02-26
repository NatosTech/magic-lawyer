"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetchTenantBrandingFromDomain } from "@/lib/fetchers/tenant-branding";

const DEFAULT_FAVICON = "/favicon.svg";
const FAVICON_ID = "dynamic-favicon";

function getMimeTypeFromUrl(url: string) {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".svg")) return "image/svg+xml";
  if (url.endsWith(".ico")) return "image/x-icon";
  return null;
}

function normalizeUrlForComparison(url: string | null) {
  if (!url) {
    return "";
  }

  try {
    const absolute = new URL(url, window.location.origin);
    return absolute.href.split("?")[0];
  } catch {
    return url.split("?")[0];
  }
}

/**
 * Componente para atualizar o favicon dinamicamente baseado na sessão do tenant.
 *
 * Estratégia:
 * 1. Mantém um único <link> com ID fixo controlado pelo React
 * 2. Atualiza quando o tenant muda (sessão / domínio / rota)
 * 3. MutationObserver refaz a atualização quando Next recria o <link>
 */
export function DynamicFavicon() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Buscar branding do tenant pelo domínio (para página de login)
  const { data: tenantBrandingFromDomain } = useSWR(
    "tenant-branding-from-domain",
    fetchTenantBrandingFromDomain,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const observerRef = useRef<MutationObserver | null>(null);
  const currentFaviconUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !document.head) {
      return;
    }

    const tenantFaviconUrl =
      (session?.user as any)?.tenantFaviconUrl ||
      (tenantBrandingFromDomain?.success
        ? tenantBrandingFromDomain.data?.faviconUrl
        : null);
    const faviconUrl = tenantFaviconUrl || DEFAULT_FAVICON;

    const ensureElements = () => {
      const existingIcons = Array.from(
        document.querySelectorAll('link[rel*="icon"]'),
      ) as HTMLLinkElement[];

      if (existingIcons.length === 0) {
        const element = document.createElement("link");
        element.rel = "icon";
        element.id = FAVICON_ID;
        document.head.appendChild(element);
        return [element];
      }

      const [first, ...rest] = existingIcons;
      first.id = FAVICON_ID;
      return [first, ...rest];
    };

    const applyHrefToElements = (elements: HTMLLinkElement[], url: string) => {
      const mimeType = getMimeTypeFromUrl(url);

      elements.forEach((element) => {
        element.rel = element.rel.includes("icon") ? element.rel : "icon";

        if (mimeType) {
          element.type = mimeType;
        } else {
          element.removeAttribute("type");
        }

        element.href = url;
      });
    };

    const updateFavicon = () => {
      const elements = ensureElements();
      if (!elements.length) return;

      const normalizedTarget = normalizeUrlForComparison(faviconUrl);

      if (currentFaviconUrlRef.current === normalizedTarget) {
        const currentHref = normalizeUrlForComparison(elements[0]?.href ?? "");
        if (currentHref === normalizedTarget) {
          return;
        }
      }

      const timestamp = Date.now();
      const cacheBustedUrl =
        faviconUrl + (faviconUrl.includes("?") ? "&" : "?") + `t=${timestamp}`;

      applyHrefToElements(elements, cacheBustedUrl);

      requestAnimationFrame(() => {
        applyHrefToElements(elements, faviconUrl);
      });

      currentFaviconUrlRef.current = normalizedTarget;
    };

    const scheduleRefresh = () => {
      updateFavicon();
      setTimeout(updateFavicon, 50);
      setTimeout(updateFavicon, 200);
    };

    scheduleRefresh();

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      const iconMutation = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node instanceof HTMLLinkElement &&
            node.rel?.toLowerCase().includes("icon"),
        ),
      );

      if (iconMutation) {
        scheduleRefresh();
      }
    });

    observer.observe(document.head, { childList: true });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [
    session?.user?.tenantFaviconUrl,
    tenantBrandingFromDomain?.success,
    tenantBrandingFromDomain?.data?.faviconUrl,
    pathname,
  ]);

  return null;
}
