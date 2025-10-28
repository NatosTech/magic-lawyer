# 🔧 Configuração Redis + BullMQ - Sistema de Notificações

**Data:** 25/01/2025  
**Status:** ⚠️ **Infraestrutura Criada, Integração Pendente**

---

## 🚀 **O que foi implementado:**

### **1. Configuração Redis (`app/lib/notifications/redis-config.ts`)**
- ✅ Conexão Redis para desenvolvimento e produção
- ✅ Suporte a Vercel Redis (Upstash) com TLS
- ✅ Configuração BullMQ com retry e backoff
- ✅ Teste de conexão Redis

### **2. Worker Assíncrono (`app/lib/notifications/notification-worker.ts`)**
- ✅ Worker BullMQ para processar notificações
- ✅ Processamento assíncrono com retry automático
- ✅ Event handlers para monitoramento
- ✅ Singleton pattern para gerenciamento

### **3. Queue de Notificações (`app/lib/notifications/notification-queue.ts`)**
- ✅ Queue BullMQ para adicionar jobs
- ✅ Priorização por urgência (CRITICAL → INFO)
- ✅ Jobs agendados e recorrentes
- ✅ Estatísticas e limpeza automática

### **4. NotificationService Atualizado**
- ✅ `publishNotification()` agora usa fila assíncrona
- ✅ `processNotificationSync()` para processamento pelo worker
- ✅ Mantém compatibilidade com código existente

### **5. API de Gerenciamento (`app/api/admin/notifications/worker/route.ts`)**
- ✅ `POST` - Iniciar worker
- ✅ `DELETE` - Parar worker  
- ✅ `GET` - Status e estatísticas

### **6. Script de Inicialização (`scripts/start-notifications-worker.js`)**
- ✅ Script standalone para iniciar worker
- ✅ Teste de conexão Redis
- ✅ Graceful shutdown com SIGINT

---

## 🔧 **Configuração Necessária:**

### **1. Variável de Ambiente**
```bash
# Adicionar no .env.local e Vercel
REDIS_URL=redis://localhost:6379  # Desenvolvimento
REDIS_URL=rediss://...            # Produção (Vercel Redis)
```

### **2. Vercel Redis Addon**
```bash
# Instalar Redis no Vercel
vercel addons create upstash-redis
```

### **3. Iniciar Worker**
```bash
# Desenvolvimento
npm run notifications:worker

# Produção (Vercel)
# Worker será iniciado automaticamente via API
```

---

## 📊 **Como usar:**

### **1. Adicionar Notificação à Fila**
```typescript
import { NotificationService } from '@/app/lib/notifications/notification-service';

await NotificationService.publishNotification({
  type: 'processo.created',
  tenantId: 'tenant-123',
  userId: 'user-456',
  payload: { processoId: 'proc-789' },
  urgency: 'MEDIUM'
});
```

### **2. Gerenciar Worker**
```bash
# Iniciar worker
curl -X POST http://localhost:9192/api/admin/notifications/worker

# Parar worker
curl -X DELETE http://localhost:9192/api/admin/notifications/worker

# Status
curl http://localhost:9192/api/admin/notifications/worker
```

### **3. Monitorar Fila**
```typescript
import { getNotificationQueue } from '@/app/lib/notifications/notification-queue';

const queue = getNotificationQueue();
const stats = await queue.getQueueStats();
console.log(stats);
```

---

## 🎯 **Benefícios:**

### **✅ Performance**
- Processamento assíncrono não bloqueia requests
- Retry automático para falhas temporárias
- Priorização por urgência

### **✅ Escalabilidade**
- Worker pode ser escalado horizontalmente
- Fila Redis suporta alta concorrência
- Dead letter queue para jobs falhados

### **✅ Confiabilidade**
- Jobs não são perdidos em caso de falha
- Retry com backoff exponencial
- Monitoramento via API

### **✅ Manutenibilidade**
- Código separado por responsabilidade
- Singleton pattern para gerenciamento
- Logs estruturados para debugging

---

## ⚠️ **STATUS REAL DA INFRAESTRUTURA**

### **✅ Criado mas NÃO Integrado:**
- ✅ Redis conectado no Vercel (Upstash)
- ✅ BullMQ worker criado
- ✅ API endpoints funcionando
- ✅ Infraestrutura configurada
- ❌ **Sistema não integrado** - Aplicação ainda usa legado

### **🚨 Problemas Críticos:**
- ❌ **Sistema legado ativo** - Notificacao/NotificacaoUsuario ainda em uso
- ❌ **Nenhuma integração** - Módulos não chamam NotificationService
- ❌ **Worker não usado** - Jobs não são processados pela aplicação
- ❌ **Scripts quebrados** - start-notifications-worker.js não funciona

### **📊 Status Atual (Não Reflete Uso Real):**
```json
{
  "success": true,
  "data": {
    "worker": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "queue": { "waiting": 0, "active": 0, "completed": 0, "failed": 0, "delayed": 0 },
    "status": "running"
  }
}
```

### **⚠️ Observação Importante:**
- Worker funciona quando chamado via API
- Mas **nenhuma parte da aplicação** usa o novo sistema
- Sistema legado (`app/actions/notifications.ts`) ainda processa todas as notificações

---

**Status:** ⚠️ **Infraestrutura Criada, Integração Crítica Pendente** - Sistema legado ainda ativo
