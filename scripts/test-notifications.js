#!/usr/bin/env node

/**
 * Teste completo do sistema de notificações
 */

require('dotenv').config();
const { NotificationService } = require('./app/lib/notifications/notification-service');

async function testNotificationSystem() {
  console.log('🚀 Testando Sistema de Notificações...');
  
  try {
    // Teste de publicação de notificação
    await NotificationService.publishNotification({
      type: 'test.notification',
      tenantId: 'test-tenant',
      userId: 'test-user',
      payload: { 
        message: 'Teste Redis + BullMQ',
        timestamp: new Date().toISOString()
      },
      urgency: 'MEDIUM'
    });
    
    console.log('✅ Notificação adicionada à fila com sucesso!');
    console.log('📊 Verifique o Redis para ver o job na fila');
    
  } catch (error) {
    console.error('❌ Erro no sistema de notificações:', error.message);
  }
}

testNotificationSystem().catch(console.error);
