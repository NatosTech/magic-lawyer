const bcrypt = require("bcryptjs");

async function ensurePermission(prisma, tenantId, usuarioId, permissao) {
  return prisma.usuarioPermissao.upsert({
    where: {
      tenantId_usuarioId_permissao: {
        tenantId,
        usuarioId,
        permissao,
      },
    },
    update: {},
    create: {
      tenantId,
      usuarioId,
      permissao,
    },
  });
}

async function seedTenantFred(prisma) {
  console.log("🌱 Criando tenant Frederico Leitão Advocacia...");

  const [adminPasswordHash, advogadoPasswordHash, clientePasswordHash, secretariaPasswordHash] = await Promise.all([
    bcrypt.hash("Fred@123", 10),
    bcrypt.hash("Advogado@123", 10),
    bcrypt.hash("Cliente@123", 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "fred" },
    update: {
      name: "Frederico Leitão Advocacia",
      razaoSocial: "Frederico Leitão Sociedade Individual de Advocacia",
      documento: "45.678.901/0001-23",
      email: "fredericopleitaoadv@gmail.com",
      telefone: "(11) 99876-5432",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
    },
    create: {
      slug: "fred",
      name: "Frederico Leitão Advocacia",
      razaoSocial: "Frederico Leitão Sociedade Individual de Advocacia",
      documento: "45.678.901/0001-23",
      email: "fredericopleitaoadv@gmail.com",
      telefone: "(11) 99876-5432",
      status: "ACTIVE",
      domain: "fred.magiclawyer.com.br",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
    },
  });

  console.log(`✅ Tenant criado/atualizado: ${tenant.name} (${tenant.slug})`);

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#0F766E",
      secondaryColor: "#CCFBF1",
      accentColor: "#FBBF24",
      logoUrl: "https://dummyimage.com/240x80/0f766e/ffffff&text=Frederico+Pleit%C3%A3o+Advocacia",
      faviconUrl: "https://dummyimage.com/32x32/0f766e/ffffff&text=FP",
      emailFromName: "Frederico Pleitão Advocacia",
      emailFromAddress: "noreply@fred.magiclawyer.com.br",
      customDomainText: "Portal Frederico Leitão",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#0F766E",
      secondaryColor: "#CCFBF1",
      accentColor: "#FBBF24",
      logoUrl: "https://dummyimage.com/240x80/0f766e/ffffff&text=Frederico+Leit%C3%A3o+Advocacia",
      faviconUrl: "https://dummyimage.com/32x32/0f766e/ffffff&text=FP",
      emailFromName: "Frederico Leitão Advocacia",
      emailFromAddress: "noreply@fred.magiclawyer.com.br",
      customDomainText: "Portal Frederico Leitão",
    },
  });

  await prisma.tenantEndereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Escritório Principal",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      apelido: "Escritório Principal",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "Rua dos Advogados",
      numero: "250",
      complemento: "Conjunto 1203",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01010-000",
      pais: "Brasil",
      telefone: "(11) 99876-5432",
    },
  });

  const usuarios = [
    {
      email: "fredericopleitaoadv@gmail.com",
      passwordHash: adminPasswordHash,
      firstName: "Frederico",
      lastName: "Leitão",
      role: "ADMIN",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "associado@fred.magiclawyer.com.br",
      passwordHash: advogadoPasswordHash,
      firstName: "Ana",
      lastName: "Ribeiro",
      role: "ADVOGADO",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "secretaria@fred.magiclawyer.com.br",
      passwordHash: secretariaPasswordHash,
      firstName: "Carla",
      lastName: "Souza",
      role: "SECRETARIA",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "cliente.demo@fred.magiclawyer.com.br",
      passwordHash: clientePasswordHash,
      firstName: "Cliente",
      lastName: "Demo",
      role: "CLIENTE",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const usuariosCriados = [];

  for (const usuarioData of usuarios) {
    const usuario = await prisma.usuario.upsert({
      where: {
        email_tenantId: {
          email: usuarioData.email,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...usuarioData,
        tenantId: tenant.id,
      },
    });

    usuariosCriados.push(usuario);
    console.log(`✅ Usuário criado/atualizado: ${usuario.firstName} ${usuario.lastName} (${usuario.role}) - ${usuario.email}`);
  }

  const admin = usuariosCriados.find((u) => u.role === "ADMIN");
  if (admin) {
    await Promise.all([
      ensurePermission(prisma, tenant.id, admin.id, "CONFIGURACOES_ESCRITORIO"),
      ensurePermission(prisma, tenant.id, admin.id, "EQUIPE_GERENCIAR"),
      ensurePermission(prisma, tenant.id, admin.id, "FINANCEIRO_GERENCIAR"),
    ]);
    console.log("✅ Permissões atribuídas ao ADMIN do Fred");
  }

  const advogado = usuariosCriados.find((u) => u.email === "associado@fred.magiclawyer.com.br");
  if (advogado) {
    await prisma.advogado.upsert({
      where: { usuarioId: advogado.id },
      update: {
        tenantId: tenant.id,
        oabNumero: "123456",
        oabUf: "SP",
        especialidades: ["CRIMINAL", "CONSUMIDOR"],
      },
      create: {
        tenantId: tenant.id,
        usuarioId: advogado.id,
        oabNumero: "123456",
        oabUf: "SP",
        especialidades: ["CRIMINAL", "CONSUMIDOR"],
      },
    });
    console.log("✅ Perfil de advogado criminal criado para Ana");
  }

  const cliente = usuariosCriados.find((u) => u.email === "cliente.demo@fred.magiclawyer.com.br");
  let clienteRegistro = null;
  if (cliente) {
    clienteRegistro = await prisma.cliente.upsert({
      where: {
        tenantId_documento: {
          tenantId: tenant.id,
          documento: "123.456.789-00",
        },
      },
      update: {
        nome: "Cliente Demo",
        email: cliente.email,
        telefone: "(11) 91111-2222",
      },
      create: {
        tenantId: tenant.id,
        usuarioId: cliente.id,
        nome: "Cliente Demo",
        documento: "123.456.789-00",
        email: cliente.email,
        telefone: "(11) 91111-2222",
        tipoPessoa: "FISICA",
      },
    });
    console.log("✅ Cliente de demonstração criado");
  }

  const advogadoModel = await prisma.advogado.findFirst({
    where: { tenantId: tenant.id },
  });

  if (advogadoModel && clienteRegistro) {
    await prisma.processo.upsert({
      where: {
        tenantId_numero: {
          tenantId: tenant.id,
          numero: "0001234-56.2024.8.26.0100",
        },
      },
      update: {
        descricao: "Ação de Cobrança - Cliente Demo x Empresa XPTO",
      },
      create: {
        tenantId: tenant.id,
        numero: "0001234-56.2024.8.26.0100",
        titulo: "Ação de Cobrança",
        descricao: "Ação de Cobrança - Cliente Demo x Empresa XPTO",
        status: "EM_ANDAMENTO",
        clienteId: clienteRegistro.id,
        advogadoResponsavelId: advogadoModel.id,
      },
    });

    await prisma.tarefa.createMany({
      data: [
        {
          tenantId: tenant.id,
          titulo: "Revisar petição inicial",
          descricao: "Conferir fatos, fundamentos jurídicos e pedidos.",
          status: "PENDENTE",
          prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          responsavelId: advogadoModel.id,
        },
        {
          tenantId: tenant.id,
          titulo: "Preparar documentos complementares",
          descricao: "Organizar contratos e comprovantes para anexar.",
          status: "EM_ANDAMENTO",
          prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          responsavelId: advogadoModel.id,
        },
      ],
      skipDuplicates: true,
    });

    console.log("✅ Processo e tarefas de demonstração criados para o Fred");

    // Procuração vigente em favor do escritório
    const procuracaoVigente = await prisma.procuracao.upsert({
      where: {
        tenantId_numero: {
          tenantId: tenant.id,
          numero: "PROC-FRED-CRIMINAL-2025",
        },
      },
      update: {
        clienteId: clienteRegistro.id,
        observacoes: "Procuração vigente em favor do escritório Frederico Pleitão para atuar em ações penais do Cliente Demo.",
        emitidaEm: new Date("2025-01-10T10:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-01-10T10:00:00-03:00"),
        validaAte: new Date("2027-01-10T10:00:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ADVOGADO",
        ativa: true,
        createdById: admin?.id ?? null,
      },
      create: {
        tenantId: tenant.id,
        numero: "PROC-FRED-CRIMINAL-2025",
        clienteId: clienteRegistro.id,
        observacoes: "Procuração vigente em favor do escritório Frederico Pleitão para atuar em ações penais do Cliente Demo.",
        emitidaEm: new Date("2025-01-10T10:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-01-10T10:00:00-03:00"),
        validaAte: new Date("2027-01-10T10:00:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ADVOGADO",
        ativa: true,
        createdById: admin?.id ?? null,
      },
    });

    await prisma.procuracaoProcesso.upsert({
      where: {
        procuracaoId_processoId: {
          procuracaoId: procuracaoVigente.id,
          processoId: advogadoModel ? (await prisma.processo.findFirst({ where: { tenantId: tenant.id, numero: "0001234-56.2024.8.26.0100" } }))?.id : null,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoVigente.id,
        processoId: (await prisma.processo.findFirst({ where: { tenantId: tenant.id, numero: "0001234-56.2024.8.26.0100" } }))?.id,
      },
    });

    const advogadoModelAtual = await prisma.advogado.findFirst({
      where: { tenantId: tenant.id },
    });

    if (advogadoModelAtual) {
      await prisma.procuracaoAdvogado.upsert({
        where: {
          procuracaoId_advogadoId: {
            procuracaoId: procuracaoVigente.id,
            advogadoId: advogadoModelAtual.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          procuracaoId: procuracaoVigente.id,
          advogadoId: advogadoModelAtual.id,
        },
      });
    }

    // Procuração anterior revogada em favor de terceiro
    const procuracaoRevogada = await prisma.procuracao.upsert({
      where: {
        tenantId_numero: {
          tenantId: tenant.id,
          numero: "PROC-TERCEIRO-CRIMINAL-2024",
        },
      },
      update: {
        clienteId: clienteRegistro.id,
        observacoes: "Procuração anterior em favor de terceiro advogado criminal, revogada quando o cliente contratou Frederico Pleitão.",
        emitidaEm: new Date("2024-06-01T09:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2024-06-01T09:00:00-03:00"),
        validaAte: new Date("2026-06-01T09:00:00-03:00"),
        status: "REVOGADA",
        emitidaPor: "ADVOGADO",
        ativa: false,
        revogadaEm: new Date("2025-01-05T15:00:00-03:00"),
        createdById: admin?.id ?? null,
      },
      create: {
        tenantId: tenant.id,
        numero: "PROC-TERCEIRO-CRIMINAL-2024",
        clienteId: clienteRegistro.id,
        observacoes: "Procuração anterior em favor de terceiro advogado criminal, revogada quando o cliente contratou Frederico Pleitão.",
        emitidaEm: new Date("2024-06-01T09:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2024-06-01T09:00:00-03:00"),
        validaAte: new Date("2026-06-01T09:00:00-03:00"),
        status: "REVOGADA",
        emitidaPor: "ADVOGADO",
        ativa: false,
        revogadaEm: new Date("2025-01-05T15:00:00-03:00"),
        createdById: admin?.id ?? null,
      },
    });

    // Contrato de honorários criminal para o Cliente Demo
    await prisma.contrato.upsert({
      where: {
        tenantId_numeroReferencia: {
          tenantId: tenant.id,
          numeroReferencia: "CONTRATO-FRED-CRIMINAL-2025",
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        numeroReferencia: "CONTRATO-FRED-CRIMINAL-2025",
        clienteId: clienteRegistro.id,
        advogadoResponsavelId: advogadoModel.id,
        responsavelUsuarioId: admin?.id ?? null,
        criadoPorId: admin?.id ?? null,
        processoId: (await prisma.processo.findFirst({ where: { tenantId: tenant.id, numero: "0001234-56.2024.8.26.0100" } }))?.id,
        titulo: "Contrato de Honorários - Defesa Criminal Cliente Demo",
        status: "ATIVO",
        valor: new prisma.Prisma.Decimal(15000),
        moeda: "BRL",
        dataInicio: new Date("2025-01-10T00:00:00-03:00"),
        dataAssinatura: new Date("2025-01-10T00:00:00-03:00"),
        resumo: "Contrato de honorários para atuação em processo criminal de média complexidade, com acompanhamento de inquérito e ação penal.",
        observacoes: "Honorários em 6 parcelas mensais de R$ 2.500,00.",
      },
    });

    // Eventos de agenda ligados ao processo criminal
    await prisma.evento.createMany({
      data: [
        {
          id: `evento-fred-1`,
          tenantId: tenant.id,
          titulo: "Audiência de Custódia - Cliente Demo",
          descricao: "Audiência de custódia no plantão judiciário.",
          tipo: "AUDIENCIA",
          status: "CONFIRMADO",
          dataInicio: new Date("2025-02-02T09:00:00-03:00"),
          dataFim: new Date("2025-02-02T10:00:00-03:00"),
          local: "Fórum Criminal da Barra Funda",
          processoId: (await prisma.processo.findFirst({ where: { tenantId: tenant.id, numero: "0001234-56.2024.8.26.0100" } }))?.id,
          clienteId: clienteRegistro.id,
          advogadoResponsavelId: advogadoModel.id,
          lembreteMinutos: 60,
          criadoPorId: admin?.id ?? null,
        },
        {
          id: `evento-fred-2`,
          tenantId: tenant.id,
          titulo: "Reunião de Estratégia - Defesa Criminal",
          descricao: "Reunião interna com equipe para definir teses defensivas.",
          tipo: "REUNIAO",
          status: "AGENDADO",
          dataInicio: new Date("2025-01-20T15:00:00-03:00"),
          dataFim: new Date("2025-01-20T16:30:00-03:00"),
          local: "Escritório Frederico Pleitão",
          processoId: (await prisma.processo.findFirst({ where: { tenantId: tenant.id, numero: "0001234-56.2024.8.26.0100" } }))?.id,
          clienteId: clienteRegistro.id,
          advogadoResponsavelId: advogadoModel.id,
          lembreteMinutos: 30,
          criadoPorId: admin?.id ?? null,
        },
      ],
      skipDuplicates: true,
    });

    console.log("✅ Procurações, contrato e eventos criminais criados para o Fred");
  }

  console.log("🎉 Tenant Frederico Leitão configurado com sucesso!");
  console.log("\n📋 Credenciais de teste (tenant Fred):");
  console.log("👑 ADMIN: fredericopleitaoadv@gmail.com / Fred@123");
  console.log("⚖️ ADVOGADO: associado@fred.magiclawyer.com.br / Advogado@123");
  console.log("🗂️ SECRETARIA: secretaria@fred.magiclawyer.com.br / Funcionario@123");
  console.log("👤 CLIENTE: cliente.demo@fred.magiclawyer.com.br / Cliente@123");
  console.log("🏢 Slug do tenant: fred");

  return tenant;
}

module.exports = { seedTenantFred };
