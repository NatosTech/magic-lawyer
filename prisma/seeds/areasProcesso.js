module.exports = async function seedAreasProcesso(prisma) {
  const areas = [
    {
      slug: "civel",
      nome: "Direito Civel",
      descricao: "Demandas relacionadas a contratos, responsabilidade civil e direitos obrigacionais.",
    },
    {
      slug: "trabalhista",
      nome: "Direito Trabalhista",
      descricao: "Causas envolvendo relacoes de trabalho, empregadores e empregados.",
    },
    {
      slug: "criminal",
      nome: "Direito Penal",
      descricao: "Acoes penais, defesa criminal e procedimentos investigativos.",
    },
    {
      slug: "empresarial",
      nome: "Direito Empresarial",
      descricao: "Questoes societarias, contratos empresariais e governanca corporativa.",
    },
    {
      slug: "familia",
      nome: "Direito de Familia e Sucessoes",
      descricao: "Divorcios, guarda, inventarios e planejamento sucessorio.",
    },
    {
      slug: "tributario",
      nome: "Direito Tributario",
      descricao: "Contencioso fiscal, planejamento tributario e revisoes fiscais.",
    },
    {
      slug: "previdenciario",
      nome: "Direito Previdenciario",
      descricao: "Beneficios do INSS, aposentadorias e revisoes previdenciarias.",
    },
    {
      slug: "arbitragem",
      nome: "Arbitragem e Mediacao",
      descricao: "Procedimentos extrajudiciais de solucao de conflitos.",
    },
  ];

  for (const [index, area] of areas.entries()) {
    await prisma.areaProcesso.upsert({
      where: {
        tenantId_slug: {
          tenantId: "GLOBAL",
          slug: area.slug,
        },
      },
      update: {
        nome: area.nome,
        descricao: area.descricao,
        ordem: index + 1,
        ativo: true,
        updatedAt: new Date(),
      },
      create: {
        ...area,
        tenantId: "GLOBAL", // Áreas globais (disponíveis para todos os tenants)
        ordem: index + 1,
        ativo: true,
      },
    });
  }
};
