async function seedAuditLogs(prisma, superAdminId) {
  console.log("\n🕵️  Gerando logs de auditoria...\n");

  try {
    await prisma.superAdminAuditLog.deleteMany({});
    await prisma.auditLog.deleteMany({});

    const [superAdmin, tenants, juizes, pacotes] = await Promise.all([
      prisma.superAdmin.findUnique({
        where: { id: superAdminId },
      }),
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
      prisma.juiz.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nome: true,
          comarca: true,
        },
      }),
      prisma.pacoteJuiz.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nome: true,
          status: true,
        },
      }),
    ]);

    const tenantPorSlug = Object.fromEntries(
      tenants.map((tenant) => [tenant.slug, tenant]),
    );

    const sandraTenant = tenantPorSlug["sandra"];
    const salbaTenant = tenantPorSlug["salba-advocacia"] ?? tenants[1];

    const [sandraAdmin, salbaAdmin] = await Promise.all([
      sandraTenant
        ? prisma.usuario.findFirst({
            where: { tenantId: sandraTenant.id, role: "ADMIN" },
          })
        : null,
      salbaTenant
        ? prisma.usuario.findFirst({
            where: {
              tenantId: salbaTenant.id,
              role: {
                in: ["ADMIN", "ADVOGADO"],
              },
            },
          })
        : null,
    ]);

    const primeiroJuiz = juizes[0];
    const juizPremium = juizes.find((juiz) => juiz.id !== primeiroJuiz?.id);
    const primeiroPacote = pacotes[0];

    const superAdminLogs = [
      {
        acao: "CREATE_SYSTEM",
        entidade: "SYSTEM",
        dadosNovos: {
          message: "Sistema Magic Lawyer inicializado",
          superAdmin: superAdmin?.email,
        },
        ipAddress: "127.0.0.1",
        userAgent: "Seed Script",
      },
      primeiroJuiz
        ? {
            acao: "CREATE_JUIZ_GLOBAL",
            entidade: "JUIZ",
            entidadeId: primeiroJuiz.id,
            dadosNovos: {
              nome: primeiroJuiz.nome,
              comarca: primeiroJuiz.comarca,
              origem: "seed",
            },
            ipAddress: "189.12.54.10",
            userAgent: "MagicAdmin/1.0",
          }
        : null,
      primeiroPacote
        ? {
            acao: "UPDATE_PACOTE_JUIZ",
            entidade: "PACOTE_JUIZ",
            entidadeId: primeiroPacote.id,
            dadosAntigos: {
              status: "INATIVO",
            },
            dadosNovos: {
              status: primeiroPacote.status,
            },
            ipAddress: "189.12.54.10",
            userAgent: "MagicAdmin/1.0",
          }
        : null,
    ].filter(Boolean);

    for (const log of superAdminLogs) {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId,
          acao: log.acao,
          entidade: log.entidade,
          entidadeId: log.entidadeId ?? null,
          dadosAntigos: log.dadosAntigos ?? null,
          dadosNovos: log.dadosNovos ?? null,
          ipAddress: log.ipAddress ?? null,
          userAgent: log.userAgent ?? null,
        },
      });
    }

    const agora = new Date();
    const cincoMin = 5 * 60 * 1000;

    const tenantLogs = [
      sandraTenant && sandraAdmin
        ? {
            tenantId: sandraTenant.id,
            usuarioId: sandraAdmin.id,
            acao: "UPDATE_PROCESSO",
            entidade: "PROCESSO",
            entidadeId: "PROC-2024-0001",
            dados: {
              status: "EM_ANDAMENTO",
              prioridade: "ALTA",
            },
            previousValues: {
              status: "ANALISE",
              prioridade: "MEDIA",
            },
            changedFields: ["status", "prioridade"],
            ip: "201.55.100.12",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1)",
            createdAt: new Date(agora.getTime() - cincoMin * 3),
          }
        : null,
      sandraTenant
        ? {
            tenantId: sandraTenant.id,
            usuarioId: sandraAdmin?.id ?? null,
            acao: "CREATE_DOCUMENTO",
            entidade: "DOCUMENTO",
            entidadeId: "DOC-2024-INV-001",
            dados: {
              tipo: "CONTRATO",
              titulo: "Contrato de Prestação de Serviços",
            },
            previousValues: null,
            changedFields: ["titulo", "tipo"],
            ip: "201.55.100.12",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1)",
            createdAt: new Date(agora.getTime() - cincoMin * 2),
          }
        : null,
      salbaTenant && salbaAdmin
        ? {
            tenantId: salbaTenant.id,
            usuarioId: salbaAdmin.id,
            acao: "DELETE_PRAZO",
            entidade: "PRAZO_PROCESSUAL",
            entidadeId: "PRAZO-8891",
            dados: null,
            previousValues: {
              titulo: "Apresentar contestação",
              dataLimite: "2024-03-22",
            },
            changedFields: ["deletedAt"],
            ip: "187.45.100.45",
            userAgent: "MagicLawyer/tenant-portal",
            createdAt: new Date(agora.getTime() - cincoMin),
          }
        : null,
      sandraTenant && juizPremium
        ? {
            tenantId: sandraTenant.id,
            usuarioId: sandraAdmin?.id ?? null,
            acao: "ADD_JUIZ_FAVORITO",
            entidade: "FAVORITO_JUIZ",
            entidadeId: juizPremium.id,
            dados: {
              juizId: juizPremium.id,
            },
            previousValues: null,
            changedFields: ["juizId"],
            ip: "201.55.100.12",
            userAgent: "MagicLawyer/mobile",
            createdAt: agora,
          }
        : null,
    ].filter(Boolean);

    for (const log of tenantLogs) {
      await prisma.auditLog.create({
        data: {
          tenantId: log.tenantId,
          usuarioId: log.usuarioId,
          acao: log.acao,
          entidade: log.entidade,
          entidadeId: log.entidadeId,
          dados: log.dados,
          previousValues: log.previousValues,
          changedFields: log.changedFields ?? [],
          ip: log.ip,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        },
      });
    }

    console.log("✅ Logs de auditoria gerados com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro ao gerar logs de auditoria:", error);
    throw error;
  }
}

module.exports = { seedAuditLogs };
