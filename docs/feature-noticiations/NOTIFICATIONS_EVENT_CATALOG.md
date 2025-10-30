# 📋 Catálogo de Eventos - Sistema de Notificações Push

**Data de Criação:** 25/01/2025  
**Status:** ⏳ **Em Desenvolvimento** - Catálogo completo, backend não integrado

---

## 🎯 **OBJETIVO**

Este documento mapeia **TODOS os eventos** que devem gerar notificações no sistema Magic Lawyer, organizados por módulo e tipo de usuário.

---

## 👥 **TIPOS DE USUÁRIOS**

### Roles Disponíveis:
- **SUPER_ADMIN** - Administrador do sistema (robsonnonatoiii@gmail.com)
- **ADMIN** - Administrador do escritório
- **ADVOGADO** - Advogado do escritório
- **SECRETARIA** - Secretária/Assistente
- **FINANCEIRO** - Controller financeiro
- **CLIENTE** - Cliente do escritório
- **CONVIDADO EXTERNO** - Advogado terceiro/convidado

---

## 📦 **MÓDULOS DO SISTEMA**

### 1. **PROCESSOS** (`/processos`)
- CRUD de processos
- Upload de documentos
- Timeline de eventos
- Prazos processuais
- Status de processo

### 2. **CLIENTES** (`/clientes`)
- CRUD de clientes
- Upload de documentos
- Histórico de relacionamento
- Dados pessoais/jurídicos

### 3. **ADVOGADOS** (`/advogados`)
- CRUD de advogados
- Upload de avatar
- Dados profissionais
- Permissões

### 4. **EQUIPE** (`/equipe`)
- Gestão de cargos
- Permissões
- Convites
- Vinculações

### 5. **FINANCEIRO** (`/financeiro`)
- Contratos
- Honorários
- Parcelas
- Pagamentos (Asaas)
- Relatórios

### 6. **AGENDA** (`/agenda`)
- Eventos/compromissos
- Sincronização Google Calendar
- Lembretes

### 7. **DOCUMENTOS** (`/documentos`)
- Upload de arquivos
- Modelos de petição
- Modelos de procuração

### 8. **CONTRATOS** (`/contratos`)
- Criação de contratos
- Assinaturas
- Status de contrato

### 9. **PROCURAÇÕES** (`/procuracoes`)
- Criação de procurações
- Assinaturas
- Status

### 10. **JUIZES** (`/juizes`)
- Base de dados de juízes
- Favoritos
- Informações profissionais

### 11. **TAREFAS** (`/tarefas`)
- Kanban de tarefas
- Status de tarefas
- Atribuições

### 12. **RELATÓRIOS** (`/relatorios`)
- Geração de relatórios
- Exportação
- Agendamento

---

## 🔔 **CATÁLOGO DE EVENTOS POR MÓDULO**

### 📋 **1. PROCESSOS**

#### **Eventos de Criação/Alteração:**
- `processo.created` - Novo processo criado
- `processo.updated` - Processo atualizado
- `processo.status_changed` - Status alterado
- `processo.document_uploaded` - Documento anexado
- `processo.part_added` - Parte adicionada ao processo

#### **Eventos de Prazos:**
- `prazo.created` - Novo prazo criado
- `prazo.updated` - Prazo atualizado
- `prazo.expiring_7d` - Prazo vence em 7 dias
- `prazo.expiring_3d` - Prazo vence em 3 dias
- `prazo.expiring_1d` - Prazo vence em 1 dia
- `prazo.expiring_2h` - Prazo vence em 2 horas
- `prazo.expired` - Prazo vencido

#### **Eventos de Movimentação:**
- `movimentacao.created` - Nova movimentação
- `movimentacao.updated` - Movimentação atualizada

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Processos onde é responsável
- **SECRETARIA**: Processos do escritório
- **CLIENTE**: Apenas seus processos

---

### 📋 **2. CLIENTES**

#### **Eventos de Criação/Alteração:**
- `cliente.created` - Novo cliente cadastrado
- `cliente.updated` - Cliente atualizado
- `cliente.document_uploaded` - Documento anexado
- `cliente.contact_added` - Novo contato adicionado

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Clientes vinculados aos seus processos
- **SECRETARIA**: Todos os clientes
- **CLIENTE**: Apenas seus próprios dados

---

### 📋 **3. ADVOGADOS**

#### **Eventos de Criação/Alteração:**
- `advogado.created` - Novo advogado cadastrado
- `advogado.updated` - Advogado atualizado
- `advogado.avatar_updated` - Avatar alterado
- `advogado.permissions_changed` - Permissões alteradas

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Apenas seus próprios dados
- **SECRETARIA**: Todos os advogados

---

### 📋 **4. EQUIPE**

#### **Eventos de Gestão:**
- `equipe.cargo_created` - Novo cargo criado
- `equipe.cargo_updated` - Cargo atualizado
- `equipe.user_invited` - Usuário convidado
- `equipe.user_joined` - Usuário aceitou convite
- `equipe.permissions_changed` - Permissões alteradas
- `equipe.user_removed` - Usuário removido

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Eventos relacionados a ele
- **SECRETARIA**: Eventos de equipe
- **FINANCEIRO**: Eventos relacionados a ele

---

### 📋 **5. FINANCEIRO**

#### **Eventos de Contratos:**
- `contrato.created` - Novo contrato criado
- `contrato.updated` - Contrato atualizado
- `contrato.status_changed` - Status alterado
- `contrato.signature_pending` - Assinatura pendente
- `contrato.signed` - Contrato assinado
- `contrato.expired` - Contrato expirado

#### **Eventos de Pagamentos:**
- `pagamento.created` - Novo pagamento criado
- `pagamento.paid` - Pagamento confirmado
- `pagamento.failed` - Pagamento falhou
- `pagamento.overdue` - Pagamento em atraso
- `boleto.generated` - Boleto gerado
- `pix.generated` - PIX gerado

#### **Eventos de Honorários:**
- `honorario.created` - Honorário criado
- `honorario.updated` - Honorário atualizado
- `honorario.paid` - Honorário pago

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Eventos de seus contratos/honorários
- **FINANCEIRO**: Todos os eventos financeiros
- **CLIENTE**: Eventos de seus contratos/pagamentos

---

### 📋 **6. AGENDA**

#### **Eventos de Compromissos:**
- `evento.created` - Novo evento criado
- `evento.updated` - Evento atualizado
- `evento.cancelled` - Evento cancelado
- `evento.reminder_1h` - Lembrete 1 hora antes
- `evento.reminder_1d` - Lembrete 1 dia antes
- `evento.google_synced` - Sincronizado com Google

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Eventos onde participa
- **SECRETARIA**: Todos os eventos
- **CLIENTE**: Eventos relacionados a ele

---

### 📋 **7. DOCUMENTOS**

#### **Eventos de Upload:**
- `documento.uploaded` - Documento enviado
- `documento.approved` - Documento aprovado
- `documento.rejected` - Documento rejeitado
- `documento.expired` - Documento expirado

#### **Eventos de Modelos:**
- `modelo.created` - Novo modelo criado
- `modelo.updated` - Modelo atualizado
- `modelo.used` - Modelo utilizado

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Documentos de seus processos
- **SECRETARIA**: Todos os documentos
- **CLIENTE**: Seus documentos

---

### 📋 **8. CONTRATOS**

#### **Eventos de Gestão:**
- `contrato.created` - Novo contrato
- `contrato.updated` - Contrato atualizado
- `contrato.signed` - Contrato assinado
- `contrato.expired` - Contrato expirado
- `contrato.cancelled` - Contrato cancelado

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Contratos onde é responsável
- **FINANCEIRO**: Todos os contratos
- **CLIENTE**: Seus contratos

---

### 📋 **9. PROCURAÇÕES**

#### **Eventos de Gestão:**
- `procuracao.created` - Nova procuração
- `procuracao.updated` - Procuração atualizada
- `procuracao.signed` - Procuração assinada
- `procuracao.expired` - Procuração expirada

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Procurações onde é responsável
- **SECRETARIA**: Todas as procurações
- **CLIENTE**: Suas procurações

---

### 📋 **10. JUIZES**

#### **Eventos de Gestão:**
- `juiz.created` - Novo juiz cadastrado
- `juiz.updated` - Juiz atualizado
- `juiz.favorited` - Juiz favoritado
- `juiz.unfavorited` - Juiz desfavoritado

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Juízes favoritados
- **SECRETARIA**: Todos os juízes

---

### 📋 **11. TAREFAS**

#### **Eventos de Kanban:**
- `tarefa.created` - Nova tarefa criada
- `tarefa.updated` - Tarefa atualizada
- `tarefa.assigned` - Tarefa atribuída
- `tarefa.completed` - Tarefa concluída
- `tarefa.moved` - Tarefa movida entre colunas

#### **Usuários que Recebem:**
- **ADMIN**: Todas as tarefas
- **ADVOGADO**: Tarefas atribuídas a ele
- **SECRETARIA**: Todas as tarefas
- **FINANCEIRO**: Tarefas financeiras

---

### 📋 **12. RELATÓRIOS**

#### **Eventos de Geração:**
- `relatorio.generated` - Relatório gerado
- `relatorio.exported` - Relatório exportado
- `relatorio.scheduled` - Relatório agendado
- `relatorio.failed` - Falha na geração

#### **Usuários que Recebem:**
- **ADMIN**: Todos os eventos
- **ADVOGADO**: Relatórios solicitados
- **FINANCEIRO**: Relatórios financeiros
- **SECRETARIA**: Relatórios gerados

---

## 📊 **TABELA DE EVENTOS COM PAYLOAD E URGÊNCIA**

| Evento | Campos Obrigatórios | Urgência | Canais Sugeridos |
|--------|---------------------|----------|------------------|
| `processo.created` | `processoId`, `numero`, `cliente` | MEDIUM | REALTIME, EMAIL |
| `processo.updated` | `processoId`, `numero`, `changes` | MEDIUM | REALTIME |
| `processo.status_changed` | `processoId`, `numero`, `oldStatus`, `newStatus` | HIGH | REALTIME, EMAIL |
| `processo.document_uploaded` | `processoId`, `numero`, `documentName` | MEDIUM | REALTIME |
| `prazo.expiring_7d` | `prazoId`, `processoId`, `numero`, `dataExpiracao` | HIGH | REALTIME, EMAIL |
| `prazo.expiring_3d` | `prazoId`, `processoId`, `numero`, `dataExpiracao` | HIGH | REALTIME, EMAIL |
| `prazo.expiring_1d` | `prazoId`, `processoId`, `numero`, `dataExpiracao` | CRITICAL | REALTIME, EMAIL |
| `prazo.expired` | `prazoId`, `processoId`, `numero`, `dataExpiracao` | CRITICAL | REALTIME, EMAIL |
| `cliente.created` | `clienteId`, `nome`, `email` | MEDIUM | REALTIME |
| `cliente.updated` | `clienteId`, `nome`, `changes` | MEDIUM | REALTIME |
| `advogado.created` | `advogadoId`, `nome`, `email` | MEDIUM | REALTIME |
| `advogado.permissions_changed` | `advogadoId`, `nome`, `oldPermissions`, `newPermissions` | HIGH | REALTIME, EMAIL |
| `equipe.user_invited` | `userId`, `email`, `role` | HIGH | REALTIME, EMAIL |
| `equipe.user_joined` | `userId`, `nome`, `role` | MEDIUM | REALTIME |
| `contrato.created` | `contratoId`, `clienteId`, `valor` | MEDIUM | REALTIME |
| `contrato.signature_pending` | `contratoId`, `clienteId`, `dataVencimento` | HIGH | REALTIME, EMAIL |
| `contrato.signed` | `contratoId`, `clienteId`, `dataAssinatura` | HIGH | REALTIME, EMAIL |
| `pagamento.paid` | `pagamentoId`, `valor`, `metodo` | HIGH | REALTIME, EMAIL |
| `pagamento.failed` | `pagamentoId`, `valor`, `motivo` | CRITICAL | REALTIME, EMAIL |
| `pagamento.overdue` | `pagamentoId`, `valor`, `diasAtraso` | CRITICAL | REALTIME, EMAIL |
| `evento.created` | `eventoId`, `titulo`, `data`, `participantes` | MEDIUM | REALTIME |
| `evento.reminder_1h` | `eventoId`, `titulo`, `data` | HIGH | REALTIME |
| `evento.reminder_1d` | `eventoId`, `titulo`, `data` | MEDIUM | REALTIME, EMAIL |
| `documento.uploaded` | `documentoId`, `nome`, `processoId` | MEDIUM | REALTIME |
| `documento.approved` | `documentoId`, `nome`, `aprovadoPor` | MEDIUM | REALTIME |
| `documento.rejected` | `documentoId`, `nome`, `motivo` | HIGH | REALTIME, EMAIL |
| `tarefa.created` | `tarefaId`, `titulo`, `responsavel` | MEDIUM | REALTIME |
| `tarefa.assigned` | `tarefaId`, `titulo`, `responsavel` | MEDIUM | REALTIME |
| `tarefa.completed` | `tarefaId`, `titulo`, `responsavel` | MEDIUM | REALTIME |
| `relatorio.generated` | `relatorioId`, `tipo`, `dataGeracao` | MEDIUM | REALTIME |
| `relatorio.failed` | `relatorioId`, `tipo`, `erro` | HIGH | REALTIME, EMAIL |

---

## 🎯 **NÍVEIS DE URGÊNCIA**

### **CRÍTICO** 🔴
- Prazos vencidos
- Pagamentos em atraso
- Contratos expirados
- Falhas críticas do sistema

### **ALTO** 🟠
- Prazos próximos do vencimento
- Assinaturas pendentes
- Eventos importantes da agenda
- Mudanças de status críticas

### **MÉDIO** 🟡
- Atualizações de processos
- Novos documentos
- Mudanças de permissões
- Relatórios gerados

### **INFORMATIVO** 🔵
- Novos usuários
- Atualizações de perfil
- Sincronizações
- Atividades gerais

---

## 📱 **MATRIZ EVENTO × CANAL**

| Evento | In-app (Realtime) | Email (Resend) |
|--------|-------------------|----------------|
| **CRÍTICOS** | ✅ | ✅ (template padrão) |
| `prazo.expired` | ✅ | ✅ |
| `pagamento.overdue` | ✅ | ✅ |
| `contrato.expired` | ✅ | ✅ |
| **ALTOS** | ✅ | ✅ (enfileirado) |
| `prazo.expiring_1d` | ✅ | ✅ |
| `prazo.expiring_3d` | ✅ | ✅ |
| `pagamento.failed` | ✅ | ✅ |
| `contrato.signature_pending` | ✅ | ✅ |
| **MÉDIOS** | ✅ | 🟡 (habilitar por evento) |
| `processo.created` | ✅ | 🟡 |
| `processo.updated` | ✅ | 🟡 |
| `cliente.created` | ✅ | 🟡 |
| `evento.created` | ✅ | 🟡 |
| **INFORMATIVOS** | ✅ | 🟡 |
| `advogado.avatar_updated` | ✅ | 🟡 |
| `documento.uploaded` | ✅ | 🟡 |
| `relatorio.generated` | ✅ | 🟡 |

### **Status dos Canais:**

**In-app (Realtime via Ably):**
- ✅ **Implementado** - Via Ably (funcionando)
- ✅ Todos os eventos
- ✅ Instantâneo (< 1s)

**Email:**
- ✅ **Implementado** - Resend com remetente `onboarding@resend.dev`
- ✅ Eventos críticos e altos (entrega validada para `magiclawyersaas@gmail.com`)
- 🟡 Resumos diários (a implementar)
- 🟡 Confirmações automáticas por módulo

### **Legenda:**
- ✅ **Implementado** - Funcionando no código
- ⏳ **Planejado** - Definido mas não implementado
- ❌ **Não Planejado** - Não será implementado para este tipo de evento

---

## ⚠️ **STATUS REAL**

1. ✅ **Mapeamento Completo** - Este documento
2. ✅ **Validação com Stakeholders** - Eventos e usuários definidos
3. ✅ **Definição de Payloads** - Estrutura de dados implementada
4. ⏳ **Implementação Backend** - Sistema híbrido envia via fila + canais reais (default ON quando env não definida)
5. ❌ **Implementação Frontend** - Interface não implementada

### **🚨 Problema Crítico:**
- Sistema ainda usa **Notificacao/NotificacaoUsuario** legado via `HybridNotificationService`
- Módulos migrados: eventos, andamentos, prazos (demais módulos pendentes)
- Necessário ativar `NOTIFICATION_USE_NEW_SYSTEM=true` após homologação completa

---

**Status:** ⏳ **Backend Criado, Migração em Progresso** - Sistema híbrido até concluir rollout
