# 🔧 Plano de Correção - Auditoria do Sistema de Notificações

**Data:** 25/01/2025  
**Status:** ⏳ **Em Execução** - BullMQ Instalado

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **Etapa 1 - Descoberta e Catálogo de Eventos**
- ❌ Status inconsistente entre documentos
- ❌ Faltam payloads mínimos documentados
- ❌ Faltam roles CONTROLLER e CONVIDADO EXTERNO
- ❌ Matriz Evento × Canal não implementada

### **Etapa 2 - Arquitetura Técnica**
- ❌ Status inconsistente entre documentos
- ✅ BullMQ instalado (package.json atualizado)
- ❌ Diagrama não reflete implementação real
- ❌ Schema Prisma genérico vs implementação específica

### **Etapa 3 - Backend Core**
- ❌ Sistema antigo (`Notificacao`) ainda em uso
- ❌ Novo sistema (`Notification`) não integrado
- ❌ Sem fila/worker assíncrono
- ❌ Canais não implementados (apenas logs)
- ❌ Sem deduplicação/anti-spam
- ❌ Sem agendador de prazos
- ❌ Sem webhooks Asaas

---

## 📋 **PLANO DE CORREÇÃO**

### **FASE 1: Correção da Documentação (1-2 dias)**

#### **1.1 Etapa 1 - Completar Catálogo**
- [ ] Adicionar roles CONTROLLER e CONVIDADO EXTERNO
- [ ] Implementar tabela completa de payloads obrigatórios
- [ ] Criar matriz Evento × Canal funcional
- [ ] Definir políticas de urgência por evento
- [ ] Documentar requisitos LGPD

#### **1.2 Etapa 2 - Atualizar Arquitetura**
- [x] Confirmar BullMQ instalado (concluído)
- [ ] Atualizar diagrama com fila/worker real
- [ ] Documentar schema Prisma específico
- [ ] Implementar estratégia de deduplicação
- [ ] Documentar configurações por ambiente

### **FASE 2: Implementação Real do Backend (3-5 dias)**

#### **2.1 Migração do Sistema Antigo**
- [ ] Analisar sistema atual (`Notificacao`, `NotificacaoUsuario`)
- [ ] Criar script de migração de dados
- [ ] Implementar compatibilidade temporária
- [ ] Deprecar sistema antigo gradualmente

#### **2.2 Implementação da Fila/Worker**
- [x] Instalar BullMQ (já feito)
- [x] Instalar cliente Redis (ioredis) (já feito)
- [ ] Configurar Redis no Vercel
- [ ] Implementar worker assíncrono
- [ ] Implementar retry e dead letter queue

#### **2.3 Implementação dos Canais**
- [ ] Implementar canal EMAIL real (Resend)
- [ ] Implementar canal SMS (Twilio)
- [ ] Implementar canal PUSH (Firebase)
- [ ] Configurar templates por canal

#### **2.4 Sistema de Deduplicação**
- [ ] Implementar hash SHA256 por evento
- [ ] Configurar TTL de 5 minutos
- [ ] Implementar cache Redis para deduplicação
- [ ] Testes de anti-spam

#### **2.5 Agendador de Prazos**
- [ ] Implementar cron job com timezone
- [ ] Alertas D-7, D-3, D-1, H-2
- [ ] Integração com sistema de prazos existente
- [ ] Notificações de vencimento

#### **2.6 Webhooks Asaas**
- [ ] Implementar endpoint de webhook
- [ ] Validação de assinatura
- [ ] Mapeamento de eventos de pagamento
- [ ] Testes de integração

### **FASE 3: Integração com Módulos (2-3 dias)**

#### **3.1 Integração com Server Actions**
- [ ] Processos: eventos de criação, atualização, status
- [ ] Prazos: eventos de proximidade e vencimento
- [ ] Agenda: eventos de criação, atualização, cancelamento
- [ ] Financeiro: eventos de pagamento, falha, atraso
- [ ] Contratos: eventos de assinatura, expiração
- [ ] Documentos: eventos de upload, aprovação, rejeição

#### **3.2 Testes de Integração**
- [ ] Testes unitários para cada módulo
- [ ] Testes de integração end-to-end
- [ ] Testes de performance
- [ ] Testes de isolamento multi-tenant

### **FASE 4: Validação e QA (1-2 dias)**

#### **4.1 Validação Funcional**
- [ ] Smoke test em todos os perfis
- [ ] Teste em todos os tenants
- [ ] Validação de isolamento
- [ ] Teste de carga

#### **4.2 Documentação Final**
- [ ] Atualizar status dos documentos
- [ ] Documentar APIs implementadas
- [ ] Guias de uso para desenvolvedores
- [ ] Troubleshooting guide

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Etapa 1 Concluída quando:**
- ✅ Todos os roles documentados e implementados
- ✅ Tabela completa de payloads obrigatórios
- ✅ Matriz Evento × Canal funcional
- ✅ Políticas de urgência aplicadas

### **Etapa 2 Concluída quando:**
- ✅ BullMQ instalado e configurado
- ✅ Diagrama atualizado com implementação real
- ✅ Schema Prisma específico documentado
- ✅ Estratégia de deduplicação implementada

### **Etapa 3 Concluída quando:**
- ✅ Sistema antigo migrado/deprecado
- ✅ Fila/worker assíncrono funcionando
- ✅ Todos os canais implementados
- ✅ Deduplicação funcionando
- ✅ Agendador de prazos funcionando
- ✅ Webhooks Asaas funcionando
- ✅ Testes automatizados passando

---

## 📊 **CRONOGRAMA ESTIMADO**

| Fase | Duração | Dependências |
|------|---------|--------------|
| **Fase 1** | 1-2 dias | Documentação |
| **Fase 2** | 3-5 dias | Fase 1 |
| **Fase 3** | 2-3 dias | Fase 2 |
| **Fase 4** | 1-2 dias | Fase 3 |
| **TOTAL** | **7-12 dias** | - |

---

## 🚀 **PRÓXIMOS PASSOS IMEDIATOS**

1. ✅ **BullMQ Instalado**: `npm install bullmq redis` (concluído)
2. ✅ **Cliente Redis Instalado**: `ioredis` (concluído)
3. **Configurar Redis**: Vercel Redis addon
4. **Implementar Worker**: Processamento assíncrono
5. **Migrar Sistema Antigo**: Script de migração
6. **Implementar Canais**: EMAIL, SMS, PUSH reais

---

**Status:** ⏳ **Em Execução** - Próximo: Configurar Redis no Vercel
