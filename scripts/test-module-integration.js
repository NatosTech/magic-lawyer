#!/usr/bin/env node

/**
 * Script para testar integração de notificações em módulos
 * Requer INTERNAL_ADMIN_TOKEN configurado
 */

require("dotenv").config();

async function testModuleIntegration() {
  console.log("🚀 Testando Integração de Notificações em Módulos...");

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
    // Teste 1: Notificação de processo criado
    console.log("\n📋 Teste 1: Notificação de processo criado...");
    const processoResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "processo.created",
        tenantId: "tenant_123",
        userId: "user_123",
        payload: {
          processoId: "proc_123",
          numero: "1234567-89.2024.8.05.0001",
          clienteNome: "João Silva",
          advogadoNome: "Maria Santos",
          titulo: "Novo Processo Criado",
          mensagem: "Processo 1234567-89.2024.8.05.0001 foi criado com sucesso.",
          referenciaTipo: "PROCESSO",
          referenciaId: "proc_123",
        },
        urgency: "MEDIUM",
        channels: ["REALTIME"],
      }),
    });

    if (processoResponse.ok) {
      const processoResult = await processoResponse.json();
      console.log("✅ Processo criado:", processoResult.data);
    } else {
      const error = await processoResponse.json();
      console.error("❌ Erro ao criar processo:", error.error);
    }

    // Teste 2: Notificação de prazo expirando
    console.log("\n📋 Teste 2: Notificação de prazo expirando...");
    const prazoResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "prazo.expiring",
        tenantId: "tenant_123",
        userId: "user_123",
        payload: {
          prazoId: "prazo_123",
          processoId: "proc_123",
          processoNumero: "1234567-89.2024.8.05.0001",
          titulo: "Contestação",
          diasRestantes: 2,
          titulo: "Prazo Próximo do Vencimento",
          mensagem: 'Prazo "Contestação" do processo 1234567-89.2024.8.05.0001 vence em 2 dias.',
          referenciaTipo: "PRAZO",
          referenciaId: "prazo_123",
        },
        urgency: "HIGH",
        channels: ["REALTIME", "EMAIL"],
      }),
    });

    if (prazoResponse.ok) {
      const prazoResult = await prazoResponse.json();
      console.log("✅ Prazo expirando:", prazoResult.data);
    } else {
      const error = await prazoResponse.json();
      console.error("❌ Erro ao notificar prazo:", error.error);
    }

    // Teste 3: Notificação de documento enviado
    console.log("\n📋 Teste 3: Notificação de documento enviado...");
    const documentoResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "documento.uploaded",
        tenantId: "tenant_123",
        userId: "user_123",
        payload: {
          documentoId: "doc_123",
          processoId: "proc_123",
          processoNumero: "1234567-89.2024.8.05.0001",
          nomeArquivo: "contestacao.pdf",
          titulo: "Novo Documento Enviado",
          mensagem: 'Documento "contestacao.pdf" foi enviado para o processo 1234567-89.2024.8.05.0001.',
          referenciaTipo: "DOCUMENTO",
          referenciaId: "doc_123",
        },
        urgency: "MEDIUM",
        channels: ["REALTIME"],
      }),
    });

    if (documentoResponse.ok) {
      const documentoResult = await documentoResponse.json();
      console.log("✅ Documento enviado:", documentoResult.data);
    } else {
      const error = await documentoResponse.json();
      console.error("❌ Erro ao notificar documento:", error.error);
    }

    // Teste 4: Notificação de pagamento confirmado
    console.log("\n📋 Teste 4: Notificação de pagamento confirmado...");
    const pagamentoResponse = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_test",
        type: "pagamento.paid",
        tenantId: "tenant_123",
        userId: "user_123",
        payload: {
          pagamentoId: "pag_123",
          valor: 1500.0,
          processoId: "proc_123",
          processoNumero: "1234567-89.2024.8.05.0001",
          titulo: "Pagamento Confirmado",
          mensagem: "Pagamento de R$ 1500,00 foi confirmado para o processo 1234567-89.2024.8.05.0001.",
          referenciaTipo: "PAGAMENTO",
          referenciaId: "pag_123",
        },
        urgency: "HIGH",
        channels: ["REALTIME", "EMAIL"],
      }),
    });

    if (pagamentoResponse.ok) {
      const pagamentoResult = await pagamentoResponse.json();
      console.log("✅ Pagamento confirmado:", pagamentoResult.data);
    } else {
      const error = await pagamentoResponse.json();
      console.error("❌ Erro ao notificar pagamento:", error.error);
    }

    console.log("\n🎉 Testes de integração de módulos concluídos!");
  } catch (error) {
    console.error("❌ Erro no teste de integração:", error.message);
  }
}

testModuleIntegration().catch(console.error);
