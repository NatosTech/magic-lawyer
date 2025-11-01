/**
 * Script de Smoke Test para Notificações
 * Testa os fluxos principais de notificações do sistema
 *
 * Execute: npx tsx scripts/smoke-test-notifications.ts
 */

import prisma from "../app/lib/prisma";
import { NotificationService } from "../app/lib/notifications/notification-service";
import { NotificationFactory } from "../app/lib/notifications/domain/notification-factory";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper para buscar tenant e usuário válidos
async function getValidTenantAndUser() {
  try {
    // Buscar tenant ACTIVE que NÃO seja GLOBAL e tenha usuários
    let tenant = await prisma.tenant.findFirst({
      where: {
        status: "ACTIVE",
        id: {
          not: "GLOBAL", // Ignorar tenant GLOBAL (especial do sistema)
        },
        usuarios: {
          some: {}, // Deve ter pelo menos um usuário
        },
      },
      select: {
        id: true,
      },
    });

    // Se não encontrou, buscar qualquer tenant não-GLOBAL e atualizar
    if (!tenant) {
      const allTenants = await prisma.tenant.findMany({
        where: {
          id: {
            not: "GLOBAL",
          },
        },
        select: {
          id: true,
          status: true,
        },
        take: 5,
      });

      if (allTenants.length > 0) {
        tenant = await prisma.tenant.update({
          where: { id: allTenants[0].id },
          data: { status: "ACTIVE" },
          select: { id: true },
        });
      }
    }

    if (!tenant) {
      return null;
    }

    // Buscar usuário ativo
    let usuario = await prisma.usuario.findFirst({
      where: {
        tenantId: tenant.id,
        active: true,
      },
      select: {
        id: true,
      },
    });

    // Se não encontrou, ativar primeiro usuário do tenant
    if (!usuario) {
      const primeiroUsuario = await prisma.usuario.findFirst({
        where: {
          tenantId: tenant.id,
        },
        select: {
          id: true,
        },
      });

      if (primeiroUsuario) {
        await prisma.usuario.update({
          where: { id: primeiroUsuario.id },
          data: { active: true },
        });
        usuario = primeiroUsuario;
      } else {
        return null;
      }
    }

    return { tenantId: tenant.id, userId: usuario.id };
  } catch (error) {
    console.error("Erro ao buscar tenant/usuário:", error);
    return null;
  }
}

async function testProcessoCreated() {
  log("\n📋 Teste 1: Processo Criado", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const event = NotificationFactory.createEvent(
      "processo.created",
      data.tenantId,
      data.userId,
      {
        processoId: "test-proc-123",
        numero: "1234567-89.2024.8.05.0001",
        clienteNome: "Cliente Teste",
        titulo: "Processo de Teste",
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Processo criado → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function testPrazoExpiring() {
  log("\n⏰ Teste 2: Prazo Expirando", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const event = NotificationFactory.createEvent(
      "prazo.expiring_7d",
      data.tenantId,
      data.userId,
      {
        prazoId: "test-prazo-123",
        processoId: "test-proc-123",
        processoNumero: "1234567-89.2024.8.05.0001",
        titulo: "Prazo de Teste",
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Prazo expirando → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function testPagamentoPaid() {
  log("\n💰 Teste 3: Pagamento Confirmado", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const event = NotificationFactory.createEvent(
      "pagamento.paid",
      data.tenantId,
      data.userId,
      {
        pagamentoId: "test-pag-123",
        parcelaId: "test-parcela-123",
        valor: 1000.0,
        metodo: "PIX",
        dataPagamento: new Date().toISOString(),
        clienteNome: "Cliente Teste",
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Pagamento confirmado → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function testBoletoGenerated() {
  log("\n📄 Teste 4: Boleto Gerado", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const vencimento = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const event = NotificationFactory.createEvent(
      "boleto.generated",
      data.tenantId,
      data.userId,
      {
        pagamentoId: "test-pag-123",
        boletoId: "test-boleto-123",
        parcelaId: "test-parcela-123",
        contratoId: "test-contrato-123",
        valor: 500.0,
        metodo: "BOLETO",
        clienteId: "test-cliente-123",
        clienteNome: "Cliente Teste",
        vencimento,
        linhaDigitavel: "34191.09008 01234.567890 12345.678901 2 12345678901234",
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Boleto gerado → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function testContratoCreated() {
  log("\n📝 Teste 5: Contrato Criado", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const event = NotificationFactory.createEvent(
      "contrato.created",
      data.tenantId,
      data.userId,
      {
        contratoId: "test-contrato-123",
        clienteId: "test-cliente-123",
        clienteNome: "Cliente Teste",
        titulo: "Contrato de Teste",
        valor: 5000.0,
        status: "RASCUNHO",
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Contrato criado → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function testEventoCreated() {
  log("\n📅 Teste 6: Evento Criado", colors.blue);

  try {
    const data = await getValidTenantAndUser();

    if (!data) {
      log("❌ Nenhum tenant/usuário encontrado", colors.red);
      return false;
    }

    const event = NotificationFactory.createEvent(
      "evento.created",
      data.tenantId,
      data.userId,
      {
        eventoId: "test-evento-123",
        titulo: "Evento de Teste",
        dataInicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        local: "Escritório",
      },
    );

    await NotificationService.publishNotification(event);

    log("✅ Evento criado → Notificação enviada", colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro: ${error}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log("🚀 Iniciando Smoke Tests de Notificações...\n", colors.blue);

  const tests = [
    { name: "Processo Criado", fn: testProcessoCreated },
    { name: "Prazo Expirando", fn: testPrazoExpiring },
    { name: "Pagamento Confirmado", fn: testPagamentoPaid },
    { name: "Boleto Gerado", fn: testBoletoGenerated },
    { name: "Contrato Criado", fn: testContratoCreated },
    { name: "Evento Criado", fn: testEventoCreated },
  ];

  const results: Array<{ name: string; success: boolean }> = [];

  for (const test of tests) {
    const success = await test.fn();
    results.push({ name: test.name, success });
  }

  // Resumo
  log("\n" + "=".repeat(50), colors.blue);
  log("📊 RESUMO DOS TESTES", colors.blue);
  log("=".repeat(50), colors.blue);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result) => {
    const icon = result.success ? "✅" : "❌";
    const color = result.success ? colors.green : colors.red;
    log(`${icon} ${result.name}`, color);
  });

  log("\n" + "-".repeat(50), colors.blue);
  log(`Total: ${results.length} testes`, colors.blue);
  log(`✅ Passou: ${passed}`, colors.green);
  log(`❌ Falhou: ${failed}`, colors.red);
  log("=".repeat(50) + "\n", colors.blue);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
}
