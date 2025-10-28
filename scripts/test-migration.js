#!/usr/bin/env node

/**
 * Script para testar migração de notificações legadas
 * Requer INTERNAL_ADMIN_TOKEN configurado
 */

require("dotenv").config();

async function testMigration() {
  console.log("🚀 Testando Migração de Notificações Legadas...");

  // Verificar se o token está configurado
  if (!process.env.INTERNAL_ADMIN_TOKEN) {
    console.error("❌ INTERNAL_ADMIN_TOKEN não configurado no .env");
    console.log("💡 Adicione INTERNAL_ADMIN_TOKEN=seu_token_secreto no .env.local");
    process.exit(1);
  }

  const baseUrl = "http://localhost:9192/api/admin/notifications/migration";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.INTERNAL_ADMIN_TOKEN}`,
  };

  try {
    // Teste 1: Verificar status de migração de uma notificação específica
    console.log("\n📋 Teste 1: Verificar status de migração...");
    const checkResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "check_migration",
        notificationId: "test-notification-id",
      }),
    });

    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      console.log("✅ Status de migração:", checkResult.data);
    } else {
      const error = await checkResponse.json();
      console.log("ℹ️ Erro esperado (notificação não existe):", error.error);
    }

    // Teste 2: Migrar todas as notificações legadas
    console.log("\n📋 Teste 2: Migrar todas as notificações legadas...");
    const migrateResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "migrate_all",
      }),
    });

    if (migrateResponse.ok) {
      const migrateResult = await migrateResponse.json();
      console.log("✅ Migração concluída:", migrateResult.data);
    } else {
      const error = await migrateResponse.json();
      console.error("❌ Erro na migração:", error.error);
    }

    console.log("\n🎉 Testes de migração concluídos!");
  } catch (error) {
    console.error("❌ Erro no teste de migração:", error.message);
  }
}

testMigration().catch(console.error);
