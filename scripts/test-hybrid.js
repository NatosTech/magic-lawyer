#!/usr/bin/env node

/**
 * Script para testar sistema híbrido de notificações
 * Requer INTERNAL_ADMIN_TOKEN configurado
 */

require("dotenv").config();

async function testHybridSystem() {
  console.log("🚀 Testando Sistema Híbrido de Notificações...");

  // Verificar se o token está configurado
  if (!process.env.INTERNAL_ADMIN_TOKEN) {
    console.error("❌ INTERNAL_ADMIN_TOKEN não configurado no .env");
    console.log("💡 Adicione INTERNAL_ADMIN_TOKEN=seu_token_secreto no .env.local");
    process.exit(1);
  }

  const baseUrl = "http://localhost:9192/api/admin/notifications/hybrid";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.INTERNAL_ADMIN_TOKEN}`,
  };

  try {
    // Teste 1: Verificar status atual
    console.log("\n📋 Teste 1: Verificar status do sistema...");
    const statusResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "get_status" }),
    });

    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      console.log("✅ Status atual:", statusResult.data);
    } else {
      const error = await statusResponse.json();
      console.error("❌ Erro ao obter status:", error.error);
    }

    // Teste 2: Testar publicação no sistema atual
    console.log("\n📋 Teste 2: Publicar notificação de teste...");
    const publishResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "test.hybrid",
        tenantId: "test-tenant",
        userId: "test-user",
        payload: {
          message: "Teste do sistema híbrido",
          timestamp: new Date().toISOString(),
        },
        urgency: "MEDIUM",
      }),
    });

    if (publishResponse.ok) {
      const publishResult = await publishResponse.json();
      console.log("✅ Notificação publicada:", publishResult.data);
    } else {
      const error = await publishResponse.json();
      console.error("❌ Erro ao publicar:", error.error);
    }

    // Teste 3: Alternar para novo sistema
    console.log("\n📋 Teste 3: Alternar para novo sistema...");
    const switchResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "switch_system",
        useNewSystem: true,
      }),
    });

    if (switchResponse.ok) {
      const switchResult = await switchResponse.json();
      console.log("✅ Sistema alterado:", switchResult.message);
    } else {
      const error = await switchResponse.json();
      console.error("❌ Erro ao alternar sistema:", error.error);
    }

    // Teste 4: Testar publicação no novo sistema
    console.log("\n📋 Teste 4: Publicar no novo sistema...");
    const publishNewResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "test.new_system",
        tenantId: "test-tenant",
        userId: "test-user",
        payload: {
          message: "Teste no novo sistema",
          timestamp: new Date().toISOString(),
        },
        urgency: "HIGH",
      }),
    });

    if (publishNewResponse.ok) {
      const publishNewResult = await publishNewResponse.json();
      console.log("✅ Notificação publicada no novo sistema:", publishNewResult.data);
    } else {
      const error = await publishNewResponse.json();
      console.error("❌ Erro ao publicar no novo sistema:", error.error);
    }

    // Teste 5: Voltar para sistema legado
    console.log("\n📋 Teste 5: Voltar para sistema legado...");
    const switchBackResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "switch_system",
        useNewSystem: false,
      }),
    });

    if (switchBackResponse.ok) {
      const switchBackResult = await switchBackResponse.json();
      console.log("✅ Sistema alterado:", switchBackResult.message);
    } else {
      const error = await switchBackResponse.json();
      console.error("❌ Erro ao voltar para sistema legado:", error.error);
    }

    console.log("\n🎉 Testes do sistema híbrido concluídos!");
  } catch (error) {
    console.error("❌ Erro no teste do sistema híbrido:", error.message);
  }
}

testHybridSystem().catch(console.error);
