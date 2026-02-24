const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

async function seedEventos() {
  console.log("🌱 Iniciando seed de eventos...");

  try {
    // Buscar tenant Sandra
    const tenantSandra = await prisma.tenant.findUnique({
      where: { slug: "sandra" },
    });

    if (!tenantSandra) {
      console.log("❌ Tenant Sandra não encontrado");
      return;
    }

    // Buscar usuários do tenant Sandra
    const usuarios = await prisma.usuario.findMany({
      where: { tenantId: tenantSandra.id },
      include: { advogado: true },
    });

    const sandra = usuarios.find((u) => u.email === "sandra@adv.br");
    const ricardo = usuarios.find((u) => u.email === "ricardo@sandraadv.br");
    const fernanda = usuarios.find((u) => u.email === "fernanda@sandraadv.br");

    // Buscar clientes
    const clientes = await prisma.cliente.findMany({
      where: { tenantId: tenantSandra.id },
    });

    const marcos = clientes.find((c) => c.nome === "Marcos Souza");
    const ana = clientes.find((c) => c.nome === "Ana Paula Oliveira");
    const inovaTech = clientes.find((c) => c.nome === "Inova Tech Ltda");
    const robsonCliente = clientes.find((c) => c.documento === "083.620.235-03" || c.nome === "Robson José Santos Nonato Filho");

    // Buscar processos
    const processos = await prisma.processo.findMany({
      where: { tenantId: tenantSandra.id },
    });

    const processoGuarda = processos.find((p) => p.numero === "8154973-16.2024.8.05.0001") ?? processos[0];
    const processoUniao = processos.find((p) => p.numero === "8155658-23.2024.8.05.0001") ?? processos[1];

    // Verificar se temos os dados necessários
    if (!processoGuarda || !processoUniao) {
      console.log("❌ Processos não encontrados. Criando processos de exemplo...");
      return;
    }

    if (!marcos || !ana || !inovaTech || !robsonCliente) {
      console.log("❌ Clientes não encontrados. Verifique o seed de clientes.");
      return;
    }

    if (!sandra?.advogado || !ricardo?.advogado || !fernanda?.advogado) {
      console.log("❌ Advogados não encontrados. Verifique o seed de usuários.");
      return;
    }

    // Criar eventos
    const eventos = [
      {
        tenantId: tenantSandra.id,
        titulo: "Audiência de Conciliação - Processo 1234567-89.2024.8.26.0001",
        descricao: "Audiência de conciliação para tentativa de acordo",
        tipo: "AUDIENCIA",
        dataInicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias no futuro
        dataFim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 horas
        local: "Fórum Central - Sala 101",
        participantes: ["cliente@sandraadv.br", "sandra@adv.br"],
        processoId: processoGuarda.id,
        clienteId: marcos.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 30,
        observacoes: "Levar documentos originais e cópias",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Reunião com Cliente - Ana Santos",
        descricao: "Discussão sobre estratégia do caso de divórcio",
        tipo: "REUNIAO",
        dataInicio: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 dia no futuro
        dataFim: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hora
        local: "Escritório - Sala de Reuniões",
        participantes: ["ana@sandraadv.br", "ricardo@sandraadv.br"],
        clienteId: ana.id,
        advogadoResponsavelId: ricardo.advogado.id,
        criadoPorId: ricardo.id,
        status: "CONFIRMADO",
        lembreteMinutos: 15,
        observacoes: "Cliente confirmou presença",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Consulta Jurídica - Inova Tech",
        descricao: "Primeira consulta sobre contrato de prestação de serviços",
        tipo: "CONSULTA",
        dataInicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias no futuro
        dataFim: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // +1.5 horas
        local: "Escritório",
        participantes: ["inova@sandraadv.br", "fernanda@sandraadv.br"],
        clienteId: inovaTech.id,
        advogadoResponsavelId: fernanda.advogado.id,
        criadoPorId: fernanda.id,
        status: "AGENDADO",
        lembreteMinutos: 60,
        observacoes: "Empresa nova, primeira consulta",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Prazo para Contestação",
        descricao: "Prazo limite para apresentar contestação no processo",
        tipo: "PRAZO",
        dataInicio: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias no futuro
        dataFim: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000), // +1 dia
        participantes: ["sandra@adv.br", "ricardo@sandraadv.br"],
        processoId: processoUniao.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 120, // 2 horas antes
        observacoes: "Prazo crítico - não pode ser perdido",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Lembrete - Revisão de Contratos",
        descricao: "Revisar contratos pendentes de assinatura",
        tipo: "LEMBRETE",
        dataInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 horas
        participantes: ["sandra@adv.br"],
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 0,
        observacoes: "Tarefa administrativa importante",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Audiência de Instrução",
        descricao: "Audiência para produção de provas",
        tipo: "AUDIENCIA",
        dataInicio: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias no futuro
        dataFim: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 horas
        local: "Fórum Regional - Sala 205",
        participantes: ["cliente@sandraadv.br", "sandra@adv.br"],
        processoId: processoGuarda.id,
        clienteId: marcos.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 60,
        observacoes: "Levar testemunhas e documentos",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Reunião de Equipe",
        descricao: "Reunião semanal da equipe para alinhamento",
        tipo: "REUNIAO",
        dataInicio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias no futuro
        dataFim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // +1.5 horas
        local: "Escritório - Sala de Conferências",
        participantes: ["sandra@adv.br", "ricardo@sandraadv.br", "fernanda@sandraadv.br"],
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 30,
        observacoes: "Reunião semanal obrigatória",
      },
      processoUniao && {
        tenantId: tenantSandra.id,
        titulo: "Audiência de Videoconciliação - CEJUSC (Tainá x Robson)",
        descricao: "Audiência VÍDEOCONCILIAÇÃO designada pelo CEJUSC Processual – Família Conciliação.\nTAINA X ROBSON (remessa de 07/10). Sessão confirmada para 18/12/2025 às 11:00.",
        tipo: "AUDIENCIA",
        dataInicio: new Date("2025-12-18T11:00:00-03:00"),
        dataFim: new Date("2025-12-18T12:00:00-03:00"),
        local: "Videoconferência - CEJUSC Processual (Família Conciliação)",
        participantes: ["sandra@adv.br", "magiclawyersaas@gmail.com", "taina.luisa@externo.br"],
        processoId: processoUniao.id,
        clienteId: robsonCliente?.id ?? null,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 120,
        observacoes: "Enviar link da sala virtual ao cliente com 48h de antecedência e validar acesso 30 minutos antes.",
      },
      // Eventos específicos para testar confirmações
      {
        tenantId: tenantSandra.id,
        titulo: "🎯 TESTE - Evento com Confirmações Mistas",
        descricao: "Evento criado especificamente para testar o sistema de confirmações",
        tipo: "REUNIAO",
        dataInicio: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora no futuro
        dataFim: new Date(Date.now() + 1 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hora
        local: "Sala de Teste",
        participantes: ["teste.confirmado@email.com", "teste.recusado@email.com", "teste.talvez@email.com", "teste.pendente@email.com"],
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 15,
        observacoes: "Evento para testar sistema de confirmações",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "🎯 TESTE - Audiência com Participantes Externos",
        descricao: "Audiência para testar confirmações com participantes externos",
        tipo: "AUDIENCIA",
        dataInicio: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas no futuro
        dataFim: new Date(Date.now() + 2 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 horas
        local: "Fórum de Teste - Sala 999",
        participantes: ["cliente@sandraadv.br", "ricardo@sandraadv.br", "sandra@adv.br"],
        processoId: processoGuarda.id,
        clienteId: marcos.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 30,
        observacoes: "Audiência de teste para confirmações",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "🎯 TESTE - Consulta com Cliente Novo",
        descricao: "Consulta para testar confirmação de cliente novo",
        tipo: "CONSULTA",
        dataInicio: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 horas no futuro
        dataFim: new Date(Date.now() + 3 * 60 * 60 * 1000 + 90 * 60 * 1000), // +1.5 horas
        local: "Escritório - Sala de Consultas",
        participantes: ["ana@sandraadv.br", "sandra@adv.br"],
        clienteId: ana.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 60,
        observacoes: "Primeira consulta com cliente novo",
      },
    ];

    // Inserir eventos
    for (const eventoData of eventos.filter(Boolean)) {
      const evento = await prisma.evento.create({
        data: eventoData,
      });
      console.log(`✅ Evento criado: ${evento.titulo}`);

      // Criar confirmações para os participantes
      if (eventoData.participantes && eventoData.participantes.length > 0) {
        const confirmacoesData = eventoData.participantes.map((email, index) => {
          // Definir status de confirmação baseado no tipo de evento e índice
          let status = "PENDENTE";
          let observacoes = null;

          // Eventos de teste específicos
          if (eventoData.titulo.includes("🎯 TESTE")) {
            if (eventoData.titulo.includes("Confirmações Mistas")) {
              // Evento com todos os tipos de confirmação
              if (email.includes("confirmado")) {
                status = "CONFIRMADO";
                observacoes = "Confirmado para teste";
              } else if (email.includes("recusado")) {
                status = "RECUSADO";
                observacoes = "Recusado para teste";
              } else if (email.includes("talvez")) {
                status = "TALVEZ";
                observacoes = "Talvez para teste";
              } else {
                status = "PENDENTE";
                observacoes = "Pendente para teste";
              }
            } else if (eventoData.titulo.includes("Participantes Externos")) {
              // Audiência com participantes externos
              if (email.includes("cliente@sandraadv.br")) {
                status = "CONFIRMADO";
                observacoes = "Cliente confirmou presença";
              } else if (email.includes("ricardo@sandraadv.br")) {
                status = "TALVEZ";
                observacoes = "Aguardando confirmação do advogado";
              } else if (email.includes("sandra@adv.br")) {
                status = "PENDENTE";
                observacoes = "Advogada ainda não confirmou";
              }
            } else if (eventoData.titulo.includes("Cliente Novo")) {
              // Consulta com cliente novo
              if (email.includes("ana@sandraadv.br")) {
                status = "CONFIRMADO";
                observacoes = "Cliente confirmou primeira consulta";
              } else {
                status = "CONFIRMADO";
                observacoes = "Advogado confirmado";
              }
            }
          } else {
            // Eventos normais
            if (eventoData.tipo === "REUNIAO" && eventoData.titulo.includes("Equipe")) {
              // Reunião de equipe - todos confirmados
              status = "CONFIRMADO";
              observacoes = "Reunião de equipe confirmada";
            } else if (eventoData.tipo === "REUNIAO" && eventoData.titulo.includes("Ana Santos")) {
              // Reunião com cliente - cliente confirmado, advogado pendente
              status = email.includes("ana@sandraadv.br") ? "CONFIRMADO" : "PENDENTE";
              observacoes = email.includes("ana@sandraadv.br") ? "Cliente confirmou" : null;
            } else if (eventoData.tipo === "AUDIENCIA") {
              // Audiências - diferentes status para testar
              if (email.includes("cliente@sandraadv.br")) {
                status = index === 0 ? "CONFIRMADO" : "PENDENTE";
                observacoes = index === 0 ? "Cliente confirmou" : null;
              } else {
                status = "TALVEZ";
                observacoes = "Preciso confirmar com agenda";
              }
            } else if (eventoData.tipo === "CONSULTA") {
              // Consulta - cliente confirmado
              status = email.includes("inova@sandraadv.br") ? "CONFIRMADO" : "PENDENTE";
              observacoes = email.includes("inova@sandraadv.br") ? "Empresa confirmou" : null;
            } else if (eventoData.tipo === "PRAZO") {
              // Prazos - advogados confirmados
              status = "CONFIRMADO";
              observacoes = "Prazo confirmado";
            } else if (eventoData.tipo === "LEMBRETE") {
              // Lembretes - confirmados
              status = "CONFIRMADO";
              observacoes = "Lembrete ativo";
            }
          }

          return {
            tenantId: eventoData.tenantId,
            eventoId: evento.id,
            participanteEmail: email,
            status: status,
            confirmadoEm: status !== "PENDENTE" ? new Date() : null,
            observacoes: observacoes,
          };
        });

        await prisma.eventoParticipante.createMany({
          data: confirmacoesData,
        });

        console.log(`   📧 ${confirmacoesData.length} confirmações criadas`);
      }
    }

    console.log(`🎉 Seed de eventos concluído! ${eventos.length} eventos criados.`);
  } catch (error) {
    console.error("❌ Erro no seed de eventos:", error);
    throw error;
  }
}

module.exports = { seedEventos };
