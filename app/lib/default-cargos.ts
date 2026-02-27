import type { Prisma, PrismaClient } from "@/generated/prisma";

export interface DefaultCargoTemplate {
  nome: string;
  descricao: string;
  nivel: number;
}

export const DEFAULT_TENANT_CARGOS: DefaultCargoTemplate[] = [
  {
    nome: "Secretária",
    descricao: "Atendimento, agenda e apoio operacional ao escritório.",
    nivel: 2,
  },
  {
    nome: "Assistente Jurídico",
    descricao: "Suporte em documentos, protocolos e acompanhamento processual.",
    nivel: 2,
  },
  {
    nome: "Financeiro",
    descricao: "Cobrança, conciliação, fluxo de caixa e rotinas financeiras.",
    nivel: 3,
  },
  {
    nome: "Suporte de TI",
    descricao: "Apoio técnico interno, acessos e infraestrutura digital.",
    nivel: 2,
  },
  {
    nome: "Coordenador Operacional",
    descricao: "Coordenação de rotinas, equipe e indicadores administrativos.",
    nivel: 4,
  },
];

type CargoDbClient = PrismaClient | Prisma.TransactionClient;

export async function ensureDefaultCargosForTenant(
  db: CargoDbClient,
  tenantId: string,
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const template of DEFAULT_TENANT_CARGOS) {
    const existing = await db.cargo.findFirst({
      where: {
        tenantId,
        nome: template.nome,
      },
      select: {
        id: true,
        ativo: true,
        descricao: true,
      },
    });

    if (!existing) {
      await db.cargo.create({
        data: {
          tenantId,
          nome: template.nome,
          descricao: template.descricao,
          nivel: template.nivel,
          ativo: true,
        },
      });
      created += 1;
      continue;
    }

    const nextData: { ativo?: boolean; descricao?: string } = {};

    if (!existing.ativo) {
      nextData.ativo = true;
    }
    if (!existing.descricao) {
      nextData.descricao = template.descricao;
    }

    if (Object.keys(nextData).length > 0) {
      await db.cargo.update({
        where: {
          id: existing.id,
        },
        data: nextData,
      });
      updated += 1;
    }
  }

  return { created, updated };
}
