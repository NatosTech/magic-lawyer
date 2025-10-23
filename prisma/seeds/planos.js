const seedModulos = require("./modulos");

const MODULOS_BASE = seedModulos.MODULOS_BASE || [];

const PLANO_CONFIG_MODULOS = {
  basico: [
    "dashboard-geral",
    "processos-gerais",
    "clientes-gerais",
    "agenda-compromissos",
    "documentos-gerais",
    "tarefas-kanban",
    "relatorios-basicos",
  ],
  pro: [
    "dashboard-geral",
    "processos-gerais",
    "clientes-gerais",
    "agenda-compromissos",
    "documentos-gerais",
    "tarefas-kanban",
    "relatorios-basicos",
    "gestao-equipe",
    "permissoes-avancadas",
    "contratos-honorarios",
    "financeiro-completo",
    "comissoes-advogados",
    "modelos-documentos",
    "integracoes-externas",
    "notificacoes-avancadas",
  ],
  enterprise: [
    "dashboard-geral",
    "processos-gerais",
    "clientes-gerais",
    "agenda-compromissos",
    "documentos-gerais",
    "tarefas-kanban",
    "relatorios-basicos",
    "gestao-equipe",
    "permissoes-avancadas",
    "contratos-honorarios",
    "financeiro-completo",
    "comissoes-advogados",
    "modelos-documentos",
    "integracoes-externas",
    "notificacoes-avancadas",
    "assinaturas-digitais",
    "automacoes-fluxos",
    "analytics-avancado",
    "ia-juridica",
    "marketplace-integracoes",
    "api-external",
    "atendimento-omnicanal",
  ],
  ultra: MODULOS_BASE.map((modulo) => modulo.slug),
};

const PLANOS_BASE = [
  {
    nome: "Básico",
    slug: "basico",
    descricao: "Plano ideal para escritórios pequenos e advogados autônomos.",
    valorMensal: 99.0,
    valorAnual: 990.0,
    limiteUsuarios: 3,
    limiteProcessos: 50,
    limiteStorageMb: 1000,
    recursos: {
      features: [
        "Gestão de clientes e processos",
        "Agenda compartilhada",
        "Documentos básicos",
        "Kanban simples de tarefas",
        "Exportação de relatórios essenciais",
      ],
      integracoes: ["Google Calendar", "ViaCEP", "IBGE", "ReceitaWS"],
      limites: {
        usuarios: 3,
        processos: 50,
        contratos: 100,
        documentos: 500,
        storageMb: 1000,
      },
    },
    periodoTeste: 14,
    ativo: true,
  },
  {
    nome: "Pro",
    slug: "pro",
    descricao: "Plano completo para escritórios em crescimento.",
    valorMensal: 299.0,
    valorAnual: 2990.0,
    limiteUsuarios: 10,
    limiteProcessos: 200,
    limiteStorageMb: 5000,
    recursos: {
      features: [
        "Tudo do plano Básico",
        "Dashboard financeiro completo",
        "Gestão de contratos e honorários",
        "Comissões automatizadas",
        "Templates inteligentes",
        "Integração com Asaas e Clicksign",
      ],
      integracoes: ["Google Calendar", "ViaCEP", "IBGE", "ReceitaWS", "Asaas", "ClickSign"],
      limites: {
        usuarios: 10,
        processos: 200,
        contratos: 500,
        documentos: 2000,
        storageMb: 5000,
      },
    },
    periodoTeste: 14,
    ativo: true,
  },
  {
    nome: "Enterprise",
    slug: "enterprise",
    descricao: "Plano premium para grandes escritórios e redes.",
    valorMensal: 499.0,
    valorAnual: 4990.0,
    limiteUsuarios: 50,
    limiteProcessos: 1000,
    limiteStorageMb: 20000,
    recursos: {
      features: [
        "Tudo do plano Pro",
        "Automações entre módulos",
        "Analytics avançado e BI",
        "IA jurídica aplicada",
        "API e Webhooks",
        "Atendimento omnicanal",
        "Integrações judiciárias (PJe, eProc, Projudi)",
      ],
      integracoes: [
        "Google Calendar",
        "ViaCEP",
        "IBGE",
        "ReceitaWS",
        "Asaas",
        "ClickSign",
        "PJe",
        "eProc",
        "Projudi",
      ],
      limites: {
        usuarios: 50,
        processos: 1000,
        contratos: 2000,
        documentos: 10000,
        storageMb: 20000,
      },
    },
    periodoTeste: 14,
    ativo: true,
  },
  {
    nome: "Ultra",
    slug: "ultra",
    descricao: "Plano definitivo com acesso ilimitado a todos os recursos Magic.",
    valorMensal: 899.0,
    valorAnual: 8990.0,
    limiteUsuarios: null,
    limiteProcessos: null,
    limiteStorageMb: null,
    recursos: {
      features: [
        "Todos os recursos dos planos anteriores",
        "Laboratório Magic com funcionalidades beta",
        "SLA dedicado e gerente de conta",
        "Blueprints personalizados de automação",
        "Capacidade ilimitada de armazenamento",
      ],
      integracoes: [
        "Todas as integrações disponíveis",
        "Webhooks customizados",
        "Integrações privadas sob demanda",
      ],
      limites: {
        usuarios: "ilimitado",
        processos: "ilimitado",
        contratos: "ilimitado",
        documentos: "ilimitado",
        storageMb: "ilimitado",
      },
    },
    periodoTeste: 30,
    ativo: true,
  },
];

async function sincronizarModulosDoPlano(prisma, plano, modulosPorSlug, slugsPermitidos) {
  await prisma.planoModulo.deleteMany({
    where: { planoId: plano.id },
  });

  for (const slug of slugsPermitidos) {
    const modulo = modulosPorSlug.get(slug);

    if (!modulo) {
      console.warn(`⚠️  Módulo "${slug}" não encontrado para o plano ${plano.nome}. Verifique o catálogo de módulos.`);
      continue;
    }

    await prisma.planoModulo.create({
      data: {
        planoId: plano.id,
        moduloId: modulo.id,
        habilitado: true,
      },
    });
  }
}

async function sincronizarVersaoPublicado(prisma, plano, modulosPorSlug, slugsPermitidos) {
  const versao = await prisma.planoVersao.upsert({
    where: {
      planoId_numero: {
        planoId: plano.id,
        numero: 1,
      },
    },
    update: {
      status: "PUBLISHED",
      titulo: `${plano.nome} - Versão 1`,
      descricao: "Versão inicial sincronizada pela seed",
      publicadoEm: new Date(),
    },
    create: {
      planoId: plano.id,
      numero: 1,
      status: "PUBLISHED",
      titulo: `${plano.nome} - Versão 1`,
      descricao: "Versão inicial publicada automaticamente pela seed",
      publicadoEm: new Date(),
    },
  });

  await prisma.planoVersaoModulo.deleteMany({
    where: { planoVersaoId: versao.id },
  });

  for (const slug of slugsPermitidos) {
    const modulo = modulosPorSlug.get(slug);

    if (!modulo) {
      continue;
    }

    await prisma.planoVersaoModulo.create({
      data: {
        planoVersaoId: versao.id,
        moduloId: modulo.id,
        habilitado: true,
      },
    });
  }
}

module.exports = async function seedPlanos(prisma) {
  console.log("🌱 Iniciando seed de planos e permissões de módulos...");

  try {
    const modulos = await prisma.modulo.findMany();
    const modulosPorSlug = new Map(modulos.map((modulo) => [modulo.slug, modulo]));

    for (const planoBase of PLANOS_BASE) {
      const plano = await prisma.plano.upsert({
        where: { slug: planoBase.slug },
        update: {
          ...planoBase,
          updatedAt: new Date(),
        },
        create: planoBase,
      });

      const slugsPermitidos = PLANO_CONFIG_MODULOS[plano.slug] || [];

      await sincronizarModulosDoPlano(prisma, plano, modulosPorSlug, slugsPermitidos);
      await sincronizarVersaoPublicado(prisma, plano, modulosPorSlug, slugsPermitidos);

      console.log(`✅ Plano "${plano.nome}" sincronizado com ${slugsPermitidos.length} módulos.`);
    }

    console.log("🎉 Seed de planos concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed de planos:", error);
    throw error;
  }
};
