#!/usr/bin/env node

/**
 * Teste completo do sistema de notificações via API
 * Requer INTERNAL_ADMIN_TOKEN configurado
 */

require("dotenv").config();

async function testNotificationSystem() {
  console.log("🚀 Testando Sistema de Notificações...");

  // Verificar se o token está configurado
  if (!process.env.INTERNAL_ADMIN_TOKEN) {
    console.error("❌ INTERNAL_ADMIN_TOKEN não configurado no .env");
    console.log("💡 Adicione INTERNAL_ADMIN_TOKEN=seu_token_secreto no .env.local");
    process.exit(1);
  }

  try {
    // Teste de publicação de notificação via API
    const response = await fetch("http://localhost:9192/api/admin/notifications/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        type: "test.notification",
        tenantId: "test-tenant",
        userId: "test-user",
        payload: {
          message: "Teste Redis + BullMQ",
          timestamp: new Date().toISOString(),
        },
        urgency: "MEDIUM",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Notificação adicionada à fila com sucesso!");
      console.log("📊 Resultado:", result);
    } else {
      const error = await response.json();
      console.error("❌ Erro na API:", response.status, error.error);
    }
  } catch (error) {
    console.error("❌ Erro no sistema de notificações:", error.message);
  }
}

testNotificationSystem().catch(console.error);
