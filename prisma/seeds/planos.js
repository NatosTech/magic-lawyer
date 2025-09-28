module.exports = async function seedPlanos(prisma) {
  const planos = [
    {
      slug: "starter",
      nome: "Starter",
      descricao: "Ate 5 usuarios, ideal para bancas enxutas iniciando no SaaS.",
      valorMensal: 149.9,
      valorAnual: 149.9 * 10,
      limiteUsuarios: 5,
      limiteProcessos: 100,
      limiteStorageMb: 512,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: false,
        integracoes: ["e-mail"],
      },
    },
    {
      slug: "professional",
      nome: "Professional",
      descricao: "Para escritorios em crescimento que precisam de automacoes.",
      valorMensal: 299.9,
      valorAnual: 299.9 * 10,
      limiteUsuarios: 15,
      limiteProcessos: 500,
      limiteStorageMb: 2048,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: true,
        integracoes: ["e-mail", "whatsapp", "drive"],
      },
    },
    {
      slug: "enterprise",
      nome: "Enterprise",
      descricao: "Plano customizado para grandes bancas com requisitos especificos.",
      valorMensal: null,
      valorAnual: null,
      limiteUsuarios: null,
      limiteProcessos: null,
      limiteStorageMb: null,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: true,
        integracoes: ["e-mail", "whatsapp", "drive", "erp"],
        suporteDedicado: true,
      },
    },
  ];

  for (const plano of planos) {
    await prisma.plano.upsert({
      where: { slug: plano.slug },
      update: {
        nome: plano.nome,
        descricao: plano.descricao,
        valorMensal: plano.valorMensal,
        valorAnual: plano.valorAnual,
        limiteUsuarios: plano.limiteUsuarios,
        limiteProcessos: plano.limiteProcessos,
        limiteStorageMb: plano.limiteStorageMb,
        recursos: plano.recursos,
        ativo: true,
        updatedAt: new Date(),
      },
      create: {
        ...plano,
        ativo: true,
      },
    });
  }
};
