import prisma from "./prisma";

export type AdvogadoHabilitado = {
  id: string;
  usuarioId: string;
  oabNumero: string | null;
  oabUf: string | null;
  nome: string | null;
  email: string | null;
};

/**
 * Retorna os advogados habilitados em um processo via Procurações ativas e não revogadas.
 * - Considera apenas procurações: ativa = true, (revogadaEm IS NULL) e (validaAte IS NULL OR validaAte >= now())
 * - Scopa por tenantId sempre.
 */
export async function getAdvogadosHabilitadosDoProcesso(processoId: string, tenantId: string): Promise<AdvogadoHabilitado[]> {
  const agora = new Date();

  // Busca procurações válidas vinculadas ao processo
  const prismaAny = prisma as any;
  const vinculacoes = await prismaAny.procuracaoProcesso.findMany({
    where: {
      tenantId,
      processoId,
      procuracao: {
        tenantId,
        ativa: true,
        revogadaEm: null,
        OR: [{ validaAte: null }, { validaAte: { gte: agora } }],
      },
    },
    select: {
      procuracao: {
        select: {
          id: true,
          outorgados: {
            select: {
              advogado: {
                select: {
                  id: true,
                  usuarioId: true,
                  oabNumero: true,
                  oabUf: true,
                  usuario: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const lista: AdvogadoHabilitado[] = [];
  for (const v of vinculacoes) {
    for (const oa of v.procuracao.outorgados) {
      const a = oa.advogado;
      lista.push({
        id: a.id,
        usuarioId: a.usuarioId,
        oabNumero: a.oabNumero ?? null,
        oabUf: a.oabUf ?? null,
        nome: a.usuario?.firstName || a.usuario?.lastName ? `${a.usuario?.firstName ?? ""} ${a.usuario?.lastName ?? ""}`.trim() : null,
        email: a.usuario?.email ?? null,
      });
    }
  }

  // Dedup por advogado.id
  const seen = new Set<string>();
  const dedup = lista.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
  return dedup;
}

/**
 * Verifica se um advogado específico está habilitado em um processo via procuração válida.
 */
export async function advogadoTemHabilitacaoNoProcesso(processoId: string, advogadoId: string, tenantId: string): Promise<boolean> {
  const agora = new Date();
  const prismaAny = prisma as any;
  const count = await prismaAny.procuracaoProcesso.count({
    where: {
      tenantId,
      processoId,
      procuracao: {
        tenantId,
        ativa: true,
        revogadaEm: null,
        OR: [{ validaAte: null }, { validaAte: { gte: agora } }],
        outorgados: {
          some: {
            tenantId,
            advogadoId,
          },
        },
      },
    },
  });
  return count > 0;
}
