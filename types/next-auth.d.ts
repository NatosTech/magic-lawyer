import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      tenantId?: string;
      role?: string;
      tenantSlug?: string;
      tenantName?: string;
      tenantLogoUrl?: string;
      tenantFaviconUrl?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    tenantId: string;
    role: string;
    tenantSlug?: string;
    tenantName?: string;
    tenantLogoUrl?: string;
    tenantFaviconUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    tenantId?: string;
    role?: string;
    tenantSlug?: string;
    tenantName?: string;
    tenantLogoUrl?: string;
    tenantFaviconUrl?: string;
  }
}
