import { NextRequest, NextResponse } from "next/server";

import { getTenantBrandingByHost } from "@/lib/tenant-branding";

function resolveUrl(target: string, request: NextRequest) {
  try {
    return new URL(target).toString();
  } catch {
    return new URL(target, request.nextUrl.origin).toString();
  }
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const branding = await getTenantBrandingByHost(host);

  const faviconUrl = branding?.faviconUrl?.trim();

  const target = faviconUrl
    ? resolveUrl(faviconUrl, request)
    : new URL("/favicon.svg", request.nextUrl.origin).toString();

  return NextResponse.redirect(target);
}
