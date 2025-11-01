/**
 * Script para simular webhook do Asaas (teste manual)
 * Execute: npx tsx scripts/test-asaas-webhook.ts
 */

import { AsaasWebhookService } from "../app/lib/notifications/services/asaas-webhook";

/**
 * Simula um webhook de pagamento confirmado
 */
async function testPaymentConfirmed() {
  console.log("🧪 Testando webhook PAYMENT_CONFIRMED...");

  const mockWebhook = {
    event: "PAYMENT_CONFIRMED",
    payment: {
      id: "pay_test_123",
      customer: "cus_test_456",
      billingType: "BOLETO",
      value: 10000, // R$ 100,00 em centavos
      netValue: 9900,
      description: "Parcela 1 - Teste",
      dueDate: new Date().toISOString(),
      paymentDate: new Date().toISOString(),
      status: "CONFIRMED",
      externalReference: "parcela_test_id",
    },
  };

  try {
    // Substituir pelo tenantId real do seu ambiente de teste
    const tenantId = process.env.TEST_TENANT_ID || "test-tenant-id";

    await AsaasWebhookService.processWebhook(mockWebhook, tenantId);

    console.log("✅ Webhook processado (verifique se notificações foram criadas)");
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    throw error;
  }
}

/**
 * Simula um webhook de pagamento em atraso
 */
async function testPaymentOverdue() {
  console.log("🧪 Testando webhook PAYMENT_OVERDUE...");

  const mockWebhook = {
    event: "PAYMENT_OVERDUE",
    payment: {
      id: "pay_test_456",
      customer: "cus_test_789",
      billingType: "BOLETO",
      value: 50000, // R$ 500,00
      description: "Parcela 2 - Vencida",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
      status: "OVERDUE",
      externalReference: "parcela_test_id_2",
    },
  };

  try {
    const tenantId = process.env.TEST_TENANT_ID || "test-tenant-id";

    await AsaasWebhookService.processWebhook(mockWebhook, tenantId);

    console.log("✅ Webhook de atraso processado");
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    throw error;
  }
}

/**
 * Executa todos os testes de webhook
 */
async function runTests() {
  console.log("🚀 Iniciando testes de webhook Asaas...\n");

  try {
    await testPaymentConfirmed();
    console.log("");

    await testPaymentOverdue();
    console.log("");

    console.log("✅ Todos os testes de webhook executados!");
    console.log("\n⚠️  NOTA: Estes são testes de simulação.");
    console.log("   Para testes reais, use o endpoint /api/webhooks/asaas com dados reais do Asaas.");
  } catch (error) {
    console.error("\n❌ Testes falharam:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

