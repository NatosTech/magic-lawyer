import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const DEFAULT_REDIRECT = "/dashboard";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.next();
  }

  const callbackParam = request.nextUrl.searchParams.get("callbackUrl");
  const currentOrigin = request.nextUrl.origin;

  let redirectUrl: URL | null = null;

  if (callbackParam) {
    try {
      const candidateUrl = new URL(callbackParam, currentOrigin);

      if (candidateUrl.origin === currentOrigin) {
        redirectUrl = candidateUrl;
      }
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _error
    ) {
      redirectUrl = null;
    }
  }

  if (!redirectUrl) {
    redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = DEFAULT_REDIRECT;
    redirectUrl.search = "";
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/login"],
};
