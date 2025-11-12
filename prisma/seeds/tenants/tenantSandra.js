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
  const [adminPasswordHash, clientePasswordHash, robsonPasswordHash] = await Promise.all([
    bcrypt.hash("Sandra@123", 10),
    bcrypt.hash("Cliente@123", 10),
    bcrypt.hash("Robson123!", 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "sandra" },
    update: {
      name: "Sandra Advocacia",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
      documento: "94.342.253/0001-34",
      razaoSocial: "Sandra Quesia Sociedade Individual de Advocacia",
      nomeFantasia: "Sandra Advocacia",
      inscricaoMunicipal: null,
      inscricaoEstadual: null,
      email: "contato@sandraadv.br",
      telefone: "+55 71 4002-8922",
    },
    create: {
      name: "Sandra Advocacia",
      slug: "sandra",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      tipoPessoa: "JURIDICA",
      documento: "94.342.253/0001-34",
      razaoSocial: "Sandra Quesia Sociedade Individual de Advocacia",
      nomeFantasia: "Sandra Advocacia",
      inscricaoMunicipal: null,
      inscricaoEstadual: null,
      email: "contato@sandraadv.br",
      telefone: "+55 71 4002-8922",
    },
  });

  await prisma.tenantEndereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Wall Street Salvador",
      },
    },
    update: {
      tipo: "MATRIZ",
      principal: true,
      logradouro: "Av. Luis Viana Filho",
      numero: "006462",
      complemento: "Ed. Manhattan Square Wall Street East, Torre A, Sala 1202",
      bairro: "Patamares",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      pais: "Brasil",
      telefone: "+55 71 4002-8922",
    },
    create: {
      tenantId: tenant.id,
      apelido: "Wall Street Salvador",
      tipo: "MATRIZ",
      principal: true,
      logradouro: "Av. Luis Viana Filho",
      numero: "006462",
      complemento: "Ed. Manhattan Square Wall Street East, Torre A, Sala 1202",
      bairro: "Patamares",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      pais: "Brasil",
      telefone: "+55 71 4002-8922",
    },
  });

  const adminUser = await ensureUsuario(prisma, tenant.id, "sandra@adv.br", {
    firstName: "Sandra Quesia",
    lastName: "de Souza Costa Porto",
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
      especialidades: ["CIVIL", "CRIMINAL"],
      dataNascimento: new Date("1975-12-20T00:00:00-03:00"),
      documento: "94342253534",
      bio: "Atuação personalizada em Direito Civil e Criminal, com foco em causas de família e proteção de vítimas.",
    },
    create: {
      tenantId: tenant.id,
      usuarioId: adminUser.id,
      oabNumero: "19872",
      oabUf: "BA",
      especialidades: ["CIVIL", "CRIMINAL"],
      dataNascimento: new Date("1975-12-20T00:00:00-03:00"),
      documento: "94342253534",
      bio: "Atuação personalizada em Direito Civil e Criminal, com foco em causas de família e proteção de vítimas.",
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
      endereco: "Av. Luis Viana Filho, 006462, Torre A, Sala 1202",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      principal: true,
      observacoes: "Conta principal utilizada para honorários e depósitos judiciais.",
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
      endereco: "Av. Luis Viana Filho, 006462, Torre A, Sala 1202",
      cidade: "Salvador",
      estado: "BA",
      cep: "41680-400",
      principal: true,
      observacoes: "Conta principal utilizada para honorários e depósitos judiciais.",
    },
  });

  // Cliente Robson (único cliente ativo no seed)
  const robsonUser = await ensureUsuario(prisma, tenant.id, "magiclawyersaas@gmail.com", {
    firstName: "Robson José",
    lastName: "Santos Nonato Filho",
    passwordHash: robsonPasswordHash,
    role: "CLIENTE",
    active: true,
  });

  const clienteRobson = await prisma.cliente.upsert({
    where: { tenantId_documento: { tenantId: tenant.id, documento: "083.620.235-03" } },
    update: {
      nome: "Robson José Santos Nonato Filho",
      email: "magiclawyersaas@gmail.com",
      telefone: "+55 71 99010-1037",
      celular: "+55 71 99010-1037",
      usuarioId: robsonUser.id,
      dataNascimento: new Date("1997-08-17T00:00:00-03:00"),
      observacoes: "Cliente assistido diretamente pela Dra. Sandra; processos em segredo de justiça.",
    },
    create: {
      tenantId: tenant.id,
      tipoPessoa: "FISICA",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      email: "magiclawyersaas@gmail.com",
      telefone: "+55 71 99010-1037",
      celular: "+55 71 99010-1037",
      usuarioId: robsonUser.id,
      dataNascimento: new Date("1997-08-17T00:00:00-03:00"),
      observacoes: "Cliente assistido diretamente pela Dra. Sandra; processos em segredo de justiça.",
    },
  });

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

  const areaFamilia = await prisma.areaProcesso.findFirst({
    where: { tenantId: "GLOBAL", slug: "familia" },
  });
  const areaCriminal = await prisma.areaProcesso.findFirst({
    where: { tenantId: "GLOBAL", slug: "criminal" },
  });

  const processosSeed = [
    {
      numero: "8154973-16.2024.8.05.0001",
      titulo: "Guarda de Família - Filippo L. D. N.",
      descricao:
        "Ação de guarda ajuizada por Robson para restabelecer convivência com o filho Filippo. Tramita sob segredo de justiça.",
      areaId: areaFamilia?.id ?? null,
      vara: "1ª Vara de Família de Salvador/BA",
      comarca: "Salvador",
      foro: "1ª Vara de Família de Salvador/BA",
      valorCausa: new Prisma.Decimal(7920),
      dataDistribuicao: new Date("2024-10-23T10:00:00-03:00"),
      tags: ["guarda", "filippo", "liminar"],
    },
    {
      numero: "8155658-23.2024.8.05.0001",
      titulo: "Reconhecimento e Extinção de União Estável",
      descricao:
        "Demanda proposta por Tainá Domingos envolvendo partilha patrimonial e guarda compartilhada do menor.",
      areaId: areaFamilia?.id ?? null,
      vara: "8ª Vara de Família de Salvador/BA",
      comarca: "Salvador",
      foro: "8ª Vara de Família de Salvador/BA",
      valorCausa: new Prisma.Decimal(120040),
      dataDistribuicao: new Date("2024-10-24T11:00:00-03:00"),
      tags: ["uniao_estavel", "partilha"],
    },
    {
      numero: "8155723-18.2024.8.05.0001",
      titulo: "Medidas Protetivas - Lei Maria da Penha",
      descricao:
        "Procedimento criminal envolvendo medidas protetivas em desfavor de Robson. Acompanhamento prioritário.",
      areaId: areaCriminal?.id ?? null,
      vara: "5ª Vara de Violência Doméstica de Salvador/BA",
      comarca: "Salvador",
      foro: "5ª Vara de Violência Doméstica de Salvador/BA",
      valorCausa: new Prisma.Decimal(0),
      dataDistribuicao: new Date("2024-10-24T15:00:00-03:00"),
      tags: ["medidas_protetivas", "lei_maria_da_penha"],
    },
  ];

  const processos = [];

  for (const processoData of processosSeed) {
    const base = {
      status: "EM_ANDAMENTO",
      grau: "PRIMEIRO",
      fase: "INSTRUCAO",
      segredoJustica: true,
      clienteId: clienteRobson.id,
      advogadoResponsavelId: advogadoSandra.id,
      ...processoData,
    };

    const existing = await prisma.processo.findFirst({
      where: { tenantId: tenant.id, numero: processoData.numero },
    });

    if (existing) {
      processos.push(
        await prisma.processo.update({
          where: { id: existing.id },
          data: base,
        }),
      );
    } else {
      processos.push(
        await prisma.processo.create({
          data: {
            tenantId: tenant.id,
            ...base,
          },
        }),
      );
    }
  }

  const processoGuarda = processos.find((p) => p.numero === "8154973-16.2024.8.05.0001");
  const processoUniao = processos.find((p) => p.numero === "8155658-23.2024.8.05.0001");
  const processoMedidas = processos.find((p) => p.numero === "8155723-18.2024.8.05.0001");

  const partes = [
    {
      id: "robson-autor-guarda",
      processoId: processoGuarda?.id,
      tipoPolo: "AUTOR",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Pai e requerente da guarda do menor Filippo.",
    },
    {
      id: "taina-reu-guarda",
      processoId: processoGuarda?.id,
      tipoPolo: "REU",
      nome: "Tainá Luísa de Souza Domingos",
      observacoes: "Genitora do menor Filippo.",
    },
    {
      id: "robson-reu-uniao",
      processoId: processoUniao?.id,
      tipoPolo: "REU",
      nome: "Robson José Santos Nonato Filho",
      documento: "083.620.235-03",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Requerido na ação de reconhecimento de união estável.",
    },
    {
      id: "taina-autora-uniao",
      processoId: processoUniao?.id,
      tipoPolo: "AUTOR",
      nome: "Tainá Luísa de Souza Domingos",
    },
    {
      id: "robson-reu-medidas",
      processoId: processoMedidas?.id,
      tipoPolo: "REU",
      nome: "Robson José Santos Nonato Filho",
      clienteId: clienteRobson.id,
      advogadoId: advogadoSandra.id,
      papel: "Requerido nas medidas protetivas.",
    },
  ].filter((parte) => parte.processoId);

  for (const parte of partes) {
    await prisma.processoParte.upsert({
      where: { id: parte.id },
      update: parte,
      create: {
        tenantId: tenant.id,
        ...parte,
      },
    });
  }

  // Contrato de honorários e parcela vinculada ao Robson
  const contratoPrincipal = await prisma.contrato.upsert({
    where: { id: "contrato-robson-2025" },
    update: {
      tenantId: tenant.id,
      clienteId: clienteRobson.id,
      titulo: "Contrato de Honorários - Família & Criminal",
      status: "ATIVO",
      tipo: "HONORARIOS",
      valorTotal: new Prisma.Decimal(18000),
      dataAssinatura: new Date("2025-01-05T10:00:00-03:00"),
      descricao:
        "Contrato firmado para acompanhar guarda, união estável e medidas protetivas envolvendo Robson.",
    },
    create: {
      id: "contrato-robson-2025",
      tenantId: tenant.id,
      clienteId: clienteRobson.id,
      titulo: "Contrato de Honorários - Família & Criminal",
      status: "ATIVO",
      tipo: "HONORARIOS",
      valorTotal: new Prisma.Decimal(18000),
      dataAssinatura: new Date("2025-01-05T10:00:00-03:00"),
      descricao:
        "Contrato firmado para acompanhar guarda, união estável e medidas protetivas envolvendo Robson.",
    },
  });

  await prisma.parcela.upsert({
    where: { id: "parcela-robson-01" },
    update: {
      tenantId: tenant.id,
      contratoId: contratoPrincipal.id,
      valor: new Prisma.Decimal(6000),
      vencimento: new Date("2025-02-05T10:00:00-03:00"),
      status: "PAGO",
      dataPagamento: new Date("2025-02-04T14:10:00-03:00"),
    },
    create: {
      id: "parcela-robson-01",
      tenantId: tenant.id,
      contratoId: contratoPrincipal.id,
      valor: new Prisma.Decimal(6000),
      vencimento: new Date("2025-02-05T10:00:00-03:00"),
      status: "PAGO",
      dataPagamento: new Date("2025-02-04T14:10:00-03:00"),
    },
  });

  console.log("✅ Seed do tenant Sandra atualizado (foco exclusivo em Robson).");
}

module.exports = {
  seedTenantSandra,
};
