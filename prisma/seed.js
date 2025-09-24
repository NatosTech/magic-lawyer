const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function seedAreasProcesso() {
  const areas = [
    {
      slug: 'civel',
      nome: 'Direito Civel',
      descricao: 'Demandas relacionadas a contratos, responsabilidade civil e direitos obrigacionais.'
    },
    {
      slug: 'trabalhista',
      nome: 'Direito Trabalhista',
      descricao: 'Causas envolvendo relacoes de trabalho, empregadores e empregados.'
    },
    {
      slug: 'criminal',
      nome: 'Direito Penal',
      descricao: 'Acoes penais, defesa criminal e procedimentos investigativos.'
    },
    {
      slug: 'empresarial',
      nome: 'Direito Empresarial',
      descricao: 'Questoes societarias, contratos empresariais e governanca corporativa.'
    },
    {
      slug: 'familia',
      nome: 'Direito de Familia e Sucessoes',
      descricao: 'Divorcios, guarda, inventarios e planejamento sucessorio.'
    },
    {
      slug: 'tributario',
      nome: 'Direito Tributario',
      descricao: 'Contencioso fiscal, planejamento tributario e revisoes fiscais.'
    },
    {
      slug: 'previdenciario',
      nome: 'Direito Previdenciario',
      descricao: 'Beneficios do INSS, aposentadorias e revisoes previdenciarias.'
    },
    {
      slug: 'arbitragem',
      nome: 'Arbitragem e Mediacao',
      descricao: 'Procedimentos extrajudiciais de solucao de conflitos.'
    }
  ];

  for (const [index, area] of areas.entries()) {
    await prisma.areaProcesso.upsert({
      where: { slug: area.slug },
      update: {
        nome: area.nome,
        descricao: area.descricao,
        ordem: index + 1,
        ativo: true,
        updatedAt: new Date()
      },
      create: {
        ...area,
        ordem: index + 1,
        ativo: true
      }
    });
  }
}

async function seedTiposContrato() {
  const tipos = [
    {
      slug: 'honorarios-fixo',
      nome: 'Honorarios Fixos',
      descricao: 'Contratos com valor fixo para acompanhamento do caso inteiro.'
    },
    {
      slug: 'honorarios-sucesso',
      nome: 'Honorarios de Exito',
      descricao: 'Cobranca vinculada ao resultado obtido no processo.'
    },
    {
      slug: 'mensalidade',
      nome: 'Mensalidade / Retainer',
      descricao: 'Pagamento recorrente para suporte juridico continuo.'
    },
    {
      slug: 'consultoria',
      nome: 'Consultoria Pontual',
      descricao: 'Atendimento especifico por evento ou parecer tecnico.'
    },
    {
      slug: 'customizado',
      nome: 'Modelo Customizado',
      descricao: 'Configuracao personalizada para acordos especiais.'
    }
  ];

  for (const [index, tipo] of tipos.entries()) {
    await prisma.tipoContrato.upsert({
      where: { slug: tipo.slug },
      update: {
        nome: tipo.nome,
        descricao: tipo.descricao,
        ordem: index + 1,
        ativo: true,
        updatedAt: new Date()
      },
      create: {
        ...tipo,
        ordem: index + 1,
        ativo: true
      }
    });
  }
}

async function seedCategoriasTarefa() {
  const categorias = [
    {
      slug: 'prazo',
      nome: 'Prazos Processuais',
      descricao: 'Atividades com prazo judicial ou administrativo definido.',
      corHex: '#DB2777'
    },
    {
      slug: 'audiencia',
      nome: 'Audiencias e Sessoes',
      descricao: 'Compromissos presenciais ou virtuais com magistrados ou partes.',
      corHex: '#2563EB'
    },
    {
      slug: 'documento',
      nome: 'Documentos e Peticoes',
      descricao: 'Elaboracao, revisao ou protocolo de documentos relevantes.',
      corHex: '#059669'
    },
    {
      slug: 'interno',
      nome: 'Demandas Internas',
      descricao: 'Atividades administrativas ou operacionais do escritorio.',
      corHex: '#7C3AED'
    },
    {
      slug: 'follow-up',
      nome: 'Follow-up com Clientes',
      descricao: 'Acompanhamento ativo e comunicacao com clientes.',
      corHex: '#F59E0B'
    }
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
        updatedAt: new Date()
      },
      create: {
        ...categoria,
        ordem: index + 1,
        ativo: true
      }
    });
  }
}

async function seedPlanos() {
  const planos = [
    {
      slug: 'starter',
      nome: 'Starter',
      descricao: 'Ate 5 usuarios, ideal para bancas enxutas iniciando no SaaS.',
      valorMensal: 149.9,
      valorAnual: 149.9 * 10,
      limiteUsuarios: 5,
      limiteProcessos: 100,
      limiteStorageMb: 512,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: false,
        integracoes: ['e-mail']
      }
    },
    {
      slug: 'professional',
      nome: 'Professional',
      descricao: 'Para escritorios em crescimento que precisam de automacoes.',
      valorMensal: 299.9,
      valorAnual: 299.9 * 10,
      limiteUsuarios: 15,
      limiteProcessos: 500,
      limiteStorageMb: 2048,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: true,
        integracoes: ['e-mail', 'whatsapp', 'drive']
      }
    },
    {
      slug: 'enterprise',
      nome: 'Enterprise',
      descricao: 'Plano customizado para grandes bancas com requisitos especificos.',
      valorMensal: null,
      valorAnual: null,
      limiteUsuarios: null,
      limiteProcessos: null,
      limiteStorageMb: null,
      recursos: {
        branding: true,
        portalCliente: true,
        relatorios: true,
        integracoes: ['e-mail', 'whatsapp', 'drive', 'erp'],
        suporteDedicado: true
      }
    }
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
        updatedAt: new Date()
      },
      create: {
        ...plano,
        ativo: true
      }
    });
  }
}

async function main() {
  await seedAreasProcesso();
  await seedTiposContrato();
  await seedCategoriasTarefa();
  await seedPlanos();
}

main()
  .then(async () => {
    console.log('Seed concluido com sucesso');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed falhou', error);
    await prisma.$disconnect();
    process.exit(1);
  });
