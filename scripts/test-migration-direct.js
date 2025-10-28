#!/usr/bin/env node

/**
 * Script para testar diretamente o serviço de migração
 * Requer INTERNAL_ADMIN_TOKEN configurado
 */

require("dotenv").config();

async function testMigrationDirect() {
  console.log("🚀 Testando Serviço de Migração Diretamente...");

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
    // Teste 1: Criar notificação legada diretamente
    console.log("\n📋 Teste 1: Criar notificação legada...");

    // Primeiro, vou testar se conseguimos criar uma notificação legada via Prisma diretamente
    const testResponse = await fetch("http://localhost:9192/api/admin/notifications/test", {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "test.legacy",
        tenantId: "test-tenant",
        userId: "test-user",
        payload: {
          message: "Teste direto do sistema legado",
          tipo: "SISTEMA",
          prioridade: "MEDIA",
          canais: ["IN_APP"],
        },
        urgency: "MEDIUM",
      }),
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log("✅ Teste direto funcionou:", testResult);
    } else {
      const error = await testResponse.json();
      console.error("❌ Erro no teste direto:", error.error);
    }

    console.log("\n🎉 Teste de migração direta concluído!");
  } catch (error) {
    console.error("❌ Erro no teste de migração direta:", error.message);
  }
}

testMigrationDirect().catch(console.error);
