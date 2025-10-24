import prisma from "@/app/lib/prisma";
import { DEFAULT_MODULES } from "@/app/lib/module-map";

export async function getTenantAccessibleModules(tenantId: string): Promise<string[]> {
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
          nome: true,
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

  console.log("[tenant-modules] Buscando módulos para tenant:", {
    tenantId,
    hasSubscription: !!subscription,
    planName: subscription?.plano?.nome,
    hasPlanoVersao: !!subscription?.planoVersao,
    planModules: subscription?.plano?.modulos?.length || 0,
    versionModules: subscription?.planoVersao?.modulos?.length || 0,
  });

  if (!subscription) {
    console.log("[tenant-modules] Sem assinatura, retornando módulos padrão");
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
    const slugs = publishedVersion.modulos.filter((item) => item.modulo?.slug && item.modulo?.ativo).map((item) => item.modulo!.slug);

    const result = slugs.length ? Array.from(new Set(slugs)) : DEFAULT_MODULES;
    console.log("[tenant-modules] Retornando módulos da versão publicada:", {
      tenantId,
      planName: subscription.plano?.nome,
      versionNumber: publishedVersion.numero,
      modules: result,
    });
    return result;
  } else {
    const fallbackSlugs = subscription.plano?.modulos.filter((item) => item.modulo?.slug && item.modulo?.ativo).map((item) => item.modulo!.slug) ?? [];

    const result = fallbackSlugs.length ? Array.from(new Set(fallbackSlugs)) : DEFAULT_MODULES;
    console.log("[tenant-modules] Retornando módulos do plano (fallback):", {
      tenantId,
      planName: subscription.plano?.nome,
      modules: result,
    });
    return result;
  }
}
