import { Prisma } from "@prisma/client";

import prisma from "@/app/lib/prisma";

export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  "dashboard-geral": ["/dashboard"],
  "processos-gerais": ["/processos", "/andamentos"],
  "clientes-gerais": ["/clientes"],
  "agenda-compromissos": ["/agenda"],
  "documentos-gerais": [
    "/documentos",
    "/peticoes",
    "/peticoes/modelos",
    "/modelos-peticao",
  ],
  "modelos-documentos": [
    "/peticoes/modelos",
    "/modelos-peticao",
    "/modelos-procuracao",
    "/contratos/modelos",
  ],
  "tarefas-kanban": ["/tarefas"],
  "financeiro-completo": ["/financeiro"],
  "gestao-equipe": ["/equipe", "/advogados"],
  "relatorios-basicos": ["/relatorios"],
  "contratos-honorarios": ["/contratos"],
  "procuracoes": ["/procuracoes"],
  "comissoes-advogados": ["/financeiro/comissoes"],
  "notificacoes-avancadas": ["/help"],
  "integracoes-externas": ["/integracoes"],
  "analytics-avancado": ["/relatorios/analytics"],
};

const DEFAULT_MODULES = Object.keys(MODULE_ROUTE_MAP);

function normalizeDecimal(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "object" && value.toString) {
    const parsed = Number(value.toString());
    return Number.isNaN(parsed) ? null : parsed;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export async function getTenantAccessibleModules(
  tenantId: string,
): Promise<string[]> {
  const subscription = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
    include: {
      planoVersao: {
        include: {
          modulos: {
            include: {
              modulo: {
                select: {
                  slug: true,
                  ativo: true,
                },
              },
            },
          },
        },
      },
      plano: {
        select: {
          id: true,
          modulos: {
            where: { habilitado: true },
            include: {
              modulo: {
                select: { slug: true, ativo: true },
              },
            },
          },
        },
      },
    },
  });

  if (!subscription) {
    return DEFAULT_MODULES;
  }

  const publishedVersion =
    subscription.planoVersao ??
    (subscription.plano
      ? await prisma.planoVersao.findFirst({
          where: {
            planoId: subscription.plano.id,
            status: "PUBLISHED",
          },
          orderBy: { numero: "desc" },
          include: {
            modulos: {
              include: {
                modulo: {
                  select: { slug: true, ativo: true },
                },
              },
            },
          },
        })
      : null);

  if (publishedVersion?.modulos?.length) {
    const slugs = publishedVersion.modulos
      .filter((item) => item.modulo?.slug && item.modulo?.ativo)
      .map((item) => item.modulo!.slug);
    return slugs.length ? Array.from(new Set(slugs)) : DEFAULT_MODULES;
  }

  const fallbackSlugs =
    subscription.plano?.modulos
      .filter((item) => item.modulo?.slug && item.modulo?.ativo)
      .map((item) => item.modulo!.slug) ?? [];

  return fallbackSlugs.length ? Array.from(new Set(fallbackSlugs)) : DEFAULT_MODULES;
}

export function isRouteAllowedByModules(
  pathname: string,
  modules: string[] | undefined,
): boolean {
  if (!modules || modules.includes("*")) {
    return true;
  }

  const normalizedPath = pathname.replace(/\/$/, "");

  for (const [module, routes] of Object.entries(MODULE_ROUTE_MAP)) {
    if (!modules.includes(module)) {
      continue;
    }

    if (routes.some((route) => normalizedPath.startsWith(route))) {
      return true;
    }
  }

  return false;
}

