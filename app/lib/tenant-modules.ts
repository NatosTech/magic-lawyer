import prisma from "@/app/lib/prisma";
import { DEFAULT_MODULES } from "@/app/lib/module-map";

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
  } else {
    const fallbackSlugs =
      subscription.plano?.modulos
        .filter((item) => item.modulo?.slug && item.modulo?.ativo)
        .map((item) => item.modulo!.slug) ?? [];

    return fallbackSlugs.length
      ? Array.from(new Set(fallbackSlugs))
      : DEFAULT_MODULES;
  }
}
