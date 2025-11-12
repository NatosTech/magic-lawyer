const bcrypt = require("bcryptjs");

async function ensureUsuario(prisma, tenantId, email, data) {
  const existing = await prisma.usuario.findFirst({
    where: { tenantId, email },
  });

  if (existing) {
    return prisma.usuario.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.usuario.create({
    data: {
      tenantId,
      email,
      ...data,
    },
  });
}

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

async function seedTenantLuana(prisma, Prisma) {
  const [adminPasswordHash, clientePasswordHash, advogadoPasswordHash] = await Promise.all([bcrypt.hash("Luana@123", 10), bcrypt.hash("Cliente@123", 10), bcrypt.hash("Advogado@123", 10)]);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "luana" },
    update: {
      name: "Luana Morais Advocacia",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
      documento: "98.765.432/0001-88",
      razaoSocial: "Luana Morais e Associados Advocacia",
      nomeFantasia: "Luana Morais Advocacia",
      inscricaoMunicipal: "654321",
      inscricaoEstadual: null,
      email: "contato@luanamorais.adv.br",
      telefone: "+55 11 5000-9876",
    },
    create: {
      name: "Luana Morais Advocacia",
      slug: "luana",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      tipoPessoa: "JURIDICA",
      documento: "98.765.432/0001-88",
      razaoSocial: "Luana Morais e Associados Advocacia",
      nomeFantasia: "Luana Morais Advocacia",
      inscricaoMunicipal: "654321",
      inscricaoEstadual: null,
      email: "contato@luanamorais.adv.br",
      telefone: "+55 11 5000-9876",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#1E3A8A",
      secondaryColor: "#F0F9FF",
      accentColor: "#3B82F6",
      logoUrl: "https://dummyimage.com/240x80/1e3a8a/ffffff&text=Luana+Morais",
      faviconUrl: "https://dummyimage.com/32x32/1e3a8a/ffffff&text=LM",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#1E3A8A",
      secondaryColor: "#F0F9FF",
      accentColor: "#3B82F6",
      logoUrl: "https://dummyimage.com/240x80/1e3a8a/ffffff&text=Luana+Morais",
      faviconUrl: "https://dummyimage.com/32x32/1e3a8a/ffffff&text=LM",
    },
  });

  const enderecos = [
    {
      apelido: "Sede Brasília",
      tipo: "MATRIZ",
      principal: true,
      logradouro: "SCS Quadra 1",
      numero: "Bloco A",
      complemento: "Ed. Central, Sala 505",
      bairro: "Asa Sul",
      cidade: "Brasília",
      estado: "DF",
      cep: "70300-500",
      pais: "Brasil",
      telefone: "+55 61 3300-1234",
    },
    {
      apelido: "Filial São Paulo",
      tipo: "FILIAL",
      principal: false,
      logradouro: "Av. Brigadeiro Faria Lima",
      numero: "1234",
      complemento: "Conj. 2020",
      bairro: "Jardim Paulistano",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01451-001",
      pais: "Brasil",
      telefone: "+55 11 5000-9876",
    },
    {
      apelido: "Filial Belo Horizonte",
      tipo: "FILIAL",
      principal: false,
      logradouro: "Av. Afonso Pena",
      numero: "867",
      complemento: "Sala 1102",
      bairro: "Centro",
      cidade: "Belo Horizonte",
      estado: "MG",
      cep: "30130-002",
      pais: "Brasil",
      telefone: "+55 31 3500-7788",
    },
  ];

  for (const endereco of enderecos) {
    await prisma.tenantEndereco.upsert({
      where: {
        tenantId_apelido: {
          tenantId: tenant.id,
          apelido: endereco.apelido,
        },
      },
      update: {
        tipo: endereco.tipo,
        principal: endereco.principal,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        pais: endereco.pais,
        telefone: endereco.telefone,
      },
      create: {
        tenantId: tenant.id,
        ...endereco,
      },
    });
  }

  const adminUser = await ensureUsuario(prisma, tenant.id, "luana@adv.br", {
    firstName: "Luana",
    lastName: "Morais",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    active: true,
  });

  await Promise.all([
    ensurePermission(prisma, tenant.id, adminUser.id, "CONFIGURACOES_ESCRITORIO"),
    ensurePermission(prisma, tenant.id, adminUser.id, "EQUIPE_GERENCIAR"),
    ensurePermission(prisma, tenant.id, adminUser.id, "FINANCEIRO_GERENCIAR"),
  ]);

  const advogadoLuana = await prisma.advogado.upsert({
    where: { usuarioId: adminUser.id },
    update: {
      oabNumero: "45678",
      oabUf: "DF",
      especialidades: ["CIVIL", "CONSUMIDOR"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      oabNumero: "45678",
      oabUf: "DF",
      especialidades: ["CIVIL", "CONSUMIDOR"],
    },
  });

  const gabrielUser = await ensureUsuario(prisma, tenant.id, "gabriel@luanamorais.adv.br", {
    firstName: "Gabriel",
    lastName: "Santos",
    passwordHash: advogadoPasswordHash,
    role: "ADVOGADO",
    active: true,
  });

  const advogadoGabriel = await prisma.advogado.upsert({
    where: { usuarioId: gabrielUser.id },
    update: {
      oabNumero: "123456",
      oabUf: "SP",
      especialidades: ["EMPRESARIAL", "TRIBUTARIO"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: gabrielUser.id,
      oabNumero: "123456",
      oabUf: "SP",
      especialidades: ["EMPRESARIAL", "TRIBUTARIO"],
    },
  });

  const julianaUser = await ensureUsuario(prisma, tenant.id, "juliana@luanamorais.adv.br", {
    firstName: "Juliana",
    lastName: "Costa",
    passwordHash: advogadoPasswordHash,
    role: "ADVOGADO",
    active: true,
  });

  const advogadoJuliana = await prisma.advogado.upsert({
    where: { usuarioId: julianaUser.id },
    update: {
      oabNumero: "789123",
      oabUf: "MG",
      especialidades: ["FAMILIA", "CIVIL"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: julianaUser.id,
      oabNumero: "789123",
      oabUf: "MG",
      especialidades: ["FAMILIA", "CIVIL"],
    },
  });

  const clientePauloUser = await ensureUsuario(prisma, tenant.id, "paulo@luanamorais.adv.br", {
    firstName: "Paulo",
    lastName: "Silva",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clientePaulo = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "456.789.123-00" },
  });

  if (clientePaulo) {
    clientePaulo = await prisma.cliente.update({
      where: { id: clientePaulo.id },
      data: {
        nome: "Paulo Silva",
        email: "paulo@luanamorais.adv.br",
        telefone: "+55 61 99888-7777",
        usuarioId: clientePauloUser.id,
      },
    });
  } else {
    clientePaulo = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Paulo Silva",
        documento: "456.789.123-00",
        email: "paulo@luanamorais.adv.br",
        telefone: "+55 61 99888-7777",
        usuarioId: clientePauloUser.id,
      },
    });
  }

  const clienteMariaUser = await ensureUsuario(prisma, tenant.id, "maria@luanamorais.adv.br", {
    firstName: "Maria",
    lastName: "Fernandes",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteMaria = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "789.456.123-00" },
  });

  if (clienteMaria) {
    clienteMaria = await prisma.cliente.update({
      where: { id: clienteMaria.id },
      data: {
        nome: "Maria Fernandes",
        email: "maria@luanamorais.adv.br",
        telefone: "+55 11 98765-4321",
        usuarioId: clienteMariaUser.id,
      },
    });
  } else {
    clienteMaria = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Maria Fernandes",
        documento: "789.456.123-00",
        email: "maria@luanamorais.adv.br",
        telefone: "+55 11 98765-4321",
        usuarioId: clienteMariaUser.id,
      },
    });
  }

  const clienteTechUser = await ensureUsuario(prisma, tenant.id, "tech@luanamorais.adv.br", {
    firstName: "Roberto",
    lastName: "Andrade",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteTech = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "78.901.234/0001-55" },
  });

  if (clienteTech) {
    clienteTech = await prisma.cliente.update({
      where: { id: clienteTech.id },
      data: {
        nome: "Tech Solutions LTDA",
        email: "tech@luanamorais.adv.br",
        telefone: "+55 11 94444-3333",
        responsavelNome: "Roberto Andrade",
        responsavelEmail: "roberto@techsolutions.com.br",
        responsavelTelefone: "+55 11 94444-3333",
        usuarioId: clienteTechUser.id,
      },
    });
  } else {
    clienteTech = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "JURIDICA",
        nome: "Tech Solutions LTDA",
        documento: "78.901.234/0001-55",
        email: "tech@luanamorais.adv.br",
        telefone: "+55 11 94444-3333",
        responsavelNome: "Roberto Andrade",
        responsavelEmail: "roberto@techsolutions.com.br",
        responsavelTelefone: "+55 11 94444-3333",
        usuarioId: clienteTechUser.id,
      },
    });
  }

  const areaCivel = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "civel",
    },
  });
  const areaConsumidor = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "consumidor",
    },
  });
  const areaEmpresarial = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "empresarial",
    },
  });

  let processoPaulo = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "3040506-78.2025.8.07.0001" },
  });

  if (!processoPaulo) {
    processoPaulo = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "3040506-78.2025.8.07.0001",
        titulo: "Ação de Cobrança",
        status: "EM_ANDAMENTO",
        clienteId: clientePaulo.id,
        advogadoResponsavelId: advogadoLuana.id,
        areaId: areaCivel?.id ?? null,
        comarca: "Brasília",
        foro: "1ª Vara Cível",
        valorCausa: new Prisma.Decimal(75000),
        dataDistribuicao: new Date("2025-02-10T09:30:00-03:00"),
      },
    });
  }

  let processoMaria = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "4050607-89.2025.8.26.0100" },
  });

  if (!processoMaria) {
    processoMaria = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "4050607-89.2025.8.26.0100",
        titulo: "Ação de Defesa do Consumidor",
        status: "EM_ANDAMENTO",
        clienteId: clienteMaria.id,
        advogadoResponsavelId: advogadoGabriel.id,
        areaId: areaConsumidor?.id ?? null,
        comarca: "São Paulo",
        foro: "Juizado Especial Cível",
        valorCausa: new Prisma.Decimal(8000),
        dataDistribuicao: new Date("2025-03-15T11:00:00-03:00"),
      },
    });
  }

  let processoTech = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "5060708-90.2025.8.13.0024" },
  });

  if (!processoTech) {
    processoTech = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "5060708-90.2025.8.13.0024",
        titulo: "Recuperação Judicial",
        status: "RASCUNHO",
        clienteId: clienteTech.id,
        advogadoResponsavelId: advogadoJuliana.id,
        areaId: areaEmpresarial?.id ?? null,
        comarca: "Belo Horizonte",
        foro: "1ª Vara Empresarial",
        valorCausa: new Prisma.Decimal(500000),
        dataDistribuicao: new Date("2025-04-20T10:00:00-03:00"),
      },
    });
  }

  const documentoCpf = await prisma.documento.upsert({
    where: { id: `doc-cpf-${clientePaulo.id}` },
    update: {
      nome: "CPF - Paulo Silva.pdf",
      url: "https://dummyimage.com/600x800/cccccc/000000&text=CPF",
      contentType: "application/pdf",
      tamanhoBytes: 180000,
      clienteId: clientePaulo.id,
      origem: "CLIENTE",
      visivelParaCliente: true,
      visivelParaEquipe: true,
    },
    create: {
      id: `doc-cpf-${clientePaulo.id}`,
      tenantId: tenant.id,
      nome: "CPF - Paulo Silva.pdf",
      url: "https://dummyimage.com/600x800/cccccc/000000&text=CPF",
      contentType: "application/pdf",
      tamanhoBytes: 180000,
      clienteId: clientePaulo.id,
      origem: "CLIENTE",
      visivelParaCliente: true,
      visivelParaEquipe: true,
    },
  });

  await prisma.processoDocumento.upsert({
    where: {
      processoId_documentoId: {
        processoId: processoPaulo.id,
        documentoId: documentoCpf.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      processoId: processoPaulo.id,
      documentoId: documentoCpf.id,
      visivelParaCliente: true,
    },
  });

  let procuracaoPaulo = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-LM-2025-001" },
  });

  if (!procuracaoPaulo) {
    procuracaoPaulo = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clientePaulo.id,
        numero: "PROC-LM-2025-001",
        emitidaEm: new Date("2025-02-05T14:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-02-05T14:30:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ESCRITORIO",
        validaAte: new Date("2026-02-05T14:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoPaulo.id,
        processoId: processoPaulo.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoPaulo.id,
      processoId: processoPaulo.id,
    },
  });

  const equipePrincipal = [advogadoLuana, advogadoGabriel, advogadoJuliana];
  for (const advogadoEquipe of equipePrincipal) {
    await prisma.procuracaoAdvogado.upsert({
      where: {
        procuracaoId_advogadoId: {
          procuracaoId: procuracaoPaulo.id,
          advogadoId: advogadoEquipe.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoPaulo.id,
        advogadoId: advogadoEquipe.id,
      },
    });
  }

  let procuracaoMaria = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-LM-2025-002" },
  });

  if (!procuracaoMaria) {
    procuracaoMaria = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clienteMaria.id,
        numero: "PROC-LM-2025-002",
        emitidaEm: new Date("2025-03-10T15:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-03-10T15:20:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ADVOGADO",
        validaAte: new Date("2026-03-10T15:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoMaria.id,
        processoId: processoMaria.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoMaria.id,
      processoId: processoMaria.id,
    },
  });

  for (const advogadoEquipe of [advogadoGabriel, advogadoLuana]) {
    await prisma.procuracaoAdvogado.upsert({
      where: {
        procuracaoId_advogadoId: {
          procuracaoId: procuracaoMaria.id,
          advogadoId: advogadoEquipe.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoMaria.id,
        advogadoId: advogadoEquipe.id,
      },
    });
  }

  let procuracaoTech = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-LM-2025-003" },
  });

  if (!procuracaoTech) {
    procuracaoTech = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clienteTech.id,
        numero: "PROC-LM-2025-003",
        emitidaEm: new Date("2025-04-15T16:00:00-03:00"),
        status: "PENDENTE_ASSINATURA",
        emitidaPor: "ESCRITORIO",
        validaAte: new Date("2026-04-15T16:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoTech.id,
        processoId: processoTech.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoTech.id,
      processoId: processoTech.id,
    },
  });

  await prisma.procuracaoAdvogado.upsert({
    where: {
      procuracaoId_advogadoId: {
        procuracaoId: procuracaoTech.id,
        advogadoId: advogadoJuliana.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoTech.id,
      advogadoId: advogadoJuliana.id,
    },
  });

  // Criar eventos
  await prisma.evento.upsert({
    where: { id: `evento-luana-1` },
    update: {
      titulo: "Audiência de Conciliação - Paulo Silva",
      descricao: "Audiência de conciliação referente ao processo de cobrança",
      tipo: "AUDIENCIA",
      status: "CONFIRMADO",
      dataInicio: new Date("2025-05-15T10:00:00-03:00"),
      dataFim: new Date("2025-05-15T11:30:00-03:00"),
      local: "1ª Vara Cível - Brasília/DF",
      processoId: processoPaulo.id,
      clienteId: clientePaulo.id,
      advogadoResponsavelId: advogadoLuana.id,
      lembreteMinutos: 60,
    },
    create: {
      id: `evento-luana-1`,
      tenantId: tenant.id,
      titulo: "Audiência de Conciliação - Paulo Silva",
      descricao: "Audiência de conciliação referente ao processo de cobrança",
      tipo: "AUDIENCIA",
      status: "CONFIRMADO",
      dataInicio: new Date("2025-05-15T10:00:00-03:00"),
      dataFim: new Date("2025-05-15T11:30:00-03:00"),
      local: "1ª Vara Cível - Brasília/DF",
      processoId: processoPaulo.id,
      clienteId: clientePaulo.id,
      advogadoResponsavelId: advogadoLuana.id,
      lembreteMinutos: 60,
    },
  });

  await prisma.evento.upsert({
    where: { id: `evento-luana-2` },
    update: {
      titulo: "Reunião com Cliente Maria",
      descricao: "Reunião para discussão de estratégia processual",
      tipo: "REUNIAO",
      status: "AGENDADO",
      dataInicio: new Date("2025-05-20T14:00:00-03:00"),
      dataFim: new Date("2025-05-20T15:00:00-03:00"),
      local: "Escritório - Faria Lima",
      clienteId: clienteMaria.id,
      advogadoResponsavelId: advogadoGabriel.id,
      lembreteMinutos: 30,
    },
    create: {
      id: `evento-luana-2`,
      tenantId: tenant.id,
      titulo: "Reunião com Cliente Maria",
      descricao: "Reunião para discussão de estratégia processual",
      tipo: "REUNIAO",
      status: "AGENDADO",
      dataInicio: new Date("2025-05-20T14:00:00-03:00"),
      dataFim: new Date("2025-05-20T15:00:00-03:00"),
      local: "Escritório - Faria Lima",
      clienteId: clienteMaria.id,
      advogadoResponsavelId: advogadoGabriel.id,
      lembreteMinutos: 30,
    },
  });

  // Criar endereços para os usuários
  console.log("🏠 Criando endereços dos usuários...");

  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Sede - Luana",
      },
    },
    update: {
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "SCS Quadra 1",
      numero: "Bloco A",
      complemento: "Ed. Central, Sala 505",
      bairro: "Asa Sul",
      cidade: "Brasília",
      estado: "DF",
      cep: "70300-500",
      pais: "Brasil",
      telefone: "+55 61 3300-1234",
      usuarioId: adminUser.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Sede - Luana",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "SCS Quadra 1",
      numero: "Bloco A",
      complemento: "Ed. Central, Sala 505",
      bairro: "Asa Sul",
      cidade: "Brasília",
      estado: "DF",
      cep: "70300-500",
      pais: "Brasil",
      telefone: "+55 61 3300-1234",
      usuarioId: adminUser.id,
    },
  });

  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Casa - Paulo",
      },
    },
    update: {
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "SGAS 910",
      numero: "Bloco C",
      complemento: "Apto 302",
      bairro: "Asa Sul",
      cidade: "Brasília",
      estado: "DF",
      cep: "70390-100",
      pais: "Brasil",
      telefone: "+55 61 99888-7777",
      clienteId: clientePaulo.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Casa - Paulo",
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "SGAS 910",
      numero: "Bloco C",
      complemento: "Apto 302",
      bairro: "Asa Sul",
      cidade: "Brasília",
      estado: "DF",
      cep: "70390-100",
      pais: "Brasil",
      telefone: "+55 61 99888-7777",
      clienteId: clientePaulo.id,
    },
  });

  console.log("✅ Endereços dos usuários criados com sucesso!");

  console.log("\n📋 Credenciais de teste - Luana Morais Advocacia:");
  console.log("👑 ADMIN: luana@adv.br / Luana@123");
  console.log("⚖️ ADVOGADO: gabriel@luanamorais.adv.br / Advogado@123");
  console.log("⚖️ ADVOGADO: juliana@luanamorais.adv.br / Advogado@123");
  console.log("👤 CLIENTE: paulo@luanamorais.adv.br / Cliente@123");
  console.log("👤 CLIENTE: maria@luanamorais.adv.br / Cliente@123");
  console.log("👤 CLIENTE: tech@luanamorais.adv.br / Cliente@123");
  console.log("\n🔗 Acesso: http://localhost:9192/login");
  console.log("🏢 Slug do tenant: luana");

  console.log("Seed tenant Luana: OK");
}

module.exports = { seedTenantLuana };
