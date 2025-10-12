const DEFAULT_REGIMES = [
  {
    nome: "Justiça Comum",
    tipo: "JUSTICA_COMUM",
    contarDiasUteis: true,
    descricao: "Prazos processuais calculados em dias úteis conforme CPC.",
  },
  {
    nome: "Juizado Especial",
    tipo: "JUIZADO_ESPECIAL",
    contarDiasUteis: false,
    descricao:
      "Prazo em juizados especiais, contagem contínua exceto finais de semana conforme rito local.",
  },
  {
    nome: "Trabalhista",
    tipo: "TRABALHISTA",
    contarDiasUteis: true,
    descricao: "Prazos da CLT com dias úteis e regras de suspensão específicas.",
  },
];

module.exports = async function seedRegimesPrazo(prisma) {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: "ACTIVE",
    },
    select: { id: true },
  });

  for (const tenant of tenants) {
    for (const regime of DEFAULT_REGIMES) {
      await prisma.regimePrazo.upsert({
        where: {
          tenantId_nome: {
            tenantId: tenant.id,
            nome: regime.nome,
          },
        },
        update: {
          tipo: regime.tipo,
          contarDiasUteis: regime.contarDiasUteis,
          descricao: regime.descricao,
        },
        create: {
          tenantId: tenant.id,
          nome: regime.nome,
          tipo: regime.tipo,
          contarDiasUteis: regime.contarDiasUteis,
          descricao: regime.descricao,
        },
      });
    }
  }
};
