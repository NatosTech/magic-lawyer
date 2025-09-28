module.exports = async function seedCategoriasTarefa(prisma) {
  const categorias = [
    {
      slug: "prazo",
      nome: "Prazos Processuais",
      descricao: "Atividades com prazo judicial ou administrativo definido.",
      corHex: "#DB2777",
    },
    {
      slug: "audiencia",
      nome: "Audiencias e Sessoes",
      descricao: "Compromissos presenciais ou virtuais com magistrados ou partes.",
      corHex: "#2563EB",
    },
    {
      slug: "documento",
      nome: "Documentos e Peticoes",
      descricao: "Elaboracao, revisao ou protocolo de documentos relevantes.",
      corHex: "#059669",
    },
    {
      slug: "interno",
      nome: "Demandas Internas",
      descricao: "Atividades administrativas ou operacionais do escritorio.",
      corHex: "#7C3AED",
    },
    {
      slug: "follow-up",
      nome: "Follow-up com Clientes",
      descricao: "Acompanhamento ativo e comunicacao com clientes.",
      corHex: "#F59E0B",
    },
  ];

  for (const [index, categoria] of categorias.entries()) {
    await prisma.categoriaTarefa.upsert({
      where: { slug: categoria.slug },
      update: {
        nome: categoria.nome,
        descricao: categoria.descricao,
        corHex: categoria.corHex,
        ordem: index + 1,
        ativo: true,
        updatedAt: new Date(),
      },
      create: {
        ...categoria,
        ordem: index + 1,
        ativo: true,
      },
    });
  }
};
