import prisma from "@/app/lib/prisma";

interface SessionLike {
  user?: {
    id?: string;
    tenantId?: string;
    role?: string;
  };
}

const NO_ACCESS_ADVOGADO_ID = "__NO_ADVOGADO_ACCESS__";
const PRIVILEGED_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

function isPrivilegedUser(session: SessionLike): boolean {
  const role = session?.user?.role;

  return typeof role === "string" && PRIVILEGED_ROLES.has(role);
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
  if (isPrivilegedUser(session)) {
    return [];
  }

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

  const accessibleIds = Array.from(ids);

  if (accessibleIds.length > 0) {
    return accessibleIds;
  }

  // Escopo estrito: colaborador sem vínculo não acessa carteira de advogados.
  // Retornamos um sentinela para que os filtros `in: [...]` dos módulos
  // resultem em lista vazia, em vez de expandir para acesso total.
  return [NO_ACCESS_ADVOGADO_ID];
}
