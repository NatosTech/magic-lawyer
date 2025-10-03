/* eslint-disable no-console */

import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import prisma from "./app/lib/prisma";

// Campos extras que vamos guardar no token
// - id, tenantId, role, name, email

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // NextAuth v4 usa NEXTAUTH_URL/NEXTAUTH_SECRET do ambiente
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        tenant: { label: "Escritório", type: "text" }, // pode ser slug ou domínio
      },
      authorize: async (credentials) => {
        const normalizedEmail = credentials?.email?.trim();
        const normalizedTenant = credentials?.tenant?.trim().toLowerCase();

        const attemptContext = {
          email: normalizedEmail ?? "(missing)",
          tenant: normalizedTenant ?? "(auto)",
        };

        if (!credentials?.email || !credentials?.password) {
          console.warn("[auth] Credenciais incompletas para login", attemptContext);

          return null;
        }

        console.info("[auth] Tentativa de login recebida", attemptContext);

        try {
          let tenantWhere: any = undefined;

          if (normalizedTenant && normalizedTenant.length > 0) {
            tenantWhere = {
              OR: [{ slug: normalizedTenant }, { domain: normalizedTenant }],
            };
          }

          const email = normalizedEmail ?? credentials.email;

          const user = await prisma.usuario.findFirst({
            where: {
              email,
              ...(tenantWhere
                ? {
                    tenant: tenantWhere,
                  }
                : {}),
              active: true,
            },
            include: {
              tenant: {
                include: {
                  branding: true,
                },
              },
              permissoes: {
                select: {
                  permissao: true,
                },
              },
            } as any,
          });

          if (!user || !user.passwordHash) {
            console.warn("[auth] Usuário não encontrado ou sem senha cadastrada", attemptContext);

            return null;
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!valid) {
            console.warn("[auth] Senha inválida para o usuário", attemptContext);

            return null;
          }

          const tenantData = (user as any)?.tenant as
            | (typeof user & {
                branding?: { logoUrl?: string | null; faviconUrl?: string | null } | null;
                status?: string;
                slug?: string | null;
                nomeFantasia?: string | null;
                razaoSocial?: string | null;
                name?: string | null;
              })
            | undefined;
          const permissionsRaw = ((user as any)?.permissoes ?? []) as Array<{
            permissao: string;
          }>;

          if (tenantData?.status !== "ACTIVE") {
            console.warn("[auth] Tenant com acesso bloqueado", {
              ...attemptContext,
              tenantStatus: tenantData?.status,
            });

            return null;
          }

          const tenantName = tenantData?.nomeFantasia ?? tenantData?.razaoSocial ?? tenantData?.name ?? tenantData?.slug ?? undefined;

          const permissions = permissionsRaw.map((permission) => permission.permissao);

          const resultUser = {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
            image: user.avatarUrl || undefined,
            tenantId: user.tenantId,
            role: user.role,
            tenantSlug: tenantData?.slug || undefined,
            tenantName,
            tenantLogoUrl: tenantData?.branding?.logoUrl || undefined,
            tenantFaviconUrl: tenantData?.branding?.faviconUrl || undefined,
            permissions,
          } as unknown as User & {
            tenantId: string;
            role: string;
            permissions: string[];
          };

          console.info("[auth] Login autorizado", {
            ...attemptContext,
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
          });

          return resultUser as any;
        } catch (error) {
          const safeError = error instanceof Error ? { message: error.message, stack: error.stack } : error;

          console.error("[auth] Erro inesperado durante autenticação", {
            ...attemptContext,
            error: safeError,
          });

          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?:
        | (User & {
            tenantId?: string;
            role?: string;
            tenantSlug?: string;
            tenantName?: string;
            tenantLogoUrl?: string;
            tenantFaviconUrl?: string;
          })
        | null;
    }): Promise<JWT> {
      // No login
      if (user) {
        (token as any).id = user.id;
        (token as any).tenantId = (user as any).tenantId;
        (token as any).role = (user as any).role;
        (token as any).tenantSlug = (user as any).tenantSlug;
        (token as any).tenantName = (user as any).tenantName;
        (token as any).tenantLogoUrl = (user as any).tenantLogoUrl;
        (token as any).tenantFaviconUrl = (user as any).tenantFaviconUrl;
        (token as any).permissions = (user as any).permissions ?? [];
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        (session.user as any).id = (token as any).id as string | undefined;
        (session.user as any).tenantId = (token as any).tenantId as string | undefined;
        (session.user as any).role = (token as any).role as string | undefined;
        (session.user as any).tenantSlug = (token as any).tenantSlug as string | undefined;
        (session.user as any).tenantName = (token as any).tenantName as string | undefined;
        (session.user as any).tenantLogoUrl = (token as any).tenantLogoUrl as string | undefined;
        (session.user as any).tenantFaviconUrl = (token as any).tenantFaviconUrl as string | undefined;
        (session.user as any).permissions = (token as any).permissions as string[] | undefined;
      }

      return session;
    },
  },
};
