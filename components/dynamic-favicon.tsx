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
 * 2. Apenas atualiza href/type quando o tenant mudar
 * 3. MutationObserver recria o elemento se o Next remover durante navegação
 * 4. Nenhuma remoção direta de favicons criados pelo Next (evita conflitos)
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

  const faviconRef = useRef<HTMLLinkElement | null>(null);
  const currentFaviconUrlRef = useRef<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        faviconRef.current = element;
        return [element];
      }

      // Garantir que o primeiro tenha nosso ID (para observer & depuração)
      const [first, ...rest] = existingIcons;
      first.id = FAVICON_ID;
      faviconRef.current = first;

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
        faviconUrl +
        (faviconUrl.includes("?") ? "&" : "?") +
        `t=${timestamp}`;

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

    observerRef.current = new MutationObserver((mutations) => {
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

    observerRef.current.observe(document.head, { childList: true });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      scheduleRefresh();
    }, 5000);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session, tenantBrandingFromDomain, pathname]);

  return null;
}
