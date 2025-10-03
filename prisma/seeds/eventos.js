const { PrismaClient } = require("../../app/generated/prisma");

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
    const ricardo = usuarios.find((u) => u.email === "ricardo@adv.br");
    const fernanda = usuarios.find((u) => u.email === "fernanda@adv.br");

    // Buscar clientes
    const clientes = await prisma.cliente.findMany({
      where: { tenantId: tenantSandra.id },
    });

    const marcos = clientes.find((c) => c.nome === "Marcos Silva");
    const ana = clientes.find((c) => c.nome === "Ana Santos");
    const inovaTech = clientes.find((c) => c.nome === "Inova Tech Ltda");

    // Buscar processos
    const processos = await prisma.processo.findMany({
      where: { tenantId: tenantSandra.id },
    });

    const processo1 = processos[0];
    const processo2 = processos[1];

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
        participantes: ["marcos.silva@email.com", "sandra@adv.br"],
        processoId: processo1?.id,
        clienteId: marcos?.id,
        advogadoResponsavelId: sandra?.advogado?.id,
        criadoPorId: sandra?.id,
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
        participantes: ["ana.santos@email.com", "ricardo@adv.br"],
        clienteId: ana?.id,
        advogadoResponsavelId: ricardo?.advogado?.id,
        criadoPorId: ricardo?.id,
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
        participantes: ["contato@inovatech.com", "fernanda@adv.br"],
        clienteId: inovaTech?.id,
        advogadoResponsavelId: fernanda?.advogado?.id,
        criadoPorId: fernanda?.id,
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
        participantes: ["sandra@adv.br", "ricardo@adv.br"],
        processoId: processo2?.id,
        advogadoResponsavelId: sandra?.advogado?.id,
        criadoPorId: sandra?.id,
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
        advogadoResponsavelId: sandra?.advogado?.id,
        criadoPorId: sandra?.id,
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
        participantes: ["marcos.silva@email.com", "sandra@adv.br"],
        processoId: processo1?.id,
        clienteId: marcos?.id,
        advogadoResponsavelId: sandra?.advogado?.id,
        criadoPorId: sandra?.id,
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
        participantes: ["sandra@adv.br", "ricardo@adv.br", "fernanda@adv.br"],
        criadoPorId: sandra?.id,
        status: "AGENDADO",
        lembreteMinutos: 30,
        observacoes: "Reunião semanal obrigatória",
      },
    ];

    // Inserir eventos
    for (const eventoData of eventos) {
      const evento = await prisma.evento.create({
        data: eventoData,
      });
      console.log(`✅ Evento criado: ${evento.titulo}`);
    }

    console.log(`🎉 Seed de eventos concluído! ${eventos.length} eventos criados.`);
  } catch (error) {
    console.error("❌ Erro no seed de eventos:", error);
    throw error;
  }
}

module.exports = { seedEventos };
