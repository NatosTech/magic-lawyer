import prisma from "@/app/lib/prisma";
import { getDefaultModules } from "@/app/lib/module-map";

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

  if (!subscription) {
    console.log("[tenant-modules] Sem assinatura, retornando módulos padrão");

    return await getDefaultModules();
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

    const resultSet = new Set(slugs.length ? slugs : await getDefaultModules());

    // Garantir que o Portal do Advogado esteja disponível por padrão
    resultSet.add("portal-advogado");

    return Array.from(resultSet);
  } else {
    const fallbackSlugs =
      subscription.plano?.modulos
        .filter((item) => item.modulo?.slug && item.modulo?.ativo)
        .map((item) => item.modulo!.slug) ?? [];

    const resultSet = new Set(
      fallbackSlugs.length ? fallbackSlugs : await getDefaultModules(),
    );

    resultSet.add("portal-advogado");

    console.log("[tenant-modules] Retornando módulos do plano (fallback):", {
      tenantId,
      planName: subscription.plano?.nome,
      modules: Array.from(resultSet),
    });

    return Array.from(resultSet);
  }
}
