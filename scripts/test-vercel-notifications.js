#!/usr/bin/env node

/**
 * Teste do sistema de notificações no Vercel
 */

const https = require("https");

async function testVercelNotifications() {
  console.log("🚀 Testando Sistema de Notificações no Vercel...");

  const baseUrl = "https://magic-lawyer-1igljd41v-magiclawyer.vercel.app";

  try {
    // Teste 1: Iniciar worker
    console.log("📡 Iniciando worker...");
    const startResponse = await fetch(`${baseUrl}/api/admin/notifications/worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const startResult = await startResponse.json();
    console.log("✅ Worker:", startResult.success ? "Iniciado" : "Erro");

    if (!startResult.success) {
      console.error("❌ Erro ao iniciar worker:", startResult.error);
      return;
    }

    // Teste 2: Verificar status
    console.log("📊 Verificando status...");
    const statusResponse = await fetch(`${baseUrl}/api/admin/notifications/worker`);
    const statusResult = await statusResponse.json();

    console.log("✅ Status:", statusResult.success ? "OK" : "Erro");
    if (statusResult.success) {
      console.log("📈 Dados:", JSON.stringify(statusResult.data, null, 2));
    }

    console.log("🎉 Sistema de notificações funcionando no Vercel!");
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
  }
}

testVercelNotifications().catch(console.error);
