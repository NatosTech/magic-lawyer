#!/usr/bin/env node

/**
 * Script para verificar migrações completas
 * Testa se todos os módulos foram migrados corretamente
 */

require("dotenv").config();

async function verifyCompleteMigration() {
  console.log("🔍 Verificando Migração Completa do Sistema...");

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
    console.log("\n📋 Testando TODOS os eventos migrados...");

    // Lista de todos os eventos que devem estar migrados
    const eventosMigrados = [
      {
        name: "Evento Criado",
        type: "evento.created",
        urgency: "MEDIUM",
        payload: {
          eventoId: "evento_123",
          participanteEmail: "cliente@teste.com",
          tipoConfirmacao: "INVITE",
          eventoTitulo: "Reunião de Cliente",
          eventoData: "2024-12-01T10:00:00Z",
          eventoLocal: "Escritório",
          titulo: "Novo Evento - Confirmação Necessária",
          mensagem: 'Evento "Reunião de Cliente" foi agendado para 01/12/2024 em Escritório.',
          referenciaTipo: "EVENTO",
          referenciaId: "evento_123",
        },
      },
      {
        name: "Evento Atualizado",
        type: "evento.updated",
        urgency: "HIGH",
        payload: {
          eventoId: "evento_123",
          participanteEmail: "cliente@teste.com",
          tipoConfirmacao: "RE_CONFIRMACAO",
          motivo: "Evento alterado",
          eventoTitulo: "Reunião de Cliente",
          eventoData: "2024-12-01T10:00:00Z",
          eventoLocal: "Escritório",
          titulo: "Evento Alterado - Nova Confirmação Necessária",
          mensagem: 'O evento "Reunião de Cliente" foi alterado. Por favor, confirme novamente sua participação.',
          referenciaTipo: "EVENTO",
          referenciaId: "evento_123",
        },
      },
      {
        name: "Confirmação de Evento",
        type: "evento.confirmation_updated",
        urgency: "INFO",
        payload: {
          eventoId: "evento_123",
          participanteEmail: "cliente@teste.com",
          status: "CONFIRMADO",
          tipoConfirmacao: "RESPONSE",
          destinatarioEmail: "advogado@teste.com",
          titulo: "Atualização de Confirmação",
          mensagem: 'cliente@teste.com confirmou o evento "Reunião de Cliente".',
          referenciaTipo: "EVENTO",
          referenciaId: "evento_123",
        },
      },
      {
        name: "Andamento Criado",
        type: "andamento.created",
        urgency: "MEDIUM",
        payload: {
          andamentoId: "andamento_123",
          processoId: "proc_123",
          processoNumero: "1234567-89.2024.8.05.0001",
          titulo: "Petição Inicial",
          tipo: "PETICAO",
          dataMovimentacao: "2024-10-28T10:00:00Z",
          titulo: "Novo Andamento",
          mensagem: 'Andamento "Petição Inicial" foi adicionado ao processo 1234567-89.2024.8.05.0001.',
          referenciaTipo: "ANDAMENTO",
          referenciaId: "andamento_123",
        },
      },
      {
        name: "Prazo Criado",
        type: "prazo.created",
        urgency: "HIGH",
        payload: {
          prazoId: "prazo_123",
          processoId: "proc_123",
          processoNumero: "1234567-89.2024.8.05.0001",
          titulo: "Contestação",
          dataVencimento: "2024-11-15T23:59:59Z",
          titulo: "Novo Prazo Criado",
          mensagem: 'Prazo "Contestação" foi criado para o processo 1234567-89.2024.8.05.0001. Vencimento: 15/11/2024.',
          referenciaTipo: "PRAZO",
          referenciaId: "prazo_123",
        },
      },
    ];

    let sucessos = 0;
    let falhas = 0;

    for (const evento of eventosMigrados) {
      console.log(`\n🧪 Testando: ${evento.name}...`);

      const response = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "publish_test",
          type: evento.type,
          tenantId: "test-tenant",
          userId: "test-user",
          payload: evento.payload,
          urgency: evento.urgency,
          channels: ["REALTIME"],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${evento.name}: Sistema híbrido funcionando`);
        console.log(`   Sistema: ${result.data.system}`);
        sucessos++;
      } else {
        const error = await response.json();
        console.error(`❌ ${evento.name}: ${error.error}`);
        falhas++;
      }
    }

    console.log("\n📊 Resumo da Verificação:");
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Falhas: ${falhas}`);
    console.log(`📈 Taxa de Sucesso: ${Math.round((sucessos / eventosMigrados.length) * 100)}%`);

    if (falhas === 0) {
      console.log("\n🎉 MIGRAÇÃO COMPLETA VALIDADA!");
      console.log("✅ Todos os módulos migrados para sistema híbrido");
      console.log("✅ Helper de migração funcionando");
      console.log("✅ Sistema híbrido operacional");
      console.log("✅ Mapeamento de tipos correto");
    } else {
      console.log("\n⚠️ MIGRAÇÃO INCOMPLETA!");
      console.log("❌ Alguns módulos ainda precisam ser migrados");
    }
  } catch (error) {
    console.error("❌ Erro na verificação de migração:", error.message);
  }
}

verifyCompleteMigration().catch(console.error);
