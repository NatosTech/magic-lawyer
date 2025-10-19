module.exports = async function seedPlanos(prisma) {
  console.log("🌱 Iniciando seed de planos...");

  try {
    // Planos padrão do Magic Lawyer
    const planos = [
      {
        nome: "Básico",
        slug: "basico",
        descricao: "Plano ideal para escritórios pequenos e advogados autônomos",
        valorMensal: 99.0,
        valorAnual: 990.0,
        limiteUsuarios: 3,
        limiteProcessos: 50,
        limiteStorageMb: 1000,
        recursos: {
          features: ["Gestão de clientes e processos", "Sistema de tarefas básico", "Agenda de eventos", "Contratos e procurações", "Relatórios básicos", "Suporte por email"],
          integracoes: ["Google Calendar", "ViaCEP", "IBGE", "ReceitaWS"],
          limites: {
            usuarios: 3,
            processos: 50,
            contratos: 100,
            documentos: 500,
          },
        },
        periodoTeste: 14,
        ativo: true,
      },
      {
        nome: "Pro",
        slug: "pro",
        descricao: "Plano completo para escritórios em crescimento",
        valorMensal: 299.0,
        valorAnual: 2990.0,
        limiteUsuarios: 10,
        limiteProcessos: 200,
        limiteStorageMb: 5000,
        recursos: {
          features: [
            "Tudo do plano Básico",
            "Sistema de tarefas avançado com Kanban",
            "Dashboard financeiro completo",
            "Sistema de honorários",
            "Relatórios avançados",
            "Integração com Asaas",
            "Suporte prioritário",
          ],
          integracoes: ["Google Calendar", "ViaCEP", "IBGE", "ReceitaWS", "Asaas (Pagamentos)", "ClickSign (Assinaturas)"],
          limites: {
            usuarios: 10,
            processos: 200,
            contratos: 500,
            documentos: 2000,
          },
        },
        periodoTeste: 14,
        ativo: true,
      },
      {
        nome: "Enterprise",
        slug: "enterprise",
        descricao: "Plano premium para grandes escritórios e redes",
        valorMensal: 499.0,
        valorAnual: 4990.0,
        limiteUsuarios: 50,
        limiteProcessos: 1000,
        limiteStorageMb: 20000,
        recursos: {
          features: [
            "Tudo do plano Pro",
            "Usuários ilimitados",
            "Processos ilimitados",
            "API personalizada",
            "Integrações customizadas",
            "Relatórios personalizados",
            "Suporte dedicado",
            "Treinamento personalizado",
          ],
          integracoes: ["Google Calendar", "ViaCEP", "IBGE", "ReceitaWS", "Asaas (Pagamentos)", "ClickSign (Assinaturas)", "PJe (Processos)", "eProc (Processos)", "Projudi (Processos)"],
          limites: {
            usuarios: 50,
            processos: 1000,
            contratos: 2000,
            documentos: 10000,
          },
        },
        periodoTeste: 14,
        ativo: true,
      },
    ];

    // Criar planos
    for (const planoData of planos) {
      const plano = await prisma.plano.upsert({
        where: {
          slug: planoData.slug,
        },
        update: {
          ...planoData,
          updatedAt: new Date(),
        },
        create: planoData,
      });

      console.log(`✅ Plano "${plano.nome}" criado/atualizado (ID: ${plano.id})`);
    }

    console.log("🎉 Seed de planos concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed de planos:", error);
    throw error;
  }
};
