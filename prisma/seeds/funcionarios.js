const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Funcionario@123";

async function ensureCargo(prisma, tenantId, { nome, descricao, nivel }) {
  const existing = await prisma.cargo.findFirst({
    where: { tenantId, nome },
  });

  if (existing) {
    return existing;
  }

  return prisma.cargo.create({
    data: {
      tenantId,
      nome,
      descricao,
      nivel: nivel ?? 2,
      ativo: true,
    },
  });
}

async function ensureUsuarioFuncionario(prisma, tenantId, data) {
  const existing = await prisma.usuario.findFirst({
    where: {
      tenantId,
      email: data.email,
    },
  });

  if (existing) {
    return prisma.usuario.update({
      where: { id: existing.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        active: true,
      },
    });
  }

  const passwordHash = await bcrypt.hash(data.password || DEFAULT_PASSWORD, 10);

  return prisma.usuario.create({
    data: {
      tenantId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      active: true,
      createdById: data.createdById || null,
    },
  });
}

async function upsertFuncionarioPerfil(prisma, Prisma, usuario, cargo, perfil) {
  return prisma.funcionarioPerfil.upsert({
    where: { usuarioId: usuario.id },
    update: {
      tenantId: usuario.tenantId,
      cargoPrincipalId: cargo?.id || null,
      ...perfil,
      salarioBase: perfil.salarioBase ? new Prisma.Decimal(perfil.salarioBase) : null,
    },
    create: {
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      cargoPrincipalId: cargo?.id || null,
      ...perfil,
      salarioBase: perfil.salarioBase ? new Prisma.Decimal(perfil.salarioBase) : null,
    },
  });
}

async function replaceBeneficios(prisma, Prisma, funcionarioPerfil, beneficios = []) {
  await prisma.funcionarioBeneficio.deleteMany({
    where: {
      funcionarioId: funcionarioPerfil.id,
    },
  });

  if (!beneficios.length) {
    return;
  }

  await prisma.funcionarioBeneficio.createMany({
    data: beneficios.map((beneficio) => ({
      tenantId: funcionarioPerfil.tenantId,
      funcionarioId: funcionarioPerfil.id,
      tipo: beneficio.tipo,
      status: beneficio.status || "ATIVO",
      nome: beneficio.nome || null,
      valorBase: beneficio.valorBase ? new Prisma.Decimal(beneficio.valorBase) : null,
      contribuicaoEmpresa: beneficio.contribuicaoEmpresa ? new Prisma.Decimal(beneficio.contribuicaoEmpresa) : null,
      contribuicaoFuncionario: beneficio.contribuicaoFuncionario ? new Prisma.Decimal(beneficio.contribuicaoFuncionario) : null,
      dataInicio: beneficio.dataInicio || null,
      dataFim: beneficio.dataFim || null,
      observacoes: beneficio.observacoes || null,
    })),
  });
}

async function replaceDocumentos(prisma, funcionarioPerfil, documentos = []) {
  await prisma.funcionarioDocumento.deleteMany({
    where: {
      funcionarioId: funcionarioPerfil.id,
    },
  });

  if (!documentos.length) {
    return;
  }

  await prisma.funcionarioDocumento.createMany({
    data: documentos.map((documento) => ({
      tenantId: funcionarioPerfil.tenantId,
      funcionarioId: funcionarioPerfil.id,
      tipo: documento.tipo,
      titulo: documento.titulo,
      arquivoUrl: documento.arquivoUrl || null,
      emissao: documento.emissao || null,
      validade: documento.validade || null,
      numero: documento.numero || null,
      observacoes: documento.observacoes || null,
    })),
  });
}

async function linkCargo(prisma, usuario, cargo) {
  if (!cargo) return;

  const existing = await prisma.usuarioCargo.findFirst({
    where: {
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      cargoId: cargo.id,
      ativo: true,
    },
  });

  if (existing) {
    return;
  }

  // Inativar vínculos anteriores antes de criar o principal
  await prisma.usuarioCargo.updateMany({
    where: {
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      ativo: true,
    },
    data: {
      ativo: false,
      dataFim: new Date(),
    },
  });

  await prisma.usuarioCargo.create({
    data: {
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      cargoId: cargo.id,
      ativo: true,
      dataInicio: new Date(),
    },
  });
}

async function seedFuncionarios(prisma, Prisma) {
  console.log("   → Criando colaboradores de exemplo");

  const tenantMap = {};

  const tenants = await prisma.tenant.findMany({
    where: {
      slug: {
        in: ["sandra", "luana", "salba"],
      },
    },
  });

  tenants.forEach((tenant) => {
    tenantMap[tenant.slug] = tenant;
  });

  if (!tenantMap.sandra) {
    console.warn("⚠️ Tenant sandra não encontrado – pulando criação de Jaqueline.");
  }

  const funcionariosPorTenant = [
    {
      slug: "sandra",
      colaboradores: [
        {
          email: "jaqueline.souza@sandraadv.br",
          firstName: "Jaqueline",
          lastName: "Souza",
          phone: "+55 11 94000-1122",
          role: "SECRETARIA",
          cargo: {
            nome: "Secretária Executiva",
            descricao: "Responsável pela agenda e comunicação com clientes.",
            nivel: 2,
          },
          perfil: {
            status: "ATIVO",
            tipoContrato: "CLT",
            dataAdmissao: new Date("2022-03-01"),
            numeroCtps: "0123456",
            serieCtps: "SP-09",
            orgaoExpedidorCtps: "MTE/SP",
            pis: "123.4567.89-0",
            salarioBase: "3200.00",
            cargaHorariaSemanal: 40,
            possuiValeTransporte: true,
            possuiValeRefeicao: true,
            possuiPlanoSaude: true,
            observacoes: "Secretária dedicada da Dra. Sandra, cuida da recepção e das pautas.",
          },
          beneficios: [
            {
              tipo: "VALE_REFEICAO",
              nome: "VR Ticket",
              valorBase: "680.00",
            },
            {
              tipo: "PLANO_SAUDE",
              nome: "Plano Saúde Premium",
              observacoes: "Amil Empresarial",
            },
          ],
          documentos: [
            {
              tipo: "CONTRATO_TRABALHO",
              titulo: "Contrato CLT Jaqueline Souza",
              numero: "CTA-2022-03",
              emissao: new Date("2022-03-01"),
            },
            {
              tipo: "CARTEIRA_TRABALHO",
              titulo: "CTPS Digital Jaqueline Souza",
              numero: "0123456-SP",
            },
          ],
        },
      ],
    },
    {
      slug: "luana",
      colaboradores: [
        {
          email: "fernando.almeida@luanamorais.adv.br",
          firstName: "Fernando",
          lastName: "Almeida",
          phone: "+55 11 95555-3344",
          role: "FINANCEIRO",
          cargo: {
            nome: "Controller Financeiro",
            descricao: "Responsável por conciliação e relatórios financeiros.",
            nivel: 3,
          },
          perfil: {
            status: "ATIVO",
            tipoContrato: "PJ",
            dataAdmissao: new Date("2021-09-15"),
            salarioBase: "8500.00",
            cargaHorariaSemanal: 30,
            possuiPlanoSaude: true,
            observacoes: "Especialista em controladoria jurídica.",
          },
          beneficios: [
            {
              tipo: "AUXILIO_HOME_OFFICE",
              nome: "Auxílio Home Office",
              valorBase: "250.00",
            },
          ],
          documentos: [
            {
              tipo: "CONTRATO_TRABALHO",
              titulo: "Contrato PJ Fernando Almeida",
              emissao: new Date("2021-09-15"),
            },
          ],
        },
        {
          email: "melissa.prado@luanamorais.adv.br",
          firstName: "Melissa",
          lastName: "Prado",
          phone: "+55 11 97777-8899",
          role: "SECRETARIA",
          cargo: {
            nome: "Estagiária de Direito",
            descricao: "Auxilia na preparação de peças e audiências.",
            nivel: 1,
          },
          perfil: {
            status: "ATIVO",
            tipoContrato: "ESTAGIO",
            dataAdmissao: new Date("2023-02-01"),
            salarioBase: "1800.00",
            cargaHorariaSemanal: 30,
            possuiValeTransporte: true,
            possuiValeRefeicao: true,
            observacoes: "Rotina híbrida, acompanha audiências virtuais.",
          },
          beneficios: [
            {
              tipo: "VALE_TRANSPORTE",
              nome: "VT SPTrans",
            },
            {
              tipo: "VALE_REFEICAO",
              nome: "VR Alelo",
              valorBase: "480.00",
            },
          ],
          documentos: [
            {
              tipo: "CONTRATO_TRABALHO",
              titulo: "Termo de Estágio Melissa Prado",
              emissao: new Date("2023-02-01"),
            },
            {
              tipo: "EXAME_ADMISSIONAL",
              titulo: "ASO Admissional",
              emissao: new Date("2023-01-25"),
            },
          ],
        },
      ],
    },
    {
      slug: "salba",
      colaboradores: [
        {
          email: "rodrigo.menezes@salba.adv.br",
          firstName: "Rodrigo",
          lastName: "Menezes",
          phone: "+55 71 98888-6677",
          role: "SECRETARIA",
          cargo: {
            nome: "Analista de Operações",
            descricao: "Garante o fluxo de documentos e protocolos nos tribunais.",
            nivel: 2,
          },
          perfil: {
            status: "ATIVO",
            tipoContrato: "CLT",
            dataAdmissao: new Date("2020-11-03"),
            numeroCtps: "9988776",
            serieCtps: "BA-12",
            salarioBase: "4100.00",
            cargaHorariaSemanal: 44,
            possuiPlanoSaude: true,
            possuiValeRefeicao: true,
            observacoes: "Atua presencialmente na unidade de Salvador.",
          },
          beneficios: [
            {
              tipo: "VALE_REFEICAO",
              nome: "VR Sodexo",
              valorBase: "720.00",
            },
            {
              tipo: "PLANO_SAUDE",
              nome: "Plano Saúde Bradesco",
            },
            {
              tipo: "SEGURO_VIDA",
              nome: "Seguro Vida Coletivo",
            },
          ],
          documentos: [
            {
              tipo: "CONTRATO_TRABALHO",
              titulo: "Contrato CLT Rodrigo Menezes",
              emissao: new Date("2020-11-03"),
            },
            {
              tipo: "HOLERITE",
              titulo: "Holerite Dez/2023",
              emissao: new Date("2023-12-01"),
            },
          ],
        },
      ],
    },
  ];

  for (const tenantData of funcionariosPorTenant) {
    const tenant = tenantMap[tenantData.slug];
    if (!tenant) continue;

    for (const colaborador of tenantData.colaboradores) {
      const cargo = await ensureCargo(prisma, tenant.id, colaborador.cargo);
      const usuario = await ensureUsuarioFuncionario(prisma, tenant.id, colaborador);

      await linkCargo(prisma, usuario, cargo);

      const perfil = await upsertFuncionarioPerfil(prisma, Prisma, usuario, cargo, colaborador.perfil);
      await replaceBeneficios(prisma, Prisma, perfil, colaborador.beneficios);
      await replaceDocumentos(prisma, perfil, colaborador.documentos);
    }
  }

  console.log("      Funcionários de exemplo prontos.");
}

module.exports = { seedFuncionarios };
