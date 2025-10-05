async function seedPacotesJuiz(superAdminId, prisma) {
  console.log("\n📦 Criando pacotes de juízes padrão...\n");

  try {
    // Buscar juízes disponíveis
    const juizes = await prisma.juiz.findMany({
      orderBy: { nome: "asc" },
    });

    if (juizes.length === 0) {
      console.log("⚠️  Nenhum juiz encontrado. Criando pacotes sem juízes.");
      return true;
    }

    // Pacotes de juízes padrão
    const pacotesData = [
      {
        nome: "Pacote Juízes Criminais",
        descricao: "Acesso completo aos dados de juízes especializados em direito criminal",
        preco: 199.9,
        moeda: "BRL",
        duracaoDias: null, // permanente
        limiteUsuarios: null, // todos os usuários do tenant
        limiteConsultas: 100, // 100 consultas por mês
        isPublico: true,
        status: "ATIVO",
        ordemExibicao: 1,
        cor: "danger",
        icone: "⚖️",
        superAdminId,
        juizesIds: juizes.filter((j) => j.especialidades.includes("CRIMINAL") || j.especialidades.includes("EXECUCAO_PENAL")).map((j) => j.id),
      },
      {
        nome: "Pacote Juízes Cíveis",
        descricao: "Dados de juízes especializados em direito civil e família",
        preco: 149.9,
        moeda: "BRL",
        duracaoDias: null,
        limiteUsuarios: null,
        limiteConsultas: 80,
        isPublico: true,
        status: "ATIVO",
        ordemExibicao: 2,
        cor: "primary",
        icone: "🏛️",
        superAdminId,
        juizesIds: juizes.filter((j) => j.especialidades.includes("CIVEL") || j.especialidades.includes("FAMILIA")).map((j) => j.id),
      },
      {
        nome: "Pacote Juízes Tributários",
        descricao: "Especialistas em direito tributário e administrativo",
        preco: 249.9,
        moeda: "BRL",
        duracaoDias: null,
        limiteUsuarios: null,
        limiteConsultas: 60,
        isPublico: true,
        status: "ATIVO",
        ordemExibicao: 3,
        cor: "warning",
        icone: "💰",
        superAdminId,
        juizesIds: juizes.filter((j) => j.especialidades.includes("TRIBUTARIO") || j.especialidades.includes("ADMINISTRATIVO")).map((j) => j.id),
      },
      {
        nome: "Pacote Completo - Todos os Juízes",
        descricao: "Acesso a todos os juízes disponíveis no sistema",
        preco: 399.9,
        moeda: "BRL",
        duracaoDias: null,
        limiteUsuarios: null,
        limiteConsultas: 200,
        isPublico: true,
        status: "ATIVO",
        ordemExibicao: 4,
        cor: "secondary",
        icone: "👑",
        superAdminId,
        juizesIds: juizes.map((j) => j.id), // todos os juízes
      },
    ];

    // Criar pacotes
    for (const pacoteData of pacotesData) {
      const { juizesIds, ...pacoteCreateData } = pacoteData;

      const pacote = await prisma.pacoteJuiz.upsert({
        where: {
          nome: pacoteData.nome,
        },
        update: {
          ...pacoteCreateData,
          updatedAt: new Date(),
        },
        create: pacoteCreateData,
      });

      console.log(`✅ Pacote criado: ${pacote.nome} - R$ ${pacote.preco}`);

      // Adicionar juízes ao pacote
      if (juizesIds && juizesIds.length > 0) {
        for (let i = 0; i < juizesIds.length; i++) {
          await prisma.pacoteJuizItem.upsert({
            where: {
              pacoteId_juizId: {
                pacoteId: pacote.id,
                juizId: juizesIds[i],
              },
            },
            update: {},
            create: {
              pacoteId: pacote.id,
              juizId: juizesIds[i],
              ordemExibicao: i,
            },
          });
        }
        console.log(`   📋 ${juizesIds.length} juízes adicionados ao pacote`);
      } else {
        console.log(`   ⚠️  Nenhum juiz foi adicionado ao pacote`);
      }
    }

    console.log(`\n✅ ${pacotesData.length} pacotes de juízes criados com sucesso!`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao criar pacotes de juízes:", error);
    throw error;
  }
}

module.exports = { seedPacotesJuiz };
