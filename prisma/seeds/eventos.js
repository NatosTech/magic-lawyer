const { PrismaClient } = require("../../app/generated/prisma");

const prisma = new PrismaClient();

async function seedEventos() {
  console.log("🌱 Iniciando seed de eventos...");

  try {
    const tenantSandra = await prisma.tenant.findUnique({
      where: { slug: "sandra" },
    });

    if (!tenantSandra) {
      console.log("❌ Tenant Sandra não encontrado");
      return;
    }

    const sandra = await prisma.usuario.findFirst({
      where: { tenantId: tenantSandra.id, email: "sandra@adv.br" },
      include: { advogado: true },
    });

    const robsonCliente = await prisma.cliente.findFirst({
      where: { tenantId: tenantSandra.id, documento: "083.620.235-03" },
    });

    const processos = await prisma.processo.findMany({
      where: { tenantId: tenantSandra.id },
    });

    const processoGuarda = processos.find((p) => p.numero === "8154973-16.2024.8.05.0001");
    const processoUniao = processos.find((p) => p.numero === "8155658-23.2024.8.05.0001");
    const processoMedidas = processos.find((p) => p.numero === "8155723-18.2024.8.05.0001");

    if (!sandraValida(sandra) || !robsonCliente || !processoGuarda || !processoUniao || !processoMedidas) {
      console.log("❌ Dependências não encontradas. Execute o seed principal primeiro.");
      return;
    }

    const eventos = [
      {
        tenantId: tenantSandra.id,
        titulo: "Audiência de Conciliação - Guarda do Filippo",
        descricao: "Sessão presencial para tentativa de acordo sobre visitas e guarda do menor.",
        tipo: "AUDIENCIA",
        dataInicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dataFim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        local: "Fórum João Mangabeira - Sala 101",
        participantes: ["magiclawyersaas@gmail.com", "sandra@adv.br"],
        processoId: processoGuarda.id,
        clienteId: robsonCliente.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 30,
        observacoes: "Revisar petição inicial e laudo psicossocial com o cliente.",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Reunião estratégica com Robson",
        descricao: "Definição da contestação para o processo de união estável.",
        tipo: "REUNIAO",
        dataInicio: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        dataFim: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        local: "Escritório - Sala 3",
        participantes: ["magiclawyersaas@gmail.com", "sandra@adv.br"],
        processoId: processoUniao.id,
        clienteId: robsonCliente.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "CONFIRMADO",
        lembreteMinutos: 60,
        observacoes: "Separar planilha de bens e comprovantes bancários.",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Prazo para contestação - União estável",
        descricao: "Prazo crítico para entrega da contestação no processo 8155658-23.2024.8.05.0001.",
        tipo: "PRAZO",
        dataInicio: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        dataFim: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000),
        participantes: ["sandra@adv.br"],
        processoId: processoUniao.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 180,
        observacoes: "Enviar minutas para revisão 48h antes.",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Audiência CEJUSC - Videoconciliação",
        descricao: "Tentativa de acordo global entre Robson e Tainá.",
        tipo: "AUDIENCIA",
        dataInicio: new Date("2025-12-18T11:00:00-03:00"),
        dataFim: new Date("2025-12-18T12:00:00-03:00"),
        local: "Videoconferência - CEJUSC Processual (Família Conciliação)",
        participantes: ["sandra@adv.br", "magiclawyersaas@gmail.com"],
        processoId: processoUniao.id,
        clienteId: robsonCliente.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 120,
        observacoes: "Enviar link ao cliente com 48h de antecedência e testar conexão 30 minutos antes.",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Checklist Medidas Protetivas",
        descricao: "Revisar cumprimento das medidas impostas e preparar eventual pedido de revogação.",
        tipo: "LEMBRETE",
        dataInicio: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        dataFim: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        participantes: ["sandra@adv.br"],
        processoId: processoMedidas.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 0,
        observacoes: "Confirmar protocolos com a delegacia responsável.",
      },
      {
        tenantId: tenantSandra.id,
        titulo: "Audiência de Medidas Protetivas",
        descricao: "Audiência para manutenção ou revisão das medidas impostas contra Robson.",
        tipo: "AUDIENCIA",
        dataInicio: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        dataFim: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        local: "5ª Vara de Violência Doméstica - Salvador/BA",
        participantes: ["sandra@adv.br", "magiclawyersaas@gmail.com"],
        processoId: processoMedidas.id,
        clienteId: robsonCliente.id,
        advogadoResponsavelId: sandra.advogado.id,
        criadoPorId: sandra.id,
        status: "AGENDADO",
        lembreteMinutos: 180,
        observacoes: "Checar se o Ministério Público foi intimado.",
      },
    ];

    await prisma.evento.deleteMany({
      where: { tenantId: tenantSandra.id },
    });

    for (const evento of eventos) {
      await prisma.evento.create({ data: evento });
    }

    console.log("✅ Eventos atualizados para o cenário exclusivo do Robson.");
  } catch (error) {
    console.error("❌ Erro ao executar seed de eventos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function sandraValida(usuario) {
  return Boolean(usuario && usuario.advogado);
}

module.exports = { seedEventos };
