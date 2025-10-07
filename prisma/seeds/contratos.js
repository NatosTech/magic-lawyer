const bcrypt = require("bcryptjs");

async function seedContratos(prisma, Prisma) {
  console.log("🌱 Seeding contratos, processos, procurações e eventos...");

  // Buscar tenants existentes
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    include: {
      usuarios: {
        where: { role: "ADMIN" },
        take: 1,
      },
    },
  });

  if (tenants.length === 0) {
    console.log("❌ Nenhum tenant encontrado. Execute os seeds de tenants primeiro.");
    return;
  }

  for (const tenant of tenants) {
    console.log(`📋 Processando tenant: ${tenant.name}`);

    // Buscar clientes do tenant
    const clientes = await prisma.cliente.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
    });

    if (clientes.length === 0) {
      console.log(`⚠️  Nenhum cliente encontrado para ${tenant.name}`);
      continue;
    }

    // Buscar advogados do tenant
    const advogados = await prisma.advogado.findMany({
      where: { tenantId: tenant.id },
    });

    if (advogados.length === 0) {
      console.log(`⚠️  Nenhum advogado encontrado para ${tenant.name}`);
      continue;
    }

    // 0. CRIAR MAIS CLIENTES ALEATÓRIOS
    console.log(`👥 Criando clientes adicionais para ${tenant.name}...`);
    const novosClientes = [];

    const nomesClientes = [
      "Carlos Eduardo Mendes",
      "Patricia Silva Santos",
      "Roberto Oliveira Costa",
      "Fernanda Lima Rodrigues",
      "Antonio Carlos Pereira",
      "Juliana Martins Souza",
      "Rafael Barbosa Alves",
      "Camila Ferreira Gomes",
      "Diego Santos Rocha",
      "Larissa Costa Nunes",
      "Gabriel Oliveira Lima",
      "Beatriz Silva Castro",
      "Lucas Rodrigues Pereira",
      "Mariana Santos Almeida",
      "Thiago Costa Mendes",
      "Amanda Lima Barbosa",
      "Bruno Silva Gomes",
      "Carolina Santos Rocha",
      "Felipe Costa Nunes",
      "Isabela Lima Castro",
      "João Silva Almeida",
      "Luciana Santos Mendes",
      "Marcos Costa Barbosa",
      "Natália Lima Gomes",
    ];

    const empresas = [
      "Tech Solutions Ltda",
      "Consultoria Empresarial S.A.",
      "Indústria Moderna Ltda",
      "Serviços Digitais S.A.",
      "Comércio Nacional Ltda",
      "Engenharia Avançada S.A.",
      "Logística Integrada Ltda",
      "Marketing Criativo S.A.",
      "Construções Urbanas Ltda",
      "Tecnologia Inovadora S.A.",
      "Agronegócios Unidos Ltda",
      "Saúde Digital S.A.",
    ];

    for (let i = 0; i < 15; i++) {
      const isPessoaJuridica = Math.random() > 0.6; // 40% PJ, 60% PF
      const nome = isPessoaJuridica ? empresas[i % empresas.length] : nomesClientes[i % nomesClientes.length];
      const email = isPessoaJuridica
        ? `contato@${nome
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z]/g, "")}.com.br`
        : `${nome.toLowerCase().replace(/\s+/g, ".")}@email.com`;

      const cliente = await prisma.cliente.create({
        data: {
          tenantId: tenant.id,
          tipoPessoa: isPessoaJuridica ? "JURIDICA" : "FISICA",
          nome: nome,
          documento: isPessoaJuridica
            ? `${String(Math.floor(Math.random() * 90000000) + 10000000)}/0001-${String(Math.floor(Math.random() * 90) + 10)}`
            : `${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
          email: email,
          telefone: `+55 11 ${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          celular: `+55 11 9${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          observacoes: `Cliente criado automaticamente - ${isPessoaJuridica ? "Pessoa Jurídica" : "Pessoa Física"}`,
        },
      });

      novosClientes.push(cliente);

      // Vincular cliente a advogado aleatório
      const advogadoAleatorio = advogados[Math.floor(Math.random() * advogados.length)];
      await prisma.advogadoCliente.create({
        data: {
          tenantId: tenant.id,
          advogadoId: advogadoAleatorio.id,
          clienteId: cliente.id,
          relacionamento: ["TITULAR", "SUBSTITUTO", "COLABORADOR"][Math.floor(Math.random() * 3)],
        },
      });
    }

    // Combinar clientes existentes com novos
    const todosClientes = [...clientes, ...novosClientes];
    console.log(`✅ ${novosClientes.length} novos clientes criados e vinculados a advogados`);

    // Buscar áreas de processo
    const areas = await prisma.areaProcesso.findMany({
      where: { tenantId: tenant.id },
      take: 3,
    });

    // Buscar tribunais
    const tribunais = await prisma.tribunal.findMany({
      where: { tenantId: tenant.id },
      take: 2,
    });

    // Buscar juízes (juízes são globais, não por tenant)
    const juizes = await prisma.juiz.findMany({
      where: { status: "ATIVO" },
      take: 3,
    });

    // 1. CRIAR PROCESSOS DIVERSIFICADOS
    console.log(`📁 Criando processos diversificados para ${tenant.name}...`);
    const processos = [];

    const tiposProcesso = [
      "Ação de Cobrança",
      "Ação Trabalhista",
      "Ação de Divórcio",
      "Ação Criminal",
      "Ação de Indenização",
      "Ação de Alimentos",
      "Ação de Inventário",
      "Ação de Usucapião",
      "Mandado de Segurança",
      "Habeas Corpus",
      "Ação de Consignação",
      "Ação de Despejo",
      "Ação de Revisão",
      "Ação de Rescisão",
      "Ação de Nulidade",
      "Ação de Anulação",
    ];

    const comarcas = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Brasília", "Salvador", "Recife", "Fortaleza"];
    const varas = ["1ª Vara Cível", "2ª Vara Cível", "1ª Vara Criminal", "2ª Vara Criminal", "Vara do Trabalho", "Vara da Família"];

    for (let i = 0; i < 25; i++) {
      const cliente = todosClientes[Math.floor(Math.random() * todosClientes.length)];
      const advogado = advogados[Math.floor(Math.random() * advogados.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const tribunal = tribunais[Math.floor(Math.random() * tribunais.length)];
      const juiz = juizes[Math.floor(Math.random() * juizes.length)];
      const tipoProcesso = tiposProcesso[Math.floor(Math.random() * tiposProcesso.length)];

      const numeroProcesso = `${String(i + 1).padStart(7, "0")}-${String(Math.floor(Math.random() * 100)).padStart(2, "0")}.${new Date().getFullYear()}.8.26.${String(Math.floor(Math.random() * 1000) + 100).padStart(3, "0")}`;

      const processo = await prisma.processo.create({
        data: {
          tenantId: tenant.id,
          numero: numeroProcesso,
          titulo: `${tipoProcesso} - ${cliente.nome}`,
          status: ["EM_ANDAMENTO", "RASCUNHO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"][Math.floor(Math.random() * 5)],
          valorCausa: Math.floor(Math.random() * 500000) + 5000,
          dataDistribuicao: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000), // Últimos 2 anos
          prazoPrincipal: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Próximo ano
          clienteId: cliente.id,
          advogadoResponsavelId: advogado.id,
          areaId: area?.id,
          tribunalId: tribunal?.id,
          juizId: juiz?.id,
          comarca: comarcas[Math.floor(Math.random() * comarcas.length)],
          vara: varas[Math.floor(Math.random() * varas.length)],
          segredoJustica: Math.random() > 0.8, // 20% em segredo
        },
      });

      processos.push(processo);
    }

    // 2. CRIAR PROCURAÇÕES DIVERSIFICADAS
    console.log(`📜 Criando procurações diversificadas para ${tenant.name}...`);
    const procuracoes = [];

    for (let i = 0; i < 15; i++) {
      const cliente = todosClientes[Math.floor(Math.random() * todosClientes.length)];
      const processo = processos[Math.floor(Math.random() * processos.length)];

      const procuracao = await prisma.procuracao.create({
        data: {
          tenantId: tenant.id,
          clienteId: cliente.id,
          numero: `PROC-${String(i + 1).padStart(4, "0")}-${new Date().getFullYear()}`,
          observacoes: `Procuração para ${cliente.nome} - ${processo.titulo}`,
          emitidaEm: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          validaAte: new Date(Date.now() + Math.random() * 730 * 24 * 60 * 60 * 1000), // 2 anos
          ativa: Math.random() > 0.2, // 80% ativas
          status: Math.random() > 0.2 ? "VIGENTE" : ["REVOGADA", "EXPIRADA"][Math.floor(Math.random() * 2)],
          emitidaPor: ["ESCRITORIO", "ADVOGADO"][Math.floor(Math.random() * 2)],
          createdById: tenant.usuarios[0]?.id,
        },
      });

      procuracoes.push(procuracao);

      // Vincular procuração a processo (apenas as ativas)
      if (procuracao.ativa && procuracao.status === "VIGENTE") {
        await prisma.procuracaoProcesso.create({
          data: {
            tenantId: tenant.id,
            procuracaoId: procuracao.id,
            processoId: processo.id,
          },
        });

        // Vincular advogados à procuração (múltiplos advogados por procuração)
        const numAdvogados = Math.floor(Math.random() * 3) + 1; // 1-3 advogados por procuração
        const advogadosSelecionados = advogados.sort(() => 0.5 - Math.random()).slice(0, numAdvogados);

        for (const advogado of advogadosSelecionados) {
          await prisma.procuracaoAdvogado.create({
            data: {
              tenantId: tenant.id,
              procuracaoId: procuracao.id,
              advogadoId: advogado.id,
            },
          });
        }
      }
    }

    // 3. CRIAR CONTRATOS DIVERSIFICADOS
    console.log(`📄 Criando contratos diversificados para ${tenant.name}...`);

    const tiposContrato = [
      "Contrato de Prestação de Serviços Jurídicos",
      "Contrato de Consultoria Empresarial",
      "Contrato de Defesa Criminal",
      "Contrato de Direito Civil",
      "Contrato de Direito Trabalhista",
      "Contrato de Direito Tributário",
      "Contrato de Direito de Família",
      "Contrato de Direito Empresarial",
      "Contrato de Direito Imobiliário",
      "Contrato de Direito Previdenciário",
      "Contrato de Direito Administrativo",
      "Contrato de Direito Constitucional",
    ];

    for (let i = 0; i < 20; i++) {
      const cliente = todosClientes[Math.floor(Math.random() * todosClientes.length)];
      const advogado = advogados[Math.floor(Math.random() * advogados.length)];
      const processo = processos[Math.floor(Math.random() * processos.length)];
      const procuracao = procuracoes[Math.floor(Math.random() * procuracoes.length)];

      const valor = Math.floor(Math.random() * 100000) + 2000;
      const dataInicio = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const dataFim = new Date(dataInicio.getTime() + Math.random() * 730 * 24 * 60 * 60 * 1000);

      const contrato = await prisma.contrato.create({
        data: {
          tenantId: tenant.id,
          clienteId: cliente.id,
          titulo: tiposContrato[Math.floor(Math.random() * tiposContrato.length)],
          status: ["ATIVO", "RASCUNHO", "ENCERRADO", "CANCELADO", "SUSPENSO"][Math.floor(Math.random() * 5)],
          valor: valor,
          moeda: "BRL",
          comissaoAdvogado: Math.floor(Math.random() * 25) + 5, // 5-30%
          percentualAcaoGanha: Math.floor(Math.random() * 20) + 5, // 5-25%
          valorAcaoGanha: Math.floor(valor * (Math.random() * 0.2 + 0.05)), // 5-25% do valor
          dataInicio: dataInicio,
          dataFim: dataFim,
          dataAssinatura: Math.random() > 0.3 ? dataInicio : null, // 70% assinados
          resumo: `Contrato de ${tiposContrato[Math.floor(Math.random() * tiposContrato.length)].toLowerCase()} para ${cliente.nome}`,
          observacoes: `Contrato gerado automaticamente - ${new Date().toLocaleDateString()}`,
          processoId: Math.random() > 0.4 ? processo.id : null, // 60% com processo
          advogadoResponsavelId: advogado.id,
          criadoPorId: tenant.usuarios[0]?.id,
        },
      });

      // Se o contrato tem processo e há procuração disponível, vincular
      if (contrato.processoId && procuracao && procuracao.ativa) {
        // Verificar se a procuração está vinculada ao processo do contrato
        const procuracaoProcesso = await prisma.procuracaoProcesso.findFirst({
          where: {
            procuracaoId: procuracao.id,
            processoId: contrato.processoId,
          },
        });

        if (procuracaoProcesso) {
          console.log(`🔗 Contrato ${contrato.titulo} vinculado ao processo ${processo.numero} que tem procuração ${procuracao.numero}`);
        }
      }
    }

    // 4. CRIAR EVENTOS VINCULADOS A PROCESSOS
    console.log(`📅 Criando eventos vinculados a processos para ${tenant.name}...`);

    const tiposEvento = [
      "Audiência de Conciliação",
      "Audiência de Instrução",
      "Audiência de Julgamento",
      "Reunião com Cliente",
      "Consulta Jurídica",
      "Prazo para Contestação",
      "Prazo para Recurso",
      "Sessão de Mediação",
      "Conferência de Conciliação",
      "Diligência",
      "Perícia",
      "Depoimento",
      "Interrogatório",
      "Alegações Finais",
    ];

    for (let i = 0; i < 30; i++) {
      const processo = processos[Math.floor(Math.random() * processos.length)];
      const advogado = advogados[Math.floor(Math.random() * advogados.length)];
      const tipoEvento = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];

      const dataEvento = new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000); // Próximos 90 dias

      const evento = await prisma.evento.create({
        data: {
          tenantId: tenant.id,
          titulo: `${tipoEvento} - ${processo.titulo}`,
          descricao: `${tipoEvento} do processo ${processo.numero} - ${processo.cliente?.nome || "Cliente"}`,
          dataInicio: dataEvento,
          dataFim: new Date(dataEvento.getTime() + Math.random() * 4 * 60 * 60 * 1000), // 0-4 horas
          local: ["Fórum Central", "Vara Cível", "Vara Criminal", "Vara do Trabalho", "Online", "Escritório"][Math.floor(Math.random() * 6)],
          tipo: ["AUDIENCIA", "REUNIAO", "PRAZO", "CONSULTA", "LEMBRETE", "OUTRO"][Math.floor(Math.random() * 6)],
          status: ["AGENDADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "ADIADO"][Math.floor(Math.random() * 5)],
          processoId: processo.id,
          criadoPorId: tenant.usuarios[0]?.id,
          advogadoResponsavelId: advogado.id,
        },
      });

      // Criar participantes para o evento
      const emailsParticipantes = [advogado.usuario?.email, processo.cliente?.email].filter(Boolean);

      for (const email of emailsParticipantes) {
        await prisma.eventoParticipante.create({
          data: {
            tenantId: tenant.id,
            eventoId: evento.id,
            participanteEmail: email,
            participanteNome: email.includes("@") ? email.split("@")[0] : "Participante",
            status: ["CONFIRMADO", "PENDENTE", "REJEITADO"][Math.floor(Math.random() * 3)],
            confirmadoEm: Math.random() > 0.3 ? new Date() : null,
          },
        });
      }
    }

    console.log(`✅ Seed concluído para ${tenant.name}:`);
    console.log(`   👥 ${novosClientes.length} novos clientes criados`);
    console.log(`   📁 ${processos.length} processos diversificados criados`);
    console.log(`   📜 ${procuracoes.length} procurações criadas (${procuracoes.filter((p) => p.ativa).length} ativas)`);
    console.log(`   📄 20 contratos diversificados criados`);
    console.log(`   📅 30 eventos vinculados a processos criados`);
    console.log(`   🔗 Contratos vinculados a processos com procurações`);
    console.log(`   ⚠️  Cenários diversos para teste completo`);
  }

  console.log("🎉 Seed de contratos, processos e procurações concluído!");
}

module.exports = { seedContratos };
