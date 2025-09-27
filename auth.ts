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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Resolver tenant por slug ou domínio, se informado
        let tenantWhere: any = undefined;
        if (credentials.tenant && credentials.tenant.trim().length > 0) {
          const t = credentials.tenant.trim().toLowerCase();
          tenantWhere = {
            OR: [{ slug: t }, { domain: t }],
          };
        }

        // Busca usuário + tenant. Se foi passado tenant, filtra por ele; senão aceita pelo e-mail (mas exige unique por tenant + email no schema)
        const user = await prisma.usuario.findFirst({
          where: {
            email: credentials.email,
            ...(tenantWhere
              ? {
                  tenant: tenantWhere,
                }
              : {}),
            active: true,
          },
          include: {
            tenant: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Bloquear tenants suspensos/cancelados
        if (user.tenant?.status !== "ACTIVE") return null;

        const resultUser = {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
          image: user.avatarUrl || undefined,
          tenantId: user.tenantId,
          role: user.role,
        } as unknown as User & { tenantId: string; role: string };
        return resultUser as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: (User & { tenantId?: string; role?: string }) | null }): Promise<JWT> {
      // No login
      if (user) {
        (token as any).id = user.id;
        (token as any).tenantId = (user as any).tenantId;
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        (session.user as any).id = (token as any).id as string | undefined;
        (session.user as any).tenantId = (token as any).tenantId as string | undefined;
        (session.user as any).role = (token as any).role as string | undefined;
      }
      return session;
    },
  },
};
