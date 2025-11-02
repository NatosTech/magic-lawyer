/**
 * Script de teste manual para notificações
 * Execute: npx tsx scripts/test-notifications.ts
 */

import { DeadlineSchedulerService } from "../app/lib/notifications/services/deadline-scheduler";
import { NotificationService } from "../app/lib/notifications/notification-service";
import { NotificationFactory } from "../app/lib/notifications/domain/notification-factory";

/**
 * Testa o DeadlineSchedulerService
 */
async function testDeadlineScheduler() {
  console.log("🧪 Testando DeadlineSchedulerService...");

  try {
    await DeadlineSchedulerService.checkExpiringDeadlines();
    console.log("✅ DeadlineSchedulerService executado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao executar DeadlineSchedulerService:", error);
    throw error;
  }
}

/**
 * Testa criação de evento via NotificationFactory
 */
async function testNotificationFactory() {
  console.log("🧪 Testando NotificationFactory...");

  try {
    const event = NotificationFactory.createEvent(
      "processo.created",
      "test-tenant-id",
      "test-user-id",
      {
        processoId: "test-proc-123",
        numero: "1234567-89.2024.8.05.0001",
        clienteNome: "Teste Cliente",
      },
    );

    console.log("✅ Evento criado:", {
      type: event.type,
      urgency: event.urgency,
      hasPayload: !!event.payload,
      channels: event.channels,
    });
  } catch (error) {
    console.error("❌ Erro ao criar evento:", error);
    throw error;
  }
}

/**
 * Testa validação de campos obrigatórios
 */
async function testRequiredFields() {
  console.log("🧪 Testando validação de campos obrigatórios...");

  try {
    // Deve falhar - faltando campos obrigatórios
    try {
      NotificationFactory.createEvent(
        "processo.created",
        "test-tenant-id",
        "test-user-id",
        {
          processoId: "test-proc-123",
          // Faltando: numero, clienteNome
        },
      );

      console.error("❌ Validação falhou - deveria ter lançado erro");
      throw new Error("Validação não funcionou");
    } catch (error) {
      if (error instanceof Error && error.message.includes("obrigatórios faltando")) {
        console.log("✅ Validação funcionando - erro esperado capturado");
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao testar validação:", error);
    throw error;
  }
}

/**
 * Executa todos os testes
 */
async function runTests() {
  console.log("🚀 Iniciando testes de notificações...\n");

  try {
    await testNotificationFactory();
    console.log("");

    await testRequiredFields();
    console.log("");

    // Comentar testDeadlineScheduler() se não quiser rodar contra o banco
    // await testDeadlineScheduler();

    console.log("✅ Todos os testes passaram!");
  } catch (error) {
    console.error("\n❌ Testes falharam:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

