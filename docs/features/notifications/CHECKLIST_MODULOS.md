# ✅ Checklist de Notificações por Módulo

Este documento rastreia quais eventos de notificação já estão implementados em cada módulo do sistema.

**Última atualização:** 01/11/2024

---

## 📋 Processos

### Eventos Implementados ✅
- [x] `processo.created` - Notifica quando processo é criado
- [x] `processo.updated` - Notifica quando processo é atualizado
- [x] `processo.status_changed` - Notifica mudança de status
- [ ] `processo.document_uploaded` - Pendente: Upload de documento

### Onde está implementado:
- **Server Action:** `app/actions/processos.ts`
- **Integração:** Sistema híbrido (notificações via `NotificationService`)

### Pendências:
- Upload de documentos ainda não dispara notificação automática

---

## ⏰ Prazos

### Eventos Implementados ✅
- [x] `prazo.created` - Notifica quando prazo é criado
- [x] `prazo.expiring_7d` - Notifica 7 dias antes do vencimento
- [x] `prazo.expiring_3d` - Notifica 3 dias antes do vencimento
- [x] `prazo.expiring_1d` - Notifica 1 dia antes do vencimento
- [x] `prazo.expiring_2h` - Notifica 2 horas antes do vencimento
- [x] `prazo.expired` - Notifica quando prazo venceu

### Onde está implementado:
- **Server Action:** `app/actions/andamentos.ts` (criação)
- **Cron Job:** `app/api/cron/check-deadlines/route.ts`
- **Serviço:** `app/lib/notifications/services/deadline-scheduler.ts`

### Status:
✅ **COMPLETO** - Todos os eventos de prazo estão implementados e funcionando via cron diário

---

## 💰 Financeiro

### Eventos Implementados ✅
- [x] `pagamento.created` - Notifica quando pagamento é criado
- [x] `pagamento.paid` - Notifica quando pagamento é confirmado
- [x] `pagamento.failed` - Notifica quando pagamento falha
- [x] `pagamento.overdue` - Notifica quando pagamento está em atraso
- [x] `pagamento.estornado` - Notifica quando pagamento é estornado
- [x] `boleto.generated` - Notifica quando boleto é gerado
- [x] `pix.generated` - Notifica quando PIX é gerado

### Onde está implementado:
- **Server Action:** `app/actions/cobranca-asaas.ts` (geração de boleto/PIX)
- **Webhook:** `app/api/webhooks/asaas/route.ts`
- **Serviço:** `app/lib/notifications/services/asaas-webhook.ts`

### Eventos do Webhook Asaas Mapeados:
- ✅ `PAYMENT_CREATED` → `boleto.generated` / `pix.generated` / `pagamento.created`
- ✅ `PAYMENT_CONFIRMED` → `pagamento.paid`
- ✅ `PAYMENT_RECEIVED` → `pagamento.paid`
- ✅ `PAYMENT_OVERDUE` → `pagamento.overdue`
- ✅ `PAYMENT_UPDATED` (REPROVED_BY_RISK_ANALYSIS) → `pagamento.failed`
- ✅ `PAYMENT_UPDATED` (CHARGEBACK_DISPUTE_LOST) → `pagamento.failed`
- ✅ `PAYMENT_REFUNDED` → `pagamento.estornado`

### Status:
✅ **COMPLETO** - Todos os eventos críticos do Asaas estão mapeados e funcionando

---

## 📝 Contratos

### Eventos Implementados ✅
- [x] `contrato.created` - Notifica quando contrato é criado
- [x] `contrato.signed` - Notifica quando contrato é assinado (status → ATIVO)
- [x] `contrato.expired` - Notifica quando contrato expira
- [x] `contrato.expiring` - Notifica quando contrato está próximo do vencimento (7 dias)
- [x] `contrato.cancelled` - Notifica quando contrato é cancelado
- [x] `contrato.status_changed` - Notifica mudanças gerais de status

### Onde está implementado:
- **Server Action:** `app/actions/contratos.ts` (criação e atualização manual)
- **Cron Job:** `app/api/cron/check-contracts/route.ts`
- **Serviço:** `app/lib/notifications/services/contrato-scheduler.ts`

### Status:
✅ **COMPLETO** - Eventos manuais e automáticos (cron diário) implementados

---

## 📅 Agenda

### Eventos Implementados ✅
- [x] `evento.created` - Notifica quando evento é criado
- [x] `evento.updated` - Notifica quando evento é atualizado
- [x] `evento.cancelled` - Notifica quando evento é cancelado
- [x] `evento.confirmation_updated` - Notifica quando confirmação é atualizada

### Onde está implementado:
- **Server Action:** `app/actions/eventos.ts`
- **Integração:** Sistema híbrido

### Pendências:
- [ ] `evento.reminder_1d` - Lembrete 1 dia antes
- [ ] `evento.reminder_1h` - Lembrete 1 hora antes

### Status:
⚠️ **PARCIAL** - Eventos básicos implementados, lembretes pendentes

---

## 📄 Documentos

### Eventos Implementados
- [ ] `documento.uploaded` - Pendente
- [ ] `documento.approved` - Pendente
- [ ] `documento.rejected` - Pendente
- [ ] `documento.expired` - Pendente

### Status:
❌ **PENDENTE** - Nenhum evento de documento implementado ainda

---

## 👥 Equipe

### Eventos Implementados
- [ ] `equipe.user_invited` - Pendente
- [ ] `equipe.user_joined` - Pendente
- [ ] `equipe.permissions_changed` - Pendente
- [ ] `equipe.user_removed` - Pendente

### Status:
❌ **PENDENTE** - Nenhum evento de equipe implementado ainda

---

## 📊 Resumo Geral

| Módulo | Status | Implementados | Pendentes |
|--------|--------|---------------|-----------|
| Processos | ⚠️ Parcial | 3/4 | 1 |
| Prazos | ✅ Completo | 6/6 | 0 |
| Financeiro | ✅ Completo | 7/7 | 0 |
| Contratos | ✅ Completo | 6/6 | 0 |
| Agenda | ⚠️ Parcial | 4/6 | 2 |
| Documentos | ❌ Pendente | 0/4 | 4 |
| Equipe | ❌ Pendente | 0/4 | 4 |

**Total:** 26/37 eventos implementados (70%)

---

## 🎯 Próximos Passos

1. **Prioridade Alta:**
   - Implementar eventos de Documentos (upload, aprovação, rejeição)
   - Implementar eventos de Equipe (convites, permissões)

2. **Prioridade Média:**
   - Completar lembretes de Agenda (1d, 1h)
   - Implementar `processo.document_uploaded`

3. **Prioridade Baixa:**
   - Revisar e validar todos os eventos com stakeholders
   - Adicionar testes E2E para cada módulo

