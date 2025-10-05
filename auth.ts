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

        // Se o tenant está vazio, undefined ou 'undefined', tratamos como auto-detect
        const shouldAutoDetect = !normalizedTenant || normalizedTenant === "undefined" || normalizedTenant === "";

        const attemptContext = {
          email: normalizedEmail ?? "(missing)",
          tenant: shouldAutoDetect ? "(auto)" : normalizedTenant,
        };

        if (!credentials?.email || !credentials?.password) {
          console.warn("[auth] Credenciais incompletas para login", attemptContext);

          return null;
        }

        console.info("[auth] Tentativa de login recebida", attemptContext);

        try {
          const email = normalizedEmail ?? credentials.email;

          // Log para debug
          console.info("[auth] Buscando usuário", {
            email,
            tenantWhere: shouldAutoDetect ? "todos os tenants" : "específico",
            tenant: shouldAutoDetect ? "(auto-detect)" : normalizedTenant,
            shouldAutoDetect,
          });

          // PRIMEIRO: Verificar se é SuperAdmin
          console.info("[auth] Verificando se é SuperAdmin");
          const superAdmin = await prisma.superAdmin.findUnique({
            where: { email },
          });

          if (superAdmin) {
            console.info("[auth] SuperAdmin encontrado", { id: superAdmin.id, email: superAdmin.email });

            // Verificar senha do SuperAdmin
            if (!superAdmin.passwordHash) {
              console.warn("[auth] SuperAdmin sem senha cadastrada");
              return null;
            }

            const validPassword = await bcrypt.compare(credentials.password, superAdmin.passwordHash);
            if (!validPassword) {
              console.warn("[auth] Senha inválida para SuperAdmin");
              return null;
            }

            // Login do SuperAdmin autorizado
            const resultUser = {
              id: superAdmin.id,
              email: superAdmin.email,
              name: `${superAdmin.firstName} ${superAdmin.lastName}`,
              image: superAdmin.image || undefined,
              tenantId: null, // SuperAdmin não tem tenant
              role: "SUPER_ADMIN",
              tenantSlug: null,
              tenantName: "Magic Lawyer Admin",
              permissions: ["*"], // SuperAdmin tem todas as permissões
            };

            console.info("[auth] Login SuperAdmin autorizado", {
              ...attemptContext,
              userId: superAdmin.id,
              role: "SUPER_ADMIN",
            });

            return resultUser as any;
          }

          // SEGUNDO: Se não é SuperAdmin, buscar usuário normal
          let tenantWhere: any = undefined;

          if (!shouldAutoDetect) {
            tenantWhere = {
              OR: [{ slug: normalizedTenant }, { domain: normalizedTenant }],
            };
          }

          // Primeiro, vamos tentar buscar o usuário sem filtro de tenant para debug
          if (shouldAutoDetect) {
            console.info("[auth] Buscando usuário normal em todos os tenants");
            const allUsers = await prisma.usuario.findMany({
              where: {
                email,
                active: true,
              },
              include: {
                tenant: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    status: true,
                  },
                },
              },
            });
            console.info("[auth] Usuários encontrados em todos os tenants", {
              count: allUsers.length,
              users: allUsers.map((u) => ({
                id: u.id,
                email: u.email,
                tenantSlug: u.tenant?.slug,
                tenantName: u.tenant?.name,
                tenantStatus: u.tenant?.status,
              })),
            });
          }

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

          // Log do resultado da busca
          console.info("[auth] Resultado da busca", {
            userFound: !!user,
            userId: user?.id,
            tenantId: user?.tenantId,
            tenantSlug: (user as any)?.tenant?.slug,
            tenantName: (user as any)?.tenant?.name,
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
