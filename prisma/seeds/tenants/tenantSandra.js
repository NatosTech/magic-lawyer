const bcrypt = require("bcryptjs");
const {
  processosJusticaTrabalho,
  processosProjudi,
  processosForum,
} = require("../data/sandraProcessos");

function normalizeUpper(value = "") {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function inferTipoPessoaFromNome(nome) {
  const normalized = normalizeUpper(nome);
  if (!normalized) return "FISICA";

  const juridicaKeywords = [
    "LTDA",
    "S/A",
    "SA ",
    "EIRELI",
    "MEI",
    "EPP",
    "ASSOCIACAO",
    "CONDOMINIO",
    "COND",
    "EMPRESA",
    "COMERCIO",
    "INDUSTRIA",
    "COOPERATIVA",
    "HOSPITAL",
    "CLINICA",
    "SERVICOS",
    "ALPHAVILLE",
    "(PJE)",
  ];

  return juridicaKeywords.some((keyword) => normalized.includes(keyword))
    ? "JURIDICA"
    : "FISICA";
}

function buildVaraDescricao(raw, suffix) {
  if (!raw && !suffix) return null;
  if (!raw) return suffix ?? null;

  const cleaned = raw.replace(/[-–]+$/u, "").trim();
  if (!cleaned && !suffix) return null;

  if (!cleaned) return suffix ?? null;
  if (!suffix) return cleaned;

  return `${cleaned} ${suffix}`.replace(/\s+/g, " ").trim();
}

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
  const [
    adminPasswordHash,
    robsonPasswordHash,
    secretariaPasswordHash,
    lucianoPasswordHash,
  ] = await Promise.all([
    bcrypt.hash("Sandra@123", 10),
    bcrypt.hash("Robson123!", 10),
    bcrypt.hash("Funcionario@123", 10),
    bcrypt.hash("Luciano@123", 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "sandra" },
    update: {
      name: "Souza Costa Advogados Associados",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
      documento: "12.345.678/0001-99",
      razaoSocial: "Souza Costa Advogados Associados",
      nomeFantasia: "Souza Costa Advogados Associados",
      inscricaoMunicipal: "123456",
      inscricaoEstadual: null,
      email: "contato@souzacostaadv.com.br",
      telefone: "+55 71 98734-3180",
    },
    create: {
      name: "Souza Costa Advogados Associados",
      slug: "sandra",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      tipoPessoa: "JURIDICA",
      documento: "12.345.678/0001-99",
      razaoSocial: "Souza Costa Advogados Associados",
      nomeFantasia: "Souza Costa Advogados Associados",
      inscricaoMunicipal: "123456",
      inscricaoEstadual: null,
      email: "contato@souzacostaadv.com.br",
      telefone: "+55 71 98734-3180",
    },
  });

  const clienteCache = new Map();

  async function getOrCreateClienteFromPlanilha(nome) {
    if (!nome) return null;
    const key = normalizeUpper(nome);
    if (clienteCache.has(key)) {
      return clienteCache.get(key);
    }

    let cliente = await prisma.cliente.findFirst({
      where: {
        tenantId: tenant.id,
        nome: {
          equals: nome,
          mode: "insensitive",
        },
      },
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          tenantId: tenant.id,
          nome,
          tipoPessoa: inferTipoPessoaFromNome(nome),
        },
      });
    }

    clienteCache.set(key, cliente);

    return cliente;
  }

  async function vincularClienteAdvogado(clienteId, advogadoId, relacionamento) {
    if (!clienteId || !advogadoId) return;

    await prisma.advogadoCliente.upsert({
      where: {
        advogadoId_clienteId: {
          advogadoId,
          clienteId,
        },
      },
      update: relacionamento ? { relacionamento } : {},
      create: {
        tenantId: tenant.id,
        advogadoId,
        clienteId,
        relacionamento: relacionamento ?? null,
      },
    });
  }

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#7F1D1D",
      secondaryColor: "#F4F4F5",
      accentColor: "#F97316",
      logoUrl: "https://dummyimage.com/240x80/7f1d1d/ffffff&text=Souza+Costa+Advogados",
      faviconUrl: "https://dummyimage.com/32x32/7f1d1d/ffffff&text=SC",
      emailFromName: "Souza Costa Advogados Associados",
      customDomainText: "Souza Costa Advogados Associados",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#7F1D1D",
      secondaryColor: "#F4F4F5",
      accentColor: "#F97316",
      logoUrl: "https://dummyimage.com/240x80/7f1d1d/ffffff&text=Souza+Costa+Advogados",
      faviconUrl: "https://dummyimage.com/32x32/7f1d1d/ffffff&text=SC",
      emailFromName: "Souza Costa Advogados Associados",
      customDomainText: "Souza Costa Advogados Associados",
    },
  });

  await prisma.tenantEmailCredential.upsert({
    where: {
      tenantId_type: {
        tenantId: tenant.id,
        type: "DEFAULT",
      },
    },
    update: {
      fromAddress: "magiclawyersaas@gmail.com",
      apiKey: "dxijwnbycpucxevl",
      fromName: "Sandra Advocacia",
    },
    create: {
      tenantId: tenant.id,
      type: "DEFAULT",
      fromAddress: "magiclawyersaas@gmail.com",
      apiKey: "dxijwnbycpucxevl",
      fromName: "Sandra Advocacia",
    },
  });

  await prisma.tenantEmailCredential.upsert({
    where: {
      tenantId_type: {
        tenantId: tenant.id,
        type: "ADMIN",
      },
    },
    update: {
      fromAddress: "robsonnonatoiii@gmail.com",
      apiKey: "hcwwwqxqzrhdgeuj",
      fromName: "Administração Sandra Advocacia",
    },
    create: {
      tenantId: tenant.id,
      type: "ADMIN",
      fromAddress: "robsonnonatoiii@gmail.com",
      apiKey: "hcwwwqxqzrhdgeuj",
      fromName: "Administração Sandra Advocacia",
    },
  });

  const enderecos = [
    {
      apelido: "Matriz São Paulo",
      tipo: "MATRIZ",
      principal: false,
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
      principal: true,
      logradouro: "Av. Luis Viana Filho",
      numero: "006462",
      complemento: "Edif. Manhattan Square Wall Street East, Torre A, Sala 1202",
      bairro: "Patamares",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      pais: "Brasil",
      telefone: "+55 71 98734-3180",
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
    dataNascimento: new Date("1975-12-20T00:00:00-03:00"),
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
      especialidades: ["CIVIL", "CRIMINAL", "EMPRESARIAL"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      oabNumero: "19872",
      oabUf: "BA",
      especialidades: ["CIVIL", "CRIMINAL", "EMPRESARIAL"],
    },
  });

  // Criar usuário da secretária Jaqueline
  const jaquelineUser = await ensureUsuario(prisma, tenant.id, "souzacostaadv@hotmail.com", {
    firstName: "Jaqueline",
    lastName: "Cruz Santana",
    passwordHash: secretariaPasswordHash,
    role: "SECRETARIA",
    active: true,
  });

  // Criar cliente para a secretária (caso necessário)
  let clienteJaqueline = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "821.646.905-59" },
  });

  if (clienteJaqueline) {
    clienteJaqueline = await prisma.cliente.update({
      where: { id: clienteJaqueline.id },
      data: {
        nome: "Jaqueline Cruz Santana",
        email: "souzacostaadv@hotmail.com",
        telefone: "+55 71 98734-3180",
        celular: "+55 71 98734-3180",
      },
    });
  } else {
    clienteJaqueline = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "FISICA",
        nome: "Jaqueline Cruz Santana",
        documento: "821.646.905-59",
        email: "souzacostaadv@hotmail.com",
        telefone: "+55 71 98734-3180",
        celular: "+55 71 98734-3180",
      },
    });
  }

  const robsonUser = await ensureUsuario(prisma, tenant.id, "magiclawyersaas@gmail.com", {
    firstName: "Robson José",
    lastName: "Nonato Filho",
    passwordHash: robsonPasswordHash,
    role: "CLIENTE",
    active: true,
  });

  const lucianoUser = await ensureUsuario(prisma, tenant.id, "luciano.santos@adv.br", {
    firstName: "Luciano",
    lastName: "de Sousa Santos",
    passwordHash: lucianoPasswordHash,
    role: "ADVOGADO",
    active: true,
    cpf: "630.479.425-87",
  });

  await prisma.advogado.upsert({
    where: { usuarioId: lucianoUser.id },
    update: {
      oabNumero: "69211",
      oabUf: "BA",
      especialidades: ["CIVIL"],
    },
    create: {
      tenantId: tenant.id,
      usuarioId: lucianoUser.id,
      oabNumero: "69211",
      oabUf: "BA",
      especialidades: ["CIVIL"],
    },
  });

  let clienteRobson = await prisma.cliente.findFirst({
    where: { tenantId: tenant.id, documento: "083.620.235-03" },
  });

  if (clienteRobson) {
    clienteRobson = await prisma.cliente.update({
      where: { id: clienteRobson.id },
      data: {
        nome: "Robson José Santos Nonato Filho",
        email: "magiclawyersaas@gmail.com",
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
        email: "magiclawyersaas@gmail.com",
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
  const baseDistribuicaoPlanilhas = new Date("2024-11-01T10:00:00-03:00").getTime();
  let processosPlanilhaImportados = 0;

  async function importarProcessosPlanilha(processos, options) {
    if (!Array.isArray(processos) || processos.length === 0) {
      return;
    }

    for (const processoLinha of processos) {
      if (!processoLinha?.numero || !processoLinha?.autor) continue;

      const cliente = await getOrCreateClienteFromPlanilha(processoLinha.autor);
      if (!cliente) continue;

      await vincularClienteAdvogado(
        cliente.id,
        options.advogadoId,
        `Cliente importado (${options.tag})`,
      );

      const numero = processoLinha.numero;
      const partesDescricao = processoLinha.reu
        ? `${processoLinha.autor} move demanda contra ${processoLinha.reu}`
        : `${processoLinha.autor} possui processo acompanhado pelo escritório`;

      const processoData = {
        tenantId: tenant.id,
        numero,
        numeroCnj: numero,
        titulo: `${options.etiquetaTitulo ?? "Processo"} - ${processoLinha.autor}${
          processoLinha.reu ? ` x ${processoLinha.reu}` : ""
        }`,
        descricao: `${partesDescricao}. Origem: ${options.fonteDescricao}.`,
        status: "EM_ANDAMENTO",
        grau: "PRIMEIRO",
        fase: "INSTRUCAO",
        areaId: options.areaId ?? null,
        classeProcessual:
          processoLinha.classe || processoLinha.acao || options.classePadrao || null,
        orgaoJulgador: options.orgaoJulgador || null,
        vara: buildVaraDescricao(processoLinha.vara, options.varaSuffix),
        comarca: options.comarcaPadrao || "Salvador/BA",
        foro: options.foroPadrao || null,
        segredoJustica: false,
        dataDistribuicao: new Date(
          baseDistribuicaoPlanilhas + processosPlanilhaImportados * 86400000,
        ),
        clienteId: cliente.id,
        advogadoResponsavelId: options.advogadoId,
        tags: ["planilha", options.tag],
      };

      processosPlanilhaImportados += 1;

      await prisma.processo.upsert({
        where: {
          tenantId_numero: {
            tenantId: tenant.id,
            numero,
          },
        },
        update: processoData,
        create: processoData,
      });
    }
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

  console.log("📑 Importando processos reais das planilhas da Dra. Sandra...");
  await importarProcessosPlanilha(processosJusticaTrabalho, {
    tag: "justica_trabalho",
    fonteDescricao: "Planilha Justiça do Trabalho (PJe)",
    etiquetaTitulo: "Reclamação Trabalhista",
    advogadoId: advogadoSandra.id,
    areaId: areaTrabalhista?.id ?? null,
    varaSuffix: "Vara do Trabalho da Bahia",
    comarcaPadrao: "Salvador/BA",
    foroPadrao: "TRT da 5ª Região",
    orgaoJulgador: "Tribunal Regional do Trabalho da 5ª Região",
  });

  await importarProcessosPlanilha(processosProjudi, {
    tag: "projudi_trt",
    fonteDescricao: "Planilha PROJUDI/TRT",
    etiquetaTitulo: "Processo PROJUDI",
    advogadoId: advogadoSandra.id,
    areaId: areaTrabalhista?.id ?? null,
    varaSuffix: "Vara do Trabalho da Bahia",
    comarcaPadrao: "Salvador/BA",
    foroPadrao: "TRT da 5ª Região (PROJUDI)",
    orgaoJulgador: "Tribunal Regional do Trabalho da 5ª Região",
  });

  await importarProcessosPlanilha(processosForum, {
    tag: "forum_estadual",
    fonteDescricao: "Planilha Fórum Estadual",
    etiquetaTitulo: "Processo Cível",
    advogadoId: advogadoSandra.id,
    areaId: areaCivel?.id ?? null,
    varaSuffix: "Vara Cível da Comarca de Salvador/BA",
    comarcaPadrao: "Salvador/BA",
    foroPadrao: "Tribunal de Justiça da Bahia",
    orgaoJulgador: "Tribunal de Justiça do Estado da Bahia",
    classePadrao: "Procedimento Comum Cível",
  });
  console.log("✅ Processos das planilhas importados.");

  const processoPartesConfigs = [
    {
      id: "procparte-guarda-autor-robson",
      processoId: processoGuarda.id,
      tipoPolo: "AUTOR",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      email: "magiclawyersaas@gmail.com",
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
      email: "magiclawyersaas@gmail.com",
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
      email: "magiclawyersaas@gmail.com",
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
    arquivoUrl: null,
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

  // Documentos reais do Robson (armazenados em public/docs/sandra para dev/vercel sem Cloudinary)
  const documentosRobson = [
    {
      id: "doc-robson-contrato",
      nome: "Contrato de Honorários - Robson.pdf",
      url: "/docs/sandra/CONTRATO_DE_HONORARIOS_2.pdf",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      origem: "ESCRITORIO",
      processo: null,
    },
    {
      id: "doc-robson-guarda",
      nome: "Processo 8154973-16.2024.8.05.0001 - Guarda de Família.pdf",
      url: "/docs/sandra/PROCESSO_8154973_guarda.pdf",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      origem: "ESCRITORIO",
      processo: processoGuarda,
    },
    {
      id: "doc-robson-uniao",
      nome: "Processo 8155658-23.2024.8.05.0001 - União Estável.pdf",
      url: "/docs/sandra/PROCESSO_8155658_uniao_estavel.pdf",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      origem: "ESCRITORIO",
      processo: processoUniao,
    },
    {
      id: "doc-robson-medidas",
      nome: "Processo 8155723-18.2024.8.05.0001 - Medidas Protetivas.pdf",
      url: "/docs/sandra/PROCESSO_8155723_medidas_protetivas.pdf",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      origem: "ESCRITORIO",
      processo: processoMedidas,
    },
    {
      id: "doc-robson-procuracao",
      nome: "Procuração Robson assinada.pdf",
      url: "/docs/sandra/PROCURACAO_ROBSON_assinado.pdf",
      contentType: "application/pdf",
      tamanhoBytes: 250000,
      origem: "ESCRITORIO",
      processo: null,
    },
  ];

  for (const doc of documentosRobson) {
    const documento = await prisma.documento.upsert({
      where: { id: doc.id },
      update: {
        nome: doc.nome,
        url: doc.url,
        contentType: doc.contentType,
        tamanhoBytes: doc.tamanhoBytes,
        clienteId: clienteRobson.id,
        origem: doc.origem,
        visivelParaCliente: true,
        visivelParaEquipe: true,
      },
      create: {
        id: doc.id,
        tenantId: tenant.id,
        nome: doc.nome,
        url: doc.url,
        contentType: doc.contentType,
        tamanhoBytes: doc.tamanhoBytes,
        clienteId: clienteRobson.id,
        origem: doc.origem,
        visivelParaCliente: true,
        visivelParaEquipe: true,
      },
    });

    if (doc.processo) {
      await prisma.processoDocumento.upsert({
        where: {
          processoId_documentoId: {
            processoId: doc.processo.id,
            documentoId: documento.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          processoId: doc.processo.id,
          documentoId: documento.id,
          visivelParaCliente: true,
        },
      });
    }
  }

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
      logradouro: "Av. Luis Viana Filho",
      numero: "006462",
      complemento: "Edif. Manhattan Square Wall Street East, Torre A, Sala 1202",
      bairro: "Patamares",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      pais: "Brasil",
      telefone: "+55 71 98734-3180",
      usuarioId: adminUser.id,
    },
    create: {
      tenantId: tenant.id,
      apelido: "Wall Street - Sandra",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "Av. Luis Viana Filho",
      numero: "006462",
      complemento: "Edif. Manhattan Square Wall Street East, Torre A, Sala 1202",
      bairro: "Patamares",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      pais: "Brasil",
      telefone: "+55 71 98734-3180",
      usuarioId: adminUser.id,
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

  console.log("\n📋 Credenciais de teste - Souza Costa Advogados Associados:");
  console.log("👑 ADMIN: sandra@adv.br / Sandra@123");
  console.log("🗂️ SECRETARIA: souzacostaadv@hotmail.com / Funcionario@123");
  console.log("👤 CLIENTE: magiclawyersaas@gmail.com / Robson123!");
  console.log("⚖️ ADVOGADO: luciano.santos@adv.br / Luciano@123");
  console.log("\n🔗 Acesso: http://localhost:9192/login");
  console.log("🏢 Slug do tenant: sandra");

  console.log("Seed tenant Sandra: OK");
}

module.exports = { seedTenantSandra };
