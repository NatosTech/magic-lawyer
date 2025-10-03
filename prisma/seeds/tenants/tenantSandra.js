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

async function seedTenantSandra(prisma, Prisma) {
  const [adminPasswordHash, clientePasswordHash, advogadoPasswordHash] = await Promise.all([bcrypt.hash("Sandra@123", 10), bcrypt.hash("Cliente@123", 10), bcrypt.hash("Advogado@123", 10)]);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "sandra" },
    update: {
      name: "Sandra Advocacia",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
      documento: "12.345.678/0001-99",
      razaoSocial: "Sandra Guimarães Sociedade Individual de Advocacia",
      nomeFantasia: "Sandra Advocacia",
      inscricaoMunicipal: "123456",
      inscricaoEstadual: null,
      email: "contato@sandraadv.br",
      telefone: "+55 11 4000-1234",
    },
    create: {
      name: "Sandra Advocacia",
      slug: "sandra",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      tipoPessoa: "JURIDICA",
      documento: "12.345.678/0001-99",
      razaoSocial: "Sandra Guimarães Sociedade Individual de Advocacia",
      nomeFantasia: "Sandra Advocacia",
      inscricaoMunicipal: "123456",
      inscricaoEstadual: null,
      email: "contato@sandraadv.br",
      telefone: "+55 11 4000-1234",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#7F1D1D",
      secondaryColor: "#F4F4F5",
      accentColor: "#F97316",
      logoUrl: "https://dummyimage.com/240x80/7f1d1d/ffffff&text=Sandra+Advocacia",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#7F1D1D",
      secondaryColor: "#F4F4F5",
      accentColor: "#F97316",
      logoUrl: "https://dummyimage.com/240x80/7f1d1d/ffffff&text=Sandra+Advocacia",
    },
  });

  const enderecos = [
    {
      apelido: "Matriz São Paulo",
      tipo: "MATRIZ",
      principal: true,
      logradouro: "Av. Paulista",
      numero: "1000",
      complemento: "Conj. 101",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-100",
      pais: "Brasil",
      telefone: "+55 11 4000-1234",
    },
    {
      apelido: "Filial Rio de Janeiro",
      tipo: "FILIAL",
      principal: false,
      logradouro: "Rua da Assembleia",
      numero: "50",
      complemento: "Sala 804",
      bairro: "Centro",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      cep: "20011-000",
      pais: "Brasil",
      telefone: "+55 21 3900-4567",
    },
    {
      apelido: "Filial Recife",
      tipo: "FILIAL",
      principal: false,
      logradouro: "Av. Boa Viagem",
      numero: "210",
      complemento: "Sala 305",
      bairro: "Boa Viagem",
      cidade: "Recife",
      estado: "PE",
      cep: "51011-000",
      pais: "Brasil",
      telefone: "+55 81 3777-8899",
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

  const adminUser = await ensureUsuario(prisma, tenant.id, "sandra@adv.br", {
    firstName: "Sandra",
    lastName: "Guimarães",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    active: true,
  });

  await Promise.all([
    ensurePermission(prisma, tenant.id, adminUser.id, "CONFIGURACOES_ESCRITORIO"),
    ensurePermission(prisma, tenant.id, adminUser.id, "EQUIPE_GERENCIAR"),
    ensurePermission(prisma, tenant.id, adminUser.id, "FINANCEIRO_GERENCIAR"),
  ]);

  const advogadoSandra = await prisma.advogado.upsert({
    where: { usuarioId: adminUser.id },
    update: {
      oabNumero: "123456",
      oabUf: "SP",
      especialidades: "Direito Cível",
    },
    create: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      oabNumero: "123456",
      oabUf: "SP",
      especialidades: "Direito Cível",
    },
  });

  const ricardoUser = await ensureUsuario(prisma, tenant.id, "ricardo@sandraadv.br", {
    firstName: "Ricardo",
    lastName: "Araújo",
    passwordHash: advogadoPasswordHash,
    role: "ADVOGADO",
    active: true,
  });

  const advogadoRicardo = await prisma.advogado.upsert({
    where: { usuarioId: ricardoUser.id },
    update: {
      oabNumero: "789012",
      oabUf: "RJ",
      especialidades: "Direito Trabalhista",
    },
    create: {
      tenantId: tenant.id,
      usuarioId: ricardoUser.id,
      oabNumero: "789012",
      oabUf: "RJ",
      especialidades: "Direito Trabalhista",
    },
  });

  const fernandaUser = await ensureUsuario(prisma, tenant.id, "fernanda@sandraadv.br", {
    firstName: "Fernanda",
    lastName: "Lima",
    passwordHash: advogadoPasswordHash,
    role: "ADVOGADO",
    active: true,
  });

  const advogadoFernanda = await prisma.advogado.upsert({
    where: { usuarioId: fernandaUser.id },
    update: {
      oabNumero: "345678",
      oabUf: "SP",
      especialidades: "Direito Empresarial",
    },
    create: {
      tenantId: tenant.id,
      usuarioId: fernandaUser.id,
      oabNumero: "345678",
      oabUf: "SP",
      especialidades: "Direito Empresarial",
    },
  });

  const clienteMarcosUser = await ensureUsuario(prisma, tenant.id, "cliente@sandraadv.br", {
    firstName: "Marcos",
    lastName: "Souza",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteMarcos = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "123.456.789-00" },
  });

  if (clienteMarcos) {
    clienteMarcos = await prisma.cliente.update({
      where: { id: clienteMarcos.id },
      data: {
        nome: "Marcos Souza",
        email: "cliente@sandraadv.br",
        telefone: "+55 11 99999-0000",
        usuarioId: clienteMarcosUser.id,
      },
    });
  } else {
    clienteMarcos = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Marcos Souza",
        documento: "123.456.789-00",
        email: "cliente@sandraadv.br",
        telefone: "+55 11 99999-0000",
        usuarioId: clienteMarcosUser.id,
      },
    });
  }

  const clienteAnaUser = await ensureUsuario(prisma, tenant.id, "ana@sandraadv.br", {
    firstName: "Ana Paula",
    lastName: "Oliveira",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteAna = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "987.654.321-00" },
  });

  if (clienteAna) {
    clienteAna = await prisma.cliente.update({
      where: { id: clienteAna.id },
      data: {
        nome: "Ana Paula Oliveira",
        email: "ana@sandraadv.br",
        telefone: "+55 21 98888-0000",
        usuarioId: clienteAnaUser.id,
      },
    });
  } else {
    clienteAna = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Ana Paula Oliveira",
        documento: "987.654.321-00",
        email: "ana@sandraadv.br",
        telefone: "+55 21 98888-0000",
        usuarioId: clienteAnaUser.id,
      },
    });
  }

  const clienteInovaUser = await ensureUsuario(prisma, tenant.id, "inova@sandraadv.br", {
    firstName: "Carlos",
    lastName: "Mendes",
    passwordHash: clientePasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteInova = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "45.678.901/0001-11" },
  });

  if (clienteInova) {
    clienteInova = await prisma.cliente.update({
      where: { id: clienteInova.id },
      data: {
        nome: "Inova Tech Ltda",
        email: "inova@sandraadv.br",
        telefone: "+55 11 95555-2222",
        responsavelNome: "Carlos Mendes",
        responsavelEmail: "carlos.mendes@inovatech.com",
        responsavelTelefone: "+55 11 95555-2222",
        usuarioId: clienteInovaUser.id,
      },
    });
  } else {
    clienteInova = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "JURIDICA",
        nome: "Inova Tech Ltda",
        documento: "45.678.901/0001-11",
        email: "inova@sandraadv.br",
        telefone: "+55 11 95555-2222",
        responsavelNome: "Carlos Mendes",
        responsavelEmail: "carlos.mendes@inovatech.com",
        responsavelTelefone: "+55 11 95555-2222",
        usuarioId: clienteInovaUser.id,
      },
    });
  }

  const areaCivel = await prisma.areaProcesso.findFirst({ where: { slug: "civel" } });
  const areaTrabalhista = await prisma.areaProcesso.findFirst({ where: { slug: "trabalhista" } });
  const areaEmpresarial = await prisma.areaProcesso.findFirst({ where: { slug: "empresarial" } });

  let processoMarcos = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "1020304-56.2025.8.26.0100" },
  });

  if (!processoMarcos) {
    processoMarcos = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "1020304-56.2025.8.26.0100",
        titulo: "Ação de Revisão Contratual",
        status: "EM_ANDAMENTO",
        clienteId: clienteMarcos.id,
        advogadoResponsavelId: advogadoSandra.id,
        areaId: areaCivel?.id ?? null,
        comarca: "São Paulo",
        foro: "Foro Central",
        valorCausa: new Prisma.Decimal(50000),
        dataDistribuicao: new Date("2025-01-15T12:00:00-03:00"),
      },
    });
  }

  let processoAna = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "2098765-12.2025.8.19.0001" },
  });

  if (!processoAna) {
    processoAna = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "2098765-12.2025.8.19.0001",
        titulo: "Reclamação Trabalhista",
        status: "EM_ANDAMENTO",
        clienteId: clienteAna.id,
        advogadoResponsavelId: advogadoRicardo.id,
        areaId: areaTrabalhista?.id ?? null,
        comarca: "Rio de Janeiro",
        foro: "TRT 1ª Região",
        valorCausa: new Prisma.Decimal(12000),
        dataDistribuicao: new Date("2025-03-10T09:00:00-03:00"),
      },
    });
  }

  let processoInova = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: "5032109-45.2025.8.26.0100" },
  });

  if (!processoInova) {
    processoInova = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        numero: "5032109-45.2025.8.26.0100",
        titulo: "Revisão de Contrato de Fornecimento",
        status: "RASCUNHO",
        clienteId: clienteInova.id,
        advogadoResponsavelId: advogadoFernanda.id,
        areaId: areaEmpresarial?.id ?? null,
        comarca: "São Paulo",
        foro: "Foro Regional Pinheiros",
        valorCausa: new Prisma.Decimal(250000),
        dataDistribuicao: new Date("2025-04-22T14:30:00-03:00"),
      },
    });
  }

  const documentoRg = await prisma.documento.upsert({
    where: { id: `doc-rg-${clienteMarcos.id}` },
    update: {
      nome: "RG - Marcos Souza.pdf",
      url: "https://dummyimage.com/600x800/cccccc/000000&text=RG",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      clienteId: clienteMarcos.id,
      origem: "CLIENTE",
      visivelParaCliente: true,
      visivelParaEquipe: true,
    },
    create: {
      id: `doc-rg-${clienteMarcos.id}`,
      tenantId: tenant.id,
      nome: "RG - Marcos Souza.pdf",
      url: "https://dummyimage.com/600x800/cccccc/000000&text=RG",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      clienteId: clienteMarcos.id,
      origem: "CLIENTE",
      visivelParaCliente: true,
      visivelParaEquipe: true,
    },
  });

  await prisma.processoDocumento.upsert({
    where: {
      processoId_documentoId: {
        processoId: processoMarcos.id,
        documentoId: documentoRg.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      processoId: processoMarcos.id,
      documentoId: documentoRg.id,
      visivelParaCliente: true,
    },
  });

  let procuracaoMarcos = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-2025-001" },
  });

  if (!procuracaoMarcos) {
    procuracaoMarcos = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clienteMarcos.id,
        numero: "PROC-2025-001",
        emitidaEm: new Date("2025-02-01T10:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-02-01T10:30:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ESCRITORIO",
        validaAte: new Date("2026-02-01T10:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoMarcos.id,
        processoId: processoMarcos.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoMarcos.id,
      processoId: processoMarcos.id,
    },
  });

  const equipePrincipal = [advogadoSandra, advogadoRicardo, advogadoFernanda];
  for (const advogadoEquipe of equipePrincipal) {
    await prisma.procuracaoAdvogado.upsert({
      where: {
        procuracaoId_advogadoId: {
          procuracaoId: procuracaoMarcos.id,
          advogadoId: advogadoEquipe.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoMarcos.id,
        advogadoId: advogadoEquipe.id,
      },
    });
  }

  let procuracaoAna = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-2025-002" },
  });

  if (!procuracaoAna) {
    procuracaoAna = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clienteAna.id,
        numero: "PROC-2025-002",
        emitidaEm: new Date("2025-03-01T11:00:00-03:00"),
        assinadaPeloClienteEm: new Date("2025-03-01T11:15:00-03:00"),
        status: "VIGENTE",
        emitidaPor: "ADVOGADO",
        validaAte: new Date("2026-03-01T11:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoAna.id,
        processoId: processoAna.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoAna.id,
      processoId: processoAna.id,
    },
  });

  for (const advogadoEquipe of [advogadoRicardo, advogadoFernanda]) {
    await prisma.procuracaoAdvogado.upsert({
      where: {
        procuracaoId_advogadoId: {
          procuracaoId: procuracaoAna.id,
          advogadoId: advogadoEquipe.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoAna.id,
        advogadoId: advogadoEquipe.id,
      },
    });
  }

  let procuracaoInova = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-2025-003" },
  });

  if (!procuracaoInova) {
    procuracaoInova = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        clienteId: clienteInova.id,
        numero: "PROC-2025-003",
        emitidaEm: new Date("2025-04-05T15:00:00-03:00"),
        status: "PENDENTE_ASSINATURA",
        emitidaPor: "ESCRITORIO",
        validaAte: new Date("2026-04-05T15:00:00-03:00"),
      },
    });
  }

  await prisma.procuracaoProcesso.upsert({
    where: {
      procuracaoId_processoId: {
        procuracaoId: procuracaoInova.id,
        processoId: processoInova.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoInova.id,
      processoId: processoInova.id,
    },
  });

  await prisma.procuracaoAdvogado.upsert({
    where: {
      procuracaoId_advogadoId: {
        procuracaoId: procuracaoInova.id,
        advogadoId: advogadoFernanda.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoInova.id,
      advogadoId: advogadoFernanda.id,
    },
  });

  console.log("Seed tenant Sandra: OK");
}

module.exports = { seedTenantSandra };
