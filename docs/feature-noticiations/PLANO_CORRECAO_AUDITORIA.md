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
- ❌ **Sistema antigo ainda em uso** - Notificacao/NotificacaoUsuario ativo
- ✅ Novo sistema (`Notification`) criado mas não integrado
- ✅ Fila/worker assíncrono criado mas não usado
- ❌ **Canais não implementados** - Apenas console.log com TODO
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

1. ❌ **Sistema Base**: BullMQ + Redis criados mas não integrados
2. ❌ **Worker Assíncrono**: Criado mas não usado pela aplicação
3. ❌ **API Management**: Endpoints funcionam mas não conectados
4. ❌ **Produção**: Sistema legado ainda em uso
5. ⚠️ **Migração Urgente**: Substituir Notificacao/NotificacaoUsuario
6. ⚠️ **Integração Real**: Conectar módulos ao novo sistema
7. ⚠️ **Selecionar e integrar API de WhatsApp**: Definir fornecedor (ex.: Meta Cloud API/Twilio) e implementar canal

---

**Status:** ⚠️ **Backend Criado, Integração Crítica Pendente** - Sistema legado ainda ativo
