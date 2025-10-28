# 🏗️ Arquitetura Técnica - Sistema de Notificações Push

**Data de Criação:** 25/01/2025  
**Status:** ⏳ **Em Desenvolvimento** - Backend criado, mas não integrado

---

## 🎯 **DECISÕES ARQUITETURAIS**

### **Stack Realtime Escolhido: Ably** ✅

**Motivos:**
- ✅ **Já implementado** no sistema atual
- ✅ **Escalabilidade** automática
- ✅ **Confiabilidade** com fallbacks
- ✅ **WebSocket** nativo com reconexão automática
- ✅ **Multi-tenant** suportado
- ✅ **Rate limiting** built-in

**Configuração Atual:**
```typescript
// Backend
ABLY_API_KEY=xxx
REALTIME_CHANNEL_PREFIX=ml-dev

// Frontend  
NEXT_PUBLIC_ABLY_CLIENT_KEY=xxx
NEXT_PUBLIC_REALTIME_CHANNEL_PREFIX=ml-dev
```

---

## 🏗️ **TOPOLOGIA DO SISTEMA**

```mermaid
graph TB
    subgraph "Frontend"
        UI[Interface do Usuário]
        Provider[RealtimeProvider]
        Hook[useNotifications]
    end
    
    subgraph "Backend Core"
        Actions[Server Actions]
        API[API Routes]
        Publisher[NotificationPublisher]
        Queue[BullMQ Queue]
        Worker[Notification Worker]
    end
    
    subgraph "Infraestrutura Realtime"
        Ably[Ably WebSocket]
        Channels[Canais por Tenant]
    end
    
    subgraph "Persistência"
        DB[(PostgreSQL)]
        Notifications[Notification Table]
        Preferences[NotificationPreferences]
        Templates[NotificationTemplates]
    end
    
    subgraph "Integrações"
        Email[Email Service]
        Webhooks[Webhooks Asaas]
        Calendar[Google Calendar]
        Cron[Cron Jobs]
    end
    
    UI --> Provider
    Provider --> Ably
    Actions --> Publisher
    Publisher --> Queue
    Queue --> Worker
    Worker --> Ably
    Worker --> DB
    Worker --> Email
    Ably --> Channels
    Channels --> Provider
    API --> Email
    Webhooks --> Publisher
    Calendar --> Publisher
    Cron --> Publisher
```

---

## 📊 **ESTRUTURA DE DADOS**

### **Tabela: Notification**
```sql
CREATE TABLE Notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES Usuario(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'processo.created', 'prazo.expiring_7d', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  payload JSONB, -- Dados específicos do evento
  urgency NotificationUrgency NOT NULL DEFAULT 'MEDIUM',
  channels NotificationChannel[] NOT NULL DEFAULT ['REALTIME'],
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_notification_tenant_user (tenantId, userId),
  INDEX idx_notification_tenant_type (tenantId, type),
  INDEX idx_notification_tenant_urgency (tenantId, urgency),
  INDEX idx_notification_created (createdAt),
  INDEX idx_notification_expires (expiresAt)
);
```

### **Tabela: NotificationPreferences**
```sql
CREATE TABLE NotificationPreferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES Usuario(id) ON DELETE CASCADE,
  eventType VARCHAR(100) NOT NULL, -- 'processo.created', 'prazo.expiring_7d'
  enabled BOOLEAN DEFAULT TRUE,
  channels NotificationChannel[] DEFAULT ['REALTIME'],
  urgency NotificationUrgency DEFAULT 'MEDIUM',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  -- Constraint único por tenant/user/evento
  UNIQUE(tenantId, userId, eventType),
  
  -- Índices para performance
  INDEX idx_preferences_tenant_user (tenantId, userId),
  INDEX idx_preferences_tenant_event (tenantId, eventType)
);
```

### **Tabela: NotificationTemplate**
```sql
CREATE TABLE NotificationTemplate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
  eventType VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  variables JSONB, -- Variáveis disponíveis para substituição
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  -- Constraint único por tenant/evento
  UNIQUE(tenantId, eventType),
  
  -- Índices para performance
  INDEX idx_template_tenant_event (tenantId, eventType),
  INDEX idx_template_default (isDefault)
);
```

---

## 🔄 **FLUXO DE EVENTOS**

### **1. Geração de Evento**
```typescript
// Em qualquer Server Action
await publishNotification({
  type: 'processo.created',
  tenantId: 'tenant-123',
  userId: 'user-456',
  payload: {
    processoId: 'proc-789',
    numero: '1234567-89.2024.8.05.0001',
    cliente: 'João Silva'
  },
  urgency: 'medium'
});
```

### **2. Processamento**
```typescript
// NotificationPublisher
1. Validar permissões do usuário
2. Aplicar preferências de notificação
3. Verificar deduplicação (hash + TTL)
4. Gerar template personalizado
5. Salvar no banco de dados
6. Enviar via Ably (tempo real)
7. Enviar via email (se configurado)
```

### **3. Deduplicação/Anti-Spam**
```typescript
// Sistema de deduplicação
const eventHash = crypto.createHash('sha256')
  .update(`${eventType}:${tenantId}:${userId}:${JSON.stringify(payload)}`)
  .digest('hex');

// Verificar se evento já foi processado nos últimos 5 minutos
const existingNotification = await prisma.notification.findFirst({
  where: {
    tenantId,
    userId,
    type: eventType,
    createdAt: {
      gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos
    }
  }
});

if (existingNotification) {
  return; // Evento duplicado, não processar
}
```

### **4. Entrega**
```typescript
// Frontend
1. Receber evento via Ably
2. Atualizar estado local
3. Mostrar toast/notificação
4. Atualizar contador de não lidos
5. Salvar como lida (opcional)
```

---

## 🚀 **ESCALABILIDADE**

### **Sharding por Tenant**
- Cada tenant tem seu próprio canal Ably
- Canais: `ml-dev:tenant:{tenantId}`
- Isolamento completo entre tenants

### **Tolerância a Falhas**
- Fallback HTTP se Ably falhar
- Retry automático com backoff
- Dead letter queue para eventos perdidos

### **Política de Reconexão**
- Reconexão automática em 5s
- Reenvio de eventos pendentes
- Heartbeat a cada 30s

---

## 📱 **CANAIS DE NOTIFICAÇÃO**

### **Tempo Real (WebSocket)**
```typescript
// Via Ably
{
  type: 'notification.new',
  data: {
    id: 'notif-123',
    title: 'Novo processo criado',
    message: 'Processo 1234567-89 foi criado',
    urgency: 'medium',
    payload: { processoId: 'proc-789' }
  }
}
```

### **Email**
```typescript
// Via Email Service
{
  to: 'user@example.com',
  subject: 'Magic Lawyer - Novo processo criado',
  template: 'processo-created',
  data: { processoId: 'proc-789', numero: '1234567-89' }
}
```

### **WhatsApp** (Planejado)
```typescript
// Integração a definir (ex.: Zenvia, Twilio, Meta Cloud API)
{
  to: '+55XXXXXXXXXXX',
  template: 'processo-created-whatsapp',
  variables: { numero: '1234567-89', cliente: 'João Silva' }
}
```

---

## 🔧 **CONFIGURAÇÕES DE AMBIENTE**

### **Variáveis Implementadas**
```bash
# Ably (já configurado)
ABLY_API_KEY=xxx
NEXT_PUBLIC_ABLY_CLIENT_KEY=xxx
REALTIME_CHANNEL_PREFIX=ml-dev
NEXT_PUBLIC_REALTIME_CHANNEL_PREFIX=ml-dev

# Redis (implementado)
REDIS_URL=rediss://...  # Vercel Redis (Upstash)

# Rate Limiting (implementado)
NOTIFICATION_RATE_LIMIT_PER_USER=100
NOTIFICATION_RATE_LIMIT_PER_TENANT=1000
```


---

## ⚠️ **STATUS REAL DO SISTEMA**

### **✅ Implementado:**
1. ✅ **Schema Prisma** - Tabelas Notification, NotificationPreference, NotificationTemplate criadas
2. ✅ **BullMQ + Redis** - Infraestrutura de fila configurada
3. ✅ **NotificationService** - Serviço base criado
4. ✅ **Worker Assíncrono** - Worker BullMQ implementado
5. ✅ **API Management** - Endpoints de gerenciamento

### **❌ NÃO Implementado:**
1. ❌ **Integração Real** - Sistema ainda usa Notificacao/NotificacaoUsuario legado
2. ❌ **Deduplicação** - Não há hash SHA256 nem TTL implementado
3. ❌ **Fallback HTTP** - Não há polling quando Ably falha
4. ❌ **Canais EMAIL/WHATSAPP** - Apenas console.log (ou aguardando API)
5. ❌ **Cron Jobs** - Não há agendador de prazos
6. ❌ **Webhooks Asaas** - Não há integração com pagamentos
7. ❌ **NotificationFactory/Policy** - Classes não existem
8. ❌ **Migração** - Sistema legado ainda em uso

### **🔧 Próximos Passos Críticos:**
1. **Migrar sistema legado** - Substituir Notificacao/NotificacaoUsuario
2. **Implementar deduplicação** - Hash + TTL no Redis
3. **Implementar canais reais** - EMAIL e WHATSAPP funcionais
4. **Integrar com módulos** - Conectar Server Actions ao novo sistema
5. **Implementar cron jobs** - Agendador de prazos
6. **Implementar webhooks** - Integração Asaas

---

**Status:** ⏳ **Backend Criado, Integração Pendente** - Sistema legado ainda em uso
