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
  const [adminPasswordHash, clientePasswordHash, advogadoPasswordHash, robsonPasswordHash, lucenaPasswordHash] = await Promise.all([
    bcrypt.hash("Sandra@123", 10),
    bcrypt.hash("Cliente@123", 10),
    bcrypt.hash("Advogado@123", 10),
    bcrypt.hash("Robson123!", 10),
    bcrypt.hash("LucenaRevogada@123", 10),
  ]);

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
      apelido: "Wall Street - Salvador",
      tipo: "ESCRITORIO",
      principal: false,
      logradouro: "Av. Luiz Viana Filho",
      numero: "6462",
      complemento: "Empresarial Wall Street, Torre A, Sala 1202",
      bairro: "Paralela",
      cidade: "Salvador",
      estado: "BA",
      cep: "41730-101",
      pais: "Brasil",
      telefone: "+55 71 4000-1234",
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
    firstName: "Sandra Quesia de Souza Costa",
    lastName: "Porto",
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
      oabNumero: "19872",
      oabUf: "BA",
      especialidades: ["CIVIL", "EMPRESARIAL"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      oabNumero: "19872",
      oabUf: "BA",
      especialidades: ["CIVIL", "EMPRESARIAL"],
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
      especialidades: ["TRABALHISTA"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: ricardoUser.id,
      oabNumero: "789012",
      oabUf: "RJ",
      especialidades: ["TRABALHISTA"],
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
      especialidades: ["EMPRESARIAL"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: fernandaUser.id,
      oabNumero: "345678",
      oabUf: "SP",
      especialidades: ["EMPRESARIAL"],
    },
  });

  const lucenaUser = await ensureUsuario(prisma, tenant.id, "lucena.alves@externo.br", {
    firstName: "Lucena",
    lastName: "Mayara Alves",
    passwordHash: lucenaPasswordHash,
    role: "ADVOGADO",
    active: false,
  });

  const advogadoLucena = await prisma.advogado.upsert({
    where: { usuarioId: lucenaUser.id },
    update: {
      oabNumero: "45879",
      oabUf: "BA",
      especialidades: ["FAMILIA"],
      bio: "Advogada anteriormente constituída pelo cliente, poderes revogados em 20/05/2025.",
    },
    create: {
      tenantId: tenant.id,
      usuarioId: lucenaUser.id,
      oabNumero: "45879",
      oabUf: "BA",
      especialidades: ["FAMILIA"],
      bio: "Advogada anteriormente constituída pelo cliente, poderes revogados em 20/05/2025.",
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

  const robsonUser = await ensureUsuario(prisma, tenant.id, "robsonnonato@magiclawyer.com", {
    firstName: "Robson José",
    lastName: "Nonato Filho",
    passwordHash: robsonPasswordHash,
    role: "CLIENTE",
    active: true,
  });

  let clienteRobson = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "083.620.235-03" },
  });

  if (clienteRobson) {
    clienteRobson = await prisma.cliente.update({
      where: { id: clienteRobson.id },
      data: {
        nome: "Robson José Santos Nonato Filho",
        email: "robsonnonato@magiclawyer.com",
        telefone: "+55 71 9901-1037",
        celular: "+55 71 9901-1037",
        usuarioId: robsonUser.id,
        dataNascimento: new Date("1997-08-17T00:00:00-03:00"),
        observacoes: "Dados importados do contrato de honorários firmado em 05/09/2025.",
      },
    });
  } else {
    clienteRobson = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Robson José Santos Nonato Filho",
        documento: "083.620.235-03",
        email: "robsonnonato@magiclawyer.com",
        telefone: "+55 71 9901-1037",
        celular: "+55 71 9901-1037",
        usuarioId: robsonUser.id,
        dataNascimento: new Date("1997-08-17T00:00:00-03:00"),
        observacoes: "Dados importados do contrato de honorários firmado em 05/09/2025.",
      },
    });
  }

  await prisma.advogadoCliente.upsert({
    where: {
      advogadoId_clienteId: {
        advogadoId: advogadoSandra.id,
        clienteId: clienteRobson.id,
      },
    },
    update: {
      relacionamento: "PRINCIPAL",
    },
    create: {
      tenantId: tenant.id,
      advogadoId: advogadoSandra.id,
      clienteId: clienteRobson.id,
      relacionamento: "PRINCIPAL",
    },
  });

  await prisma.banco.upsert({
    where: { codigo: "237" },
    update: {
      nome: "Bradesco",
      nomeCompleto: "Banco Bradesco S.A.",
      site: "https://www.bradesco.com.br",
      telefone: "0800 704 8383",
      ispb: "60746948",
      ativo: true,
    },
    create: {
      codigo: "237",
      nome: "Bradesco",
      nomeCompleto: "Banco Bradesco S.A.",
      site: "https://www.bradesco.com.br",
      telefone: "0800 704 8383",
      ispb: "60746948",
      ativo: true,
    },
  });

  await prisma.dadosBancarios.upsert({
    where: { id: "dados-sandra-bradesco" },
    update: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      tipoConta: "PESSOA_FISICA",
      bancoCodigo: "237",
      agencia: "3231",
      conta: "96452",
      digitoConta: "2",
      tipoContaBancaria: "CORRENTE",
      chavePix: "94342253534",
      tipoChavePix: "CPF",
      titularNome: "Sandra Quesia de Souza Costa Porto",
      titularDocumento: "94342253534",
      titularEmail: "souzacostaadv@yahoo.com.br",
      titularTelefone: "+55 71 3272-5756",
      endereco: "Av. Paralela, 6462, Torre East (A), sala 1202",
      cidade: "Salvador",
      estado: "BA",
      cep: "41730-101",
      principal: true,
      observacoes: "Conta informada no contrato de honorários firmado em 05/09/2025.",
    },
    create: {
      id: "dados-sandra-bradesco",
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      tipoConta: "PESSOA_FISICA",
      bancoCodigo: "237",
      agencia: "3231",
      conta: "96452",
      digitoConta: "2",
      tipoContaBancaria: "CORRENTE",
      chavePix: "94342253534",
      tipoChavePix: "CPF",
      titularNome: "Sandra Quesia de Souza Costa Porto",
      titularDocumento: "94342253534",
      titularEmail: "souzacostaadv@yahoo.com.br",
      titularTelefone: "+55 71 3272-5756",
      endereco: "Av. Paralela, 6462, Torre East (A), sala 1202",
      cidade: "Salvador",
      estado: "BA",
      cep: "41730-101",
      principal: true,
      observacoes: "Conta informada no contrato de honorários firmado em 05/09/2025.",
    },
  });

  const areaCivel = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "civel",
    },
  });
  const areaTrabalhista = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "trabalhista",
    },
  });
  const areaEmpresarial = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "empresarial",
    },
  });
  const areaFamilia = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "familia",
    },
  });
  const areaCriminal = await prisma.areaProcesso.findFirst({
    where: {
      tenantId: "GLOBAL",
      slug: "criminal",
    },
  });

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

  const processoGuardaNumero = "8154973-16.2024.8.05.0001";
  const processoGuardaData = {
    numero: processoGuardaNumero,
    numeroCnj: processoGuardaNumero,
    titulo: "Guarda de Família - Filippo L. D. N.",
    status: "EM_ANDAMENTO",
    grau: "PRIMEIRO",
    fase: "INSTRUCAO",
    descricao: "Ação de guarda ajuizada por Robson José Santos Nonato Filho para restabelecer a convivência com o filho Filippo.",
    areaId: areaFamilia?.id ?? null,
    vara: "1ª Vara de Família da Comarca de Salvador/BA",
    comarca: "Salvador",
    foro: "1ª Vara de Família da Comarca de Salvador/BA",
    segredoJustica: true,
    valorCausa: new Prisma.Decimal(7920),
    dataDistribuicao: new Date("2024-10-23T10:00:00-03:00"),
    clienteId: clienteRobson.id,
    advogadoResponsavelId: advogadoSandra.id,
    tags: ["guarda", "filippo", "liminar", "varafamilia1"],
  };

  let processoGuarda = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: processoGuardaNumero },
  });

  if (processoGuarda) {
    processoGuarda = await prisma.processo.update({
      where: { id: processoGuarda.id },
      data: processoGuardaData,
    });
  } else {
    processoGuarda = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        ...processoGuardaData,
      },
    });
  }

  const processoUniaoNumero = "8155658-23.2024.8.05.0001";
  const processoUniaoData = {
    numero: processoUniaoNumero,
    numeroCnj: processoUniaoNumero,
    titulo: "Reconhecimento e Extinção de União Estável",
    status: "EM_ANDAMENTO",
    grau: "PRIMEIRO",
    fase: "INSTRUCAO",
    descricao: "Demanda proposta por Tainá Luísa de Souza Domingos envolvendo partilha patrimonial e guarda do menor Filippo.",
    areaId: areaFamilia?.id ?? null,
    vara: "8ª Vara de Família da Comarca de Salvador/BA",
    comarca: "Salvador",
    foro: "8ª Vara de Família da Comarca de Salvador/BA",
    segredoJustica: true,
    valorCausa: new Prisma.Decimal(120040),
    dataDistribuicao: new Date("2024-10-24T11:00:00-03:00"),
    clienteId: clienteRobson.id,
    advogadoResponsavelId: advogadoSandra.id,
    tags: ["uniao_estavel", "partilha", "varafamilia8"],
  };

  let processoUniao = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: processoUniaoNumero },
  });

  if (processoUniao) {
    processoUniao = await prisma.processo.update({
      where: { id: processoUniao.id },
      data: processoUniaoData,
    });
  } else {
    processoUniao = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        ...processoUniaoData,
      },
    });
  }

  const processoMedidasNumero = "8155723-18.2024.8.05.0001";
  const processoMedidasData = {
    numero: processoMedidasNumero,
    numeroCnj: processoMedidasNumero,
    titulo: "Medidas Protetivas de Urgência - Lei Maria da Penha",
    status: "EM_ANDAMENTO",
    grau: "PRIMEIRO",
    fase: "INSTRUCAO",
    descricao: "Procedimento criminal em curso na 5ª Vara de Violência Doméstica envolvendo medidas protetivas em desfavor de Robson.",
    areaId: areaCriminal?.id ?? null,
    vara: "5ª Vara de Violência Doméstica e Familiar contra a Mulher de Salvador/BA",
    comarca: "Salvador",
    foro: "5ª Vara de Violência Doméstica e Familiar contra a Mulher de Salvador/BA",
    segredoJustica: true,
    valorCausa: new Prisma.Decimal(0),
    dataDistribuicao: new Date("2024-10-24T15:00:00-03:00"),
    clienteId: clienteRobson.id,
    advogadoResponsavelId: advogadoSandra.id,
    tags: ["medidas_protetivas", "lei_maria_da_penha", "violencia_domestica"],
  };

  let processoMedidas = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, numero: processoMedidasNumero },
  });

  if (processoMedidas) {
    processoMedidas = await prisma.processo.update({
      where: { id: processoMedidas.id },
      data: processoMedidasData,
    });
  } else {
    processoMedidas = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        ...processoMedidasData,
      },
    });
  }

  const processoPartesConfigs = [
    {
      id: "procparte-guarda-autor-robson",
      processoId: processoGuarda.id,
      tipoPolo: "AUTOR",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      email: "robsonnonato@magiclawyer.com",
      telefone: "+55 71 9901-1037",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Pai e requerente da guarda",
      observacoes: "Busca restabelecer visitas com o filho Filippo desde 12/10/2024.",
    },
    {
      id: "procparte-guarda-reu-taina",
      processoId: processoGuarda.id,
      tipoPolo: "REU",
      nome: "Tainá Luísa de Souza Domingos",
      observacoes: "Genitora do menor Filippo.",
    },
    {
      id: "procparte-guarda-terceiro-filippo",
      processoId: processoGuarda.id,
      tipoPolo: "TERCEIRO",
      nome: "F. L. D. N.",
      observacoes: "Filho menor do casal, foco da demanda de guarda.",
    },
    {
      id: "procparte-guarda-mp",
      processoId: processoGuarda.id,
      tipoPolo: "MINISTERIO_PUBLICO",
      nome: "Ministério Público do Estado da Bahia",
    },
    {
      id: "procparte-uniao-autor-taina",
      processoId: processoUniao.id,
      tipoPolo: "AUTOR",
      nome: "Tainá Luísa de Souza Domingos",
      observacoes: "Requerente do reconhecimento e da partilha da união estável.",
    },
    {
      id: "procparte-uniao-reu-robson",
      processoId: processoUniao.id,
      tipoPolo: "REU",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      email: "robsonnonato@magiclawyer.com",
      telefone: "+55 71 9901-1037",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Requerido e responsável pelo contraditório.",
      observacoes: "Contestou a partilha e apresentou comprovantes de renda.",
    },
    {
      id: "procparte-uniao-terceiro-filippo",
      processoId: processoUniao.id,
      tipoPolo: "TERCEIRO",
      nome: "F. L. D. N.",
      observacoes: "Menor figurando como terceiro interessado.",
    },
    {
      id: "procparte-uniao-mp",
      processoId: processoUniao.id,
      tipoPolo: "MINISTERIO_PUBLICO",
      nome: "Ministério Público do Estado da Bahia",
    },
    {
      id: "procparte-medidas-autor-taina",
      processoId: processoMedidas.id,
      tipoPolo: "AUTOR",
      nome: "Tainá Luísa de Souza Domingos",
      observacoes: "Requerente das medidas protetivas.",
    },
    {
      id: "procparte-medidas-reu-robson",
      processoId: processoMedidas.id,
      tipoPolo: "REU",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      email: "robsonnonato@magiclawyer.com",
      telefone: "+55 71 9901-1037",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Requerido nas medidas protetivas.",
    },
    {
      id: "procparte-medidas-mp",
      processoId: processoMedidas.id,
      tipoPolo: "MINISTERIO_PUBLICO",
      nome: "Ministério Público do Estado da Bahia",
    },
    {
      id: "procparte-medidas-deam",
      processoId: processoMedidas.id,
      tipoPolo: "TERCEIRO",
      nome: "DEAM Brotas - Salvador",
      observacoes: "Autoridade policial que originou o procedimento.",
    },
  ];

  for (const parte of processoPartesConfigs) {
    await prisma.processoParte.upsert({
      where: { id: parte.id },
      update: {
        processoId: parte.processoId,
        tipoPolo: parte.tipoPolo,
        nome: parte.nome,
        documento: parte.documento ?? null,
        email: parte.email ?? null,
        telefone: parte.telefone ?? null,
        clienteId: parte.clienteId ?? null,
        advogadoId: parte.advogadoId ?? null,
        papel: parte.papel ?? null,
        observacoes: parte.observacoes ?? null,
      },
      create: {
        id: parte.id,
        tenantId: tenant.id,
        processoId: parte.processoId,
        tipoPolo: parte.tipoPolo,
        nome: parte.nome,
        documento: parte.documento ?? null,
        email: parte.email ?? null,
        telefone: parte.telefone ?? null,
        clienteId: parte.clienteId ?? null,
        advogadoId: parte.advogadoId ?? null,
        papel: parte.papel ?? null,
        observacoes: parte.observacoes ?? null,
      },
    });
  }

  const peticoesConfigs = [
    {
      id: "pet-guard-inicial",
      processoId: processoGuarda.id,
      titulo: "Petição Inicial - Guarda e visitas",
      tipo: "INICIAL_GUARDA",
      status: "PROTOCOLADA",
      descricao: "Inicial protocolada em 23/10/2024 com pedido liminar para retomada das visitas paternas.",
      protocoloNumero: "PET-8154973-2024-PI",
      protocoladoEm: new Date("2024-10-23T14:10:00-03:00"),
      criadoPorId: adminUser.id,
    },
    {
      id: "pet-guard-habilitacao",
      processoId: processoGuarda.id,
      titulo: "Habilitação da Dra. Sandra Quesia",
      tipo: "HABILITACAO_ADVOGADO",
      status: "PROTOCOLADA",
      descricao: "Procuração e habilitação protocoladas em 20/05/2025 substituindo a patrona anterior.",
      protocoloNumero: "PET-8154973-2025-HAB",
      protocoladoEm: new Date("2025-05-20T10:57:00-03:00"),
      criadoPorId: adminUser.id,
      observacoes: "Comunica a revogação dos poderes da Dra. Lucena Mayara Alves.",
    },
    {
      id: "pet-uniao-contestacao",
      processoId: processoUniao.id,
      titulo: "Contestação ao reconhecimento e extinção de união estável",
      tipo: "CONTESTACAO",
      status: "PROTOCOLADA",
      descricao: "Peça apresentada em 01/04/2025 contrapondo o pedido de partilha e guardas formulado pela requerente.",
      protocoloNumero: "PET-8155658-2025-CON",
      protocoladoEm: new Date("2025-04-01T17:12:00-03:00"),
      criadoPorId: adminUser.id,
    },
    {
      id: "pet-uniao-substabelecimento",
      processoId: processoUniao.id,
      titulo: "Substabelecimento sem reserva - Dra. Lucena para Dra. Sandra",
      tipo: "SUBSTABELECIMENTO",
      status: "PROTOCOLADA",
      descricao: "Substabelecimento juntado em 09/06/2025 confirmando a revogação da patrona anterior e transferência integral à Dra. Sandra.",
      protocoloNumero: "PET-8155658-2025-SUBS",
      protocoladoEm: new Date("2025-06-09T12:06:00-03:00"),
      criadoPorId: adminUser.id,
    },
    {
      id: "pet-medidas-replica",
      processoId: processoMedidas.id,
      titulo: "Réplica às alegações da requerente",
      tipo: "REPLICA",
      status: "PROTOCOLADA",
      descricao: "Réplica protocolada em 10/04/2025 rebatendo as medidas protetivas impostas.",
      protocoloNumero: "PET-8155723-2025-REP",
      protocoladoEm: new Date("2025-04-10T12:26:00-03:00"),
      criadoPorId: adminUser.id,
    },
    {
      id: "pet-medidas-ciencia",
      processoId: processoMedidas.id,
      titulo: "Ciência de decisão sobre medidas protetivas",
      tipo: "PETICAO_SIMPLES",
      status: "PROTOCOLADA",
      descricao: "Petição de ciência protocolada em 16/04/2025 registrando a decisão que manteve as medidas protetivas.",
      protocoloNumero: "PET-8155723-2025-CIE",
      protocoladoEm: new Date("2025-04-16T17:20:00-03:00"),
      criadoPorId: adminUser.id,
    },
  ];

  for (const peticao of peticoesConfigs) {
    await prisma.peticao.upsert({
      where: { id: peticao.id },
      update: {
        processoId: peticao.processoId,
        titulo: peticao.titulo,
        tipo: peticao.tipo ?? null,
        status: peticao.status,
        descricao: peticao.descricao ?? null,
        documentoId: peticao.documentoId ?? null,
        protocoloNumero: peticao.protocoloNumero ?? null,
        protocoladoEm: peticao.protocoladoEm ?? null,
        criadoPorId: peticao.criadoPorId ?? null,
        observacoes: peticao.observacoes ?? null,
      },
      create: {
        id: peticao.id,
        tenantId: tenant.id,
        processoId: peticao.processoId,
        titulo: peticao.titulo,
        tipo: peticao.tipo ?? null,
        status: peticao.status,
        descricao: peticao.descricao ?? null,
        documentoId: peticao.documentoId ?? null,
        protocoloNumero: peticao.protocoloNumero ?? null,
        protocoladoEm: peticao.protocoladoEm ?? null,
        criadoPorId: peticao.criadoPorId ?? null,
        observacoes: peticao.observacoes ?? null,
      },
    });
  }

  const movimentosConfigs = [
    {
      id: "mov-guard-decisao-liminar",
      processoId: processoGuarda.id,
      titulo: "Decisão liminar sobre visitas provisórias",
      tipo: "ANDAMENTO",
      descricao: "Decisão publicada em 28/04/2025 autorizando visitas assistidas e mantendo o pagamento de 30% do salário mínimo.",
      dataMovimentacao: new Date("2025-04-28T19:12:00-03:00"),
      notificarCliente: true,
    },
    {
      id: "mov-guard-audiencia",
      processoId: processoGuarda.id,
      titulo: "Audiência de conciliação",
      tipo: "AUDIENCIA",
      descricao: "Audiência realizada em 11/06/2025. Tentativa de acordo entre as partes restou infrutífera.",
      dataMovimentacao: new Date("2025-06-11T09:39:00-03:00"),
      notificarCliente: true,
    },
    {
      id: "mov-uniao-contestacao",
      processoId: processoUniao.id,
      titulo: "Contestação protocolada",
      tipo: "ANDAMENTO",
      descricao: "Contestação apresentada com documentos comprobatórios em 01/04/2025.",
      dataMovimentacao: new Date("2025-04-01T17:12:00-03:00"),
      notificarCliente: true,
    },
    {
      id: "mov-uniao-substabelecimento",
      processoId: processoUniao.id,
      titulo: "Substabelecimento sem reserva",
      tipo: "ANDAMENTO",
      descricao: "Substabelecimento juntado em 09/06/2025 transferindo a patrona principal para a Dra. Sandra.",
      dataMovimentacao: new Date("2025-06-09T12:06:00-03:00"),
      notificarCliente: true,
    },
    {
      id: "mov-medidas-decisao",
      processoId: processoMedidas.id,
      titulo: "Decisão sobre medidas protetivas",
      tipo: "ANDAMENTO",
      descricao: "Decisão de 14/04/2025 manteve as medidas protetivas e estabeleceu acompanhamento pelo Ministério Público.",
      dataMovimentacao: new Date("2025-04-14T15:19:00-03:00"),
      notificarCliente: true,
    },
    {
      id: "mov-medidas-ciencia",
      processoId: processoMedidas.id,
      titulo: "Petição de ciência da defesa",
      tipo: "INTIMACAO",
      descricao: "Defesa registrou ciência da decisão em 16/04/2025.",
      dataMovimentacao: new Date("2025-04-16T17:20:00-03:00"),
      notificarCliente: false,
    },
  ];

  for (const movimento of movimentosConfigs) {
    await prisma.movimentacaoProcesso.upsert({
      where: { id: movimento.id },
      update: {
        processoId: movimento.processoId,
        titulo: movimento.titulo,
        descricao: movimento.descricao ?? null,
        tipo: movimento.tipo ?? "ANDAMENTO",
        dataMovimentacao: movimento.dataMovimentacao ?? new Date(),
        prazo: movimento.prazo ?? null,
        notificarCliente: movimento.notificarCliente ?? false,
        notificarEmail: movimento.notificarEmail ?? false,
        notificarWhatsapp: movimento.notificarWhatsapp ?? false,
        mensagemPersonalizada: movimento.mensagemPersonalizada ?? null,
      },
      create: {
        id: movimento.id,
        tenantId: tenant.id,
        processoId: movimento.processoId,
        titulo: movimento.titulo,
        descricao: movimento.descricao ?? null,
        tipo: movimento.tipo ?? "ANDAMENTO",
        dataMovimentacao: movimento.dataMovimentacao ?? new Date(),
        prazo: movimento.prazo ?? null,
        notificarCliente: movimento.notificarCliente ?? false,
        notificarEmail: movimento.notificarEmail ?? false,
        notificarWhatsapp: movimento.notificarWhatsapp ?? false,
        mensagemPersonalizada: movimento.mensagemPersonalizada ?? null,
      },
    });
  }

  let procuracaoRobson = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-ROBSON-2025" },
  });

  const procuracaoRobsonData = {
    clienteId: clienteRobson.id,
    arquivoUrl: "https://magiclawyer-assets.local/procuracoes/procuracao-robson-assinada.pdf",
    observacoes: "Procuração vigente em favor da Dra. Sandra Quesia para todos os processos de família e violência doméstica do cliente.",
    emitidaEm: new Date("2025-09-05T00:00:00-03:00"),
    assinadaPeloClienteEm: new Date("2025-09-05T00:00:00-03:00"),
    validaAte: new Date("2026-09-05T00:00:00-03:00"),
    status: "VIGENTE",
    emitidaPor: "ADVOGADO",
    ativa: true,
    createdById: adminUser.id,
  };

  if (procuracaoRobson) {
    procuracaoRobson = await prisma.procuracao.update({
      where: { id: procuracaoRobson.id },
      data: procuracaoRobsonData,
    });
  } else {
    procuracaoRobson = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        numero: "PROC-ROBSON-2025",
        ...procuracaoRobsonData,
      },
    });
  }

  const processosRobson = [processoGuarda, processoUniao, processoMedidas];

  for (const processo of processosRobson) {
    await prisma.procuracaoProcesso.upsert({
      where: {
        procuracaoId_processoId: {
          procuracaoId: procuracaoRobson.id,
          processoId: processo.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoRobson.id,
        processoId: processo.id,
      },
    });
  }

  await prisma.procuracaoAdvogado.upsert({
    where: {
      procuracaoId_advogadoId: {
        procuracaoId: procuracaoRobson.id,
        advogadoId: advogadoSandra.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoRobson.id,
      advogadoId: advogadoSandra.id,
    },
  });

  let procuracaoLucena = await prisma.procuracao.findFirst({
    where: { tenantId: tenant.id, numero: "PROC-LUCENA-2024" },
  });

  const procuracaoLucenaData = {
    clienteId: clienteRobson.id,
    arquivoUrl: null,
    observacoes: "Procuração originalmente outorgada à Dra. Lucena Mayara Alves, revogada com substabelecimento em favor da Dra. Sandra em 20/05/2025.",
    emitidaEm: new Date("2024-10-20T15:00:00-03:00"),
    assinadaPeloClienteEm: new Date("2024-10-20T15:00:00-03:00"),
    validaAte: new Date("2026-10-20T15:00:00-03:00"),
    status: "REVOGADA",
    emitidaPor: "ADVOGADO",
    ativa: false,
    revogadaEm: new Date("2025-05-20T08:00:00-03:00"),
    createdById: adminUser.id,
  };

  if (procuracaoLucena) {
    procuracaoLucena = await prisma.procuracao.update({
      where: { id: procuracaoLucena.id },
      data: procuracaoLucenaData,
    });
  } else {
    procuracaoLucena = await prisma.procuracao.create({
      data: {
        tenantId: tenant.id,
        numero: "PROC-LUCENA-2024",
        ...procuracaoLucenaData,
      },
    });
  }

  for (const processo of processosRobson) {
    await prisma.procuracaoProcesso.upsert({
      where: {
        procuracaoId_processoId: {
          procuracaoId: procuracaoLucena.id,
          processoId: processo.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        procuracaoId: procuracaoLucena.id,
        processoId: processo.id,
      },
    });
  }

  await prisma.procuracaoAdvogado.upsert({
    where: {
      procuracaoId_advogadoId: {
        procuracaoId: procuracaoLucena.id,
        advogadoId: advogadoLucena.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      procuracaoId: procuracaoLucena.id,
      advogadoId: advogadoLucena.id,
    },
  });

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

  // Criar endereços para os usuários
  console.log("🏠 Criando endereços dos usuários...");

  // Endereço da Sandra (Wall Street)
  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Wall Street - Sandra",
      },
    },
    update: {
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "Av. Luiz Viana Filho",
      numero: "6462",
      complemento: "Empresarial Wall Street, Torre A, Sala 1202",
      bairro: "Paralela",
      cidade: "Salvador",
      estado: "BA",
      cep: "41730-101",
      pais: "Brasil",
      telefone: "+55 71 4000-1234",
      usuarioId: adminUser.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Wall Street - Sandra",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "Av. Luiz Viana Filho",
      numero: "6462",
      complemento: "Empresarial Wall Street, Torre A, Sala 1202",
      bairro: "Paralela",
      cidade: "Salvador",
      estado: "BA",
      cep: "41730-101",
      pais: "Brasil",
      telefone: "+55 71 4000-1234",
      usuarioId: adminUser.id,
    },
  });

  // Endereço do Ricardo
  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Residencial - Ricardo",
      },
    },
    update: {
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Rua das Flores",
      numero: "123",
      complemento: "Apto 45",
      bairro: "Copacabana",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      cep: "22000-000",
      pais: "Brasil",
      telefone: "+55 21 99999-1111",
      usuarioId: ricardoUser.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Residencial - Ricardo",
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Rua das Flores",
      numero: "123",
      complemento: "Apto 45",
      bairro: "Copacabana",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      cep: "22000-000",
      pais: "Brasil",
      telefone: "+55 21 99999-1111",
      usuarioId: ricardoUser.id,
    },
  });

  // Endereço do cliente Marcos
  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Casa - Marcos",
      },
    },
    update: {
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Av. Paulista",
      numero: "2000",
      complemento: "Conj. 501",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-200",
      pais: "Brasil",
      telefone: "+55 11 99999-0000",
      clienteId: clienteMarcos.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Casa - Marcos",
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Av. Paulista",
      numero: "2000",
      complemento: "Conj. 501",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-200",
      pais: "Brasil",
      telefone: "+55 11 99999-0000",
      clienteId: clienteMarcos.id,
    },
  });

  await prisma.endereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Residência - Robson Nonato",
      },
    },
    update: {
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Rua Orlando Imbassahy",
      numero: "377",
      complemento: "Casa 2A, Quadra 377",
      bairro: "Stella Maris",
      cidade: "Salvador",
      estado: "BA",
      cep: "41600-200",
      pais: "Brasil",
      telefone: "+55 71 9901-1037",
      clienteId: clienteRobson.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Residência - Robson Nonato",
      tipo: "RESIDENCIAL",
      principal: true,
      logradouro: "Rua Orlando Imbassahy",
      numero: "377",
      complemento: "Casa 2A, Quadra 377",
      bairro: "Stella Maris",
      cidade: "Salvador",
      estado: "BA",
      cep: "41600-200",
      pais: "Brasil",
      telefone: "+55 71 9901-1037",
      clienteId: clienteRobson.id,
    },
  });

  console.log("✅ Endereços dos usuários criados com sucesso!");

  console.log("\n📋 Credenciais de teste - Sandra Advocacia:");
  console.log("👑 ADMIN: sandra@adv.br / Sandra@123");
  console.log("⚖️ ADVOGADO: ricardo@sandraadv.br / Advogado@123");
  console.log("⚖️ ADVOGADO: fernanda@sandraadv.br / Advogado@123");
  console.log("👤 CLIENTE: cliente@sandraadv.br / Cliente@123");
  console.log("👤 CLIENTE: ana@sandraadv.br / Cliente@123");
  console.log("👤 CLIENTE: robsonnonato@magiclawyer.com / Robson123!");
  console.log("👤 CLIENTE: inova@sandraadv.br / Cliente@123");
  console.log("\n🔗 Acesso: http://localhost:9192/login");
  console.log("🏢 Slug do tenant: sandra");

  console.log("Seed tenant Sandra: OK");
}

module.exports = { seedTenantSandra };
