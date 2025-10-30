# 🔧 Plano de Correção - Auditoria do Sistema de Notificações

**Data:** 25/01/2025  
**Status:** ⚠️ **CORREÇÃO NECESSÁRIA** - Documentação não reflete código real

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **Etapa 1 - Descoberta e Catálogo de Eventos**
- ❌ Status inconsistente entre documentos
- ❌ Faltam payloads mínimos documentados
- ❌ Faltam roles CONTROLLER e CONVIDADO EXTERNO
- ❌ Matriz Evento × Canal não implementada

### **Etapa 2 - Arquitetura Técnica** ⚠️ **PARCIALMENTE IMPLEMENTADA**
- ✅ Status consistente entre documentos
- ✅ BullMQ instalado e configurado
- ✅ Diagrama atualizado com implementação real
- ✅ Schema Prisma específico implementado
- ❌ **Deduplicação não implementada**
- ❌ **Fallback HTTP não implementado**

### **Etapa 3 - Backend Core** ⚠️ **PARCIALMENTE IMPLEMENTADA**
- ⚠️ **Sistema híbrido ativo** - Notificacao/NotificacaoUsuario ainda padrão (`NOTIFICATION_USE_NEW_SYSTEM=false`)
- ✅ Novo sistema (`Notification`) recebendo eventos (eventos/prazos/andamentos) via fila
- ✅ Fila/worker assíncrono em uso com `NotificationDelivery`
- ✅ **Canais implementados** - Ably (in-app) e Resend (email)
- ❌ **Deduplicação não implementada**
- ❌ **Agendador de prazos não implementado**
- ❌ **Webhooks Asaas não implementados**
- ❌ **NotificationFactory/Policy não existem**

---

## ⚠️ **CORREÇÕES NECESSÁRIAS**

### **FASE 1: Documentação Corrigida** ✅ **CONCLUÍDA**
- ✅ Status consistente entre todos os documentos
- ✅ BullMQ e Redis documentados como implementados
- ✅ Diagrama atualizado com arquitetura real
- ✅ Schema Prisma específico documentado

### **FASE 2: Backend Criado** ⚠️ **PARCIALMENTE IMPLEMENTADA**
- ✅ BullMQ instalado e configurado
- ✅ Redis configurado no Vercel (Upstash)
- ✅ Worker assíncrono criado
- ✅ API de gerenciamento implementada
- ❌ **Sistema não integrado** - Ainda usa legado

### **FASE 3: Integração Crítica** ❌ **NÃO IMPLEMENTADA**
- ❌ **Migração do sistema legado** - Notificacao/NotificacaoUsuario ainda ativo
- ❌ **Implementar deduplicação** - Hash + TTL no Redis
- ❌ **Implementar canais reais** - EMAIL em produção e WHATSAPP (após escolha da API)
- ❌ **Integrar com módulos** - Conectar Server Actions ao novo sistema
- ❌ **Implementar cron jobs** - Agendador de prazos
- ❌ **Implementar webhooks** - Integração Asaas

---


## 🚀 **PRÓXIMOS PASSOS CRÍTICOS**

1. ⚠️ **Ativar novo sistema em produção**: Revisar `NOTIFICATION_USE_NEW_SYSTEM` e completar migração dos módulos restantes
2. ❌ **Deduplicação**: Implementar hash + TTL no Redis
3. ❌ **Fallback HTTP**: Provisionar polling quando Ably falhar
4. ❌ **Agendador de prazos**: Cron jobs para D-7/D-3/D-1/H-2
5. ❌ **Webhooks Asaas**: Gerar eventos automáticos de pagamento
6. ❌ **NotificationFactory/Policy**: Camada de domínio com validações

---

**Status:** ⚠️ **Backend Criado, Migração Parcial** - Sistema híbrido aguardando rollout total
