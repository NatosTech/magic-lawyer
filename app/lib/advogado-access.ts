import prisma from "@/app/lib/prisma";

interface SessionLike {
  user?: {
    id?: string;
    tenantId?: string;
  };
}

export async function getAdvogadoIdFromSession(
  session: SessionLike,
): Promise<string | null> {
  if (!session?.user?.id || !session.user.tenantId) {
    return null;
  }

  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: { id: true },
  });

  return advogado?.id ?? null;
}

export async function getLinkedAdvogadoIds(
  session: SessionLike,
): Promise<string[]> {
  if (!session?.user?.id || !session.user.tenantId) {
    return [];
  }

  const vinculos = await prisma.usuarioVinculacao.findMany({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      ativo: true,
    },
    select: {
      advogadoId: true,
    },
  });

  return vinculos.map((v) => v.advogadoId);
}

export async function getAccessibleAdvogadoIds(
  session: SessionLike,
): Promise<string[]> {
  const ids = new Set<string>();

  const self = await getAdvogadoIdFromSession(session);

  if (self) {
    ids.add(self);
  }

  const linked = await getLinkedAdvogadoIds(session);

  for (const advogadoId of linked) {
    if (advogadoId) {
      ids.add(advogadoId);
    }
  }

  return Array.from(ids);
}
