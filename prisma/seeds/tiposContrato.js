module.exports = async function seedTiposContrato(prisma) {
  const tipos = [
    {
      slug: "honorarios-fixo",
      nome: "Honorarios Fixos",
      descricao: "Contratos com valor fixo para acompanhamento do caso inteiro.",
    },
    {
      slug: "honorarios-sucesso",
      nome: "Honorarios de Exito",
      descricao: "Cobranca vinculada ao resultado obtido no processo.",
    },
    {
      slug: "mensalidade",
      nome: "Mensalidade / Retainer",
      descricao: "Pagamento recorrente para suporte juridico continuo.",
    },
    {
      slug: "consultoria",
      nome: "Consultoria Pontual",
      descricao: "Atendimento especifico por evento ou parecer tecnico.",
    },
    {
      slug: "customizado",
      nome: "Modelo Customizado",
      descricao: "Configuracao personalizada para acordos especiais.",
    },
  ];

  for (const [index, tipo] of tipos.entries()) {
    await prisma.tipoContrato.upsert({
      where: {
        tenantId_slug: {
          tenantId: "GLOBAL",
          slug: tipo.slug,
        },
      },
      update: {
        nome: tipo.nome,
        descricao: tipo.descricao,
        ordem: index + 1,
        ativo: true,
        updatedAt: new Date(),
      },
      create: {
        ...tipo,
        tenantId: "GLOBAL", // Tipos globais (disponíveis para todos os tenants)
        ordem: index + 1,
        ativo: true,
      },
    });
  }
};
