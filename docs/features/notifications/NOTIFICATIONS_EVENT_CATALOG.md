# 📋 Catálogo de Eventos - Sistema de Notificações Push

**Data de Criação:** 25/01/2025  

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

## 📊 **TABELA OFICIAL DE EVENTOS COM PAYLOAD MÍNIMO OBRIGATÓRIO**

> **Critério de Homologação:** Todos os campos listados como "obrigatórios" devem estar presentes no payload do evento. Campos opcionais podem ser incluídos conforme necessário.

### **MÓDULO: PROCESSOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `processo.created` | `processoId` (string), `numero` (string), `clienteNome` (string) | `clienteId`, `titulo`, `status`, `area`, `advogadoResponsavelId` | MEDIUM | REALTIME, EMAIL |
| `processo.updated` | `processoId` (string), `numero` (string) | `changes` (object), `changesSummary` (string), `status` (string), `statusSummary` (string), `additionalChangesSummary` (string) | MEDIUM | REALTIME |
| `processo.status_changed` | `processoId` (string), `numero` (string), `oldStatus` (string), `newStatus` (string) | `statusSummary` (string), `changesSummary` (string), `additionalChangesSummary` (string) | HIGH | REALTIME, EMAIL |
| `processo.document_uploaded` | `processoId` (string), `numero` (string), `documentoId` (string), `documentoNome` (string) | `documentoTipo`, `uploadedById`, `uploadedByNome` | MEDIUM | REALTIME |

### **MÓDULO: PRAZOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `prazo.created` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `titulo` (string), `dataVencimento` (ISO string) | `andamentoId`, `descricao`, `tipo` | HIGH | REALTIME, EMAIL |
| `prazo.updated` | `prazoId` (string), `processoId` (string), `processoNumero` (string) | `titulo`, `dataVencimento`, `changes` | MEDIUM | REALTIME |
| `prazo.expiring_7d` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `dataVencimento` (ISO string) | `titulo`, `diasRestantes` (number) | HIGH | REALTIME, EMAIL |
| `prazo.expiring_3d` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `dataVencimento` (ISO string) | `titulo`, `diasRestantes` (number) | HIGH | REALTIME, EMAIL |
| `prazo.expiring_1d` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `dataVencimento` (ISO string) | `titulo`, `horasRestantes` (number) | CRITICAL | REALTIME, EMAIL |
| `prazo.expiring_2h` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `dataVencimento` (ISO string) | `titulo`, `horasRestantes` (number) | CRITICAL | REALTIME, EMAIL |
| `prazo.expired` | `prazoId` (string), `processoId` (string), `processoNumero` (string), `dataVencimento` (ISO string) | `titulo`, `diasAtraso` (number) | CRITICAL | REALTIME, EMAIL |

### **MÓDULO: ANDAMENTOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `andamento.created` | `andamentoId` (string), `processoId` (string), `processoNumero` (string), `titulo` (string) | `descricao`, `dataMovimentacao` (ISO string), `criadoPorNome`, `tipo`, `referenciaTipo`, `referenciaId` | MEDIUM | REALTIME, EMAIL |
| `andamento.updated` | `andamentoId` (string), `processoId` (string), `processoNumero` (string), `titulo` (string) | `changesSummary` (string), `descricao`, `dataMovimentacao` | MEDIUM | REALTIME |

### **MÓDULO: CLIENTES**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `cliente.created` | `clienteId` (string), `nome` (string) | `email`, `telefone`, `tipoPessoa` (PF\|PJ), `cpf`/`cnpj` | MEDIUM | REALTIME |
| `cliente.updated` | `clienteId` (string), `nome` (string) | `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `cliente.document_uploaded` | `clienteId` (string), `nome` (string), `documentoId` (string), `documentoNome` (string) | `documentoTipo` | MEDIUM | REALTIME |
| `cliente.contact_added` | `clienteId` (string), `nome` (string), `contatoTipo` (string) | `contatoValor`, `contatoNome` | INFO | REALTIME |

### **MÓDULO: ADVOGADOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `advogado.created` | `advogadoId` (string), `nome` (string) | `email`, `oabNumero`, `oabUf` | MEDIUM | REALTIME |
| `advogado.updated` | `advogadoId` (string), `nome` (string) | `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `advogado.avatar_updated` | `advogadoId` (string), `nome` (string) | `avatarUrl` | INFO | REALTIME |
| `advogado.permissions_changed` | `advogadoId` (string), `nome` (string), `oldPermissions` (array), `newPermissions` (array) | `permissionsSummary` (string) | HIGH | REALTIME, EMAIL |

### **MÓDULO: EQUIPE**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `equipe.cargo_created` | `cargoId` (string), `cargoNome` (string) | `permissions` (array) | MEDIUM | REALTIME |
| `equipe.cargo_updated` | `cargoId` (string), `cargoNome` (string) | `changes` (object), `permissions` (array) | MEDIUM | REALTIME |
| `equipe.user_invited` | `userId` (string), `email` (string), `role` (string) | `nome`, `invitedByNome`, `invitedById` | HIGH | REALTIME, EMAIL |
| `equipe.user_joined` | `userId` (string), `nome` (string), `role` (string) | `email`, `joinedAt` (ISO string) | MEDIUM | REALTIME |
| `equipe.permissions_changed` | `userId` (string), `nome` (string), `oldPermissions` (array), `newPermissions` (array) | `changedByNome`, `changedById` | HIGH | REALTIME, EMAIL |
| `equipe.user_removed` | `userId` (string), `nome` (string), `role` (string) | `removedByNome`, `removedById`, `reason` | HIGH | REALTIME, EMAIL |

### **MÓDULO: FINANCEIRO - CONTRATOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `contrato.created` | `contratoId` (string), `clienteId` (string), `clienteNome` (string) | `numero`, `valor` (number), `tipo`, `status` | MEDIUM | REALTIME |
| `contrato.updated` | `contratoId` (string), `clienteId` (string) | `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `contrato.status_changed` | `contratoId` (string), `oldStatus` (string), `newStatus` (string) | `clienteId`, `clienteNome`, `numero` | HIGH | REALTIME, EMAIL |
| `contrato.signature_pending` | `contratoId` (string), `clienteId` (string), `clienteNome` (string), `dataVencimento` (ISO string) | `numero`, `signatureUrl` | HIGH | REALTIME, EMAIL |
| `contrato.signed` | `contratoId` (string), `clienteId` (string), `clienteNome` (string), `dataAssinatura` (ISO string) | `numero`, `assinadoPor` | HIGH | REALTIME, EMAIL |
| `contrato.expired` | `contratoId` (string), `clienteId` (string), `clienteNome` (string) | `numero`, `dataExpiracao` (ISO string) | CRITICAL | REALTIME, EMAIL |
| `contrato.cancelled` | `contratoId` (string), `clienteId` (string), `clienteNome` (string) | `numero`, `motivo`, `cancelledByNome` | HIGH | REALTIME, EMAIL |

### **MÓDULO: FINANCEIRO - PAGAMENTOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `pagamento.created` | `pagamentoId` (string), `valor` (number), `metodo` (string) | `contratoId`, `clienteId`, `clienteNome`, `parcelaId`, `vencimento` (ISO string) | MEDIUM | REALTIME |
| `pagamento.paid` | `pagamentoId` (string), `valor` (number), `metodo` (string), `dataPagamento` (ISO string) | `contratoId`, `clienteId`, `clienteNome`, `parcelaId`, `transactionId` | HIGH | REALTIME, EMAIL |
| `pagamento.failed` | `pagamentoId` (string), `valor` (number), `motivo` (string) | `contratoId`, `clienteId`, `clienteNome`, `parcelaId`, `errorCode` | CRITICAL | REALTIME, EMAIL |
| `pagamento.overdue` | `pagamentoId` (string), `valor` (number), `diasAtraso` (number) | `contratoId`, `clienteId`, `clienteNome`, `parcelaId`, `vencimento` (ISO string) | CRITICAL | REALTIME, EMAIL |
| `pagamento.estornado` | `pagamentoId` (string), `valor` (number), `dataEstorno` (ISO string) | `contratoId`, `clienteId`, `motivo` | HIGH | REALTIME, EMAIL |
| `boleto.generated` | `pagamentoId` (string), `boletoId` (string), `valor` (number), `vencimento` (ISO string) | `contratoId`, `clienteId`, `barcode`, `boletoUrl` | MEDIUM | REALTIME, EMAIL |
| `pix.generated` | `pagamentoId` (string), `valor` (number), `qrCode` (string) | `contratoId`, `clienteId`, `qrCodeUrl`, `expiraEm` (ISO string) | MEDIUM | REALTIME |

### **MÓDULO: FINANCEIRO - HONORÁRIOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `honorario.created` | `honorarioId` (string), `contratoId` (string), `valor` (number) | `tipo`, `processoId`, `processoNumero`, `descricao` | MEDIUM | REALTIME |
| `honorario.updated` | `honorarioId` (string), `contratoId` (string) | `valor` (number), `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `honorario.paid` | `honorarioId` (string), `contratoId` (string), `valor` (number), `dataPagamento` (ISO string) | `processoId`, `processoNumero`, `parcelaId` | HIGH | REALTIME, EMAIL |

### **MÓDULO: AGENDA**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `evento.created` | `eventoId` (string), `titulo` (string), `dataInicio` (ISO string) | `participanteEmail` (string), `tipoConfirmacao`, `eventoLocal`, `processoId`, `clienteId`, `duracao` (number) | MEDIUM | REALTIME, EMAIL |
| `evento.updated` | `eventoId` (string), `titulo` (string) | `dataInicio` (ISO string), `eventoLocal`, `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `evento.cancelled` | `eventoId` (string), `titulo` (string) | `dataInicio` (ISO string), `motivo`, `cancelledByNome` | HIGH | REALTIME, EMAIL |
| `evento.confirmation_updated` | `eventoId` (string), `titulo` (string), `confirmacaoStatus` (string) | `dataInicio` (ISO string), `participanteEmail`, `confirmadoPor` | MEDIUM | REALTIME |
| `evento.reminder_1h` | `eventoId` (string), `titulo` (string), `dataInicio` (ISO string) | `eventoLocal`, `participantes` (array) | HIGH | REALTIME |
| `evento.reminder_1d` | `eventoId` (string), `titulo` (string), `dataInicio` (ISO string) | `eventoLocal`, `participantes` (array) | MEDIUM | REALTIME, EMAIL |
| `evento.google_synced` | `eventoId` (string), `titulo` (string), `googleEventId` (string) | `dataInicio` (ISO string), `syncStatus` | INFO | REALTIME |

### **MÓDULO: DOCUMENTOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `documento.uploaded` | `documentoId` (string), `nome` (string) | `processoId`, `processoNumero`, `clienteId`, `tipo`, `uploadedById`, `uploadedByNome`, `tamanho` (number) | MEDIUM | REALTIME |
| `documento.approved` | `documentoId` (string), `nome` (string), `aprovadoPor` (string) | `processoId`, `processoNumero`, `aprovadoEm` (ISO string) | MEDIUM | REALTIME |
| `documento.rejected` | `documentoId` (string), `nome` (string), `motivo` (string) | `processoId`, `processoNumero`, `rejeitadoPor`, `rejeitadoEm` (ISO string) | HIGH | REALTIME, EMAIL |
| `documento.expired` | `documentoId` (string), `nome` (string), `dataExpiracao` (ISO string) | `processoId`, `processoNumero`, `clienteId` | MEDIUM | REALTIME, EMAIL |

### **MÓDULO: MODELOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `modelo.created` | `modeloId` (string), `nome` (string), `tipo` (string) | `categoria`, `criadoPorNome` | MEDIUM | REALTIME |
| `modelo.updated` | `modeloId` (string), `nome` (string) | `tipo`, `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `modelo.used` | `modeloId` (string), `nome` (string), `processoId` (string) | `processoNumero`, `usadoPorNome`, `usadoEm` (ISO string) | INFO | REALTIME |

### **MÓDULO: PROCURAÇÕES**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `procuracao.created` | `procuracaoId` (string), `numero` (string) | `processoId`, `processoNumero`, `emitidaEm` (ISO string), `validaAte` (ISO string) | MEDIUM | REALTIME |
| `procuracao.updated` | `procuracaoId` (string), `numero` (string) | `changes` (object), `changesSummary` (string) | MEDIUM | REALTIME |
| `procuracao.signed` | `procuracaoId` (string), `numero` (string), `dataAssinatura` (ISO string) | `processoId`, `processoNumero`, `assinadoPor`, `assinanteNome` | HIGH | REALTIME, EMAIL |
| `procuracao.expired` | `procuracaoId` (string), `numero` (string), `dataExpiracao` (ISO string) | `processoId`, `processoNumero` | CRITICAL | REALTIME, EMAIL |
| `procuracao.revogada` | `procuracaoId` (string), `numero` (string), `dataRevogacao` (ISO string) | `processoId`, `processoNumero`, `revogadaPor`, `motivo` | HIGH | REALTIME, EMAIL |

### **MÓDULO: JUIZES**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `juiz.created` | `juizId` (string), `nome` (string) | `nomeCompleto`, `tribunal`, `vara`, `comarca`, `especialidades` (array) | INFO | REALTIME |
| `juiz.updated` | `juizId` (string), `nome` (string) | `changes` (object), `changesSummary` (string) | INFO | REALTIME |
| `juiz.favorited` | `juizId` (string), `nome` (string), `userId` (string) | `tribunal`, `vara` | INFO | REALTIME |
| `juiz.unfavorited` | `juizId` (string), `nome` (string), `userId` (string) | `tribunal`, `vara` | INFO | REALTIME |

### **MÓDULO: TAREFAS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `tarefa.created` | `tarefaId` (string), `titulo` (string) | `responsavelId`, `responsavelNome`, `prioridade`, `status`, `processoId`, `processoNumero` | MEDIUM | REALTIME |
| `tarefa.updated` | `tarefaId` (string), `titulo` (string) | `changes` (object), `changesSummary` (string), `status`, `prioridade` | MEDIUM | REALTIME |
| `tarefa.assigned` | `tarefaId` (string), `titulo` (string), `responsavelId` (string), `responsavelNome` (string) | `assignedByNome`, `processoId`, `processoNumero` | MEDIUM | REALTIME |
| `tarefa.completed` | `tarefaId` (string), `titulo` (string), `responsavelId` (string), `responsavelNome` (string) | `completedAt` (ISO string), `processoId`, `processoNumero` | MEDIUM | REALTIME |
| `tarefa.moved` | `tarefaId` (string), `titulo` (string), `oldStatus` (string), `newStatus` (string) | `responsavelNome`, `processoId`, `processoNumero` | MEDIUM | REALTIME |
| `tarefa.cancelled` | `tarefaId` (string), `titulo` (string) | `responsavelNome`, `motivo`, `cancelledByNome`, `processoId` | MEDIUM | REALTIME |

### **MÓDULO: RELATÓRIOS**

| Evento | Campos Obrigatórios | Campos Opcionais | Urgência | Canais Sugeridos |
|--------|---------------------|------------------|----------|------------------|
| `relatorio.generated` | `relatorioId` (string), `tipo` (string), `dataGeracao` (ISO string) | `processoId`, `formato`, `tamanho` (number), `url` | MEDIUM | REALTIME |
| `relatorio.exported` | `relatorioId` (string), `tipo` (string), `formato` (string) | `processoId`, `exportedByNome`, `exportedEm` (ISO string) | INFO | REALTIME |
| `relatorio.scheduled` | `relatorioId` (string), `tipo` (string), `dataAgendamento` (ISO string) | `processoId`, `frequencia`, `scheduledByNome` | MEDIUM | REALTIME |
| `relatorio.failed` | `relatorioId` (string), `tipo` (string), `erro` (string) | `processoId`, `errorCode`, `tentativaEm` (ISO string) | HIGH | REALTIME, EMAIL |

---

## 🎯 **POLÍTICAS DE URGÊNCIA E PRIORIZAÇÃO**

> **Critério de Homologação:** Políticas aplicadas em todas as notificações, definindo priorização na fila e comportamento de entrega.

### **NÍVEIS DE URGÊNCIA DEFINIDOS**

#### **CRÍTICO** 🔴
**Prioridade na Fila:** 1 (mais alta)  
**Retenção:** 30 dias (compliance LGPD)  
**Email:** Sempre enviado (ignora preferências)  
**Realtime:** Prioridade máxima, garantia de entrega  
**Regras:**
- Prazos vencidos (`prazo.expired`)
- Pagamentos em atraso (`pagamento.overdue`)
- Contratos expirados (`contrato.expired`)
- Procurações expiradas (`procuracao.expired`)
- Falhas críticas de pagamento (`pagamento.failed`)
- Falhas críticas do sistema (`sistema.critical_error`)

**Comportamento:**
- Não pode ser desabilitado pelo usuário
- Sempre enviado via REALTIME + EMAIL
- Alerta visual destacado (badge vermelho)
- Som/alerta sonoro habilitado
- Notificação push mobile (quando implementado)

#### **ALTO** 🟠
**Prioridade na Fila:** 2  
**Retenção:** 30 dias (compliance LGPD)  
**Email:** Enviado por padrão (configurável)  
**Realtime:** Alta prioridade, entrega rápida  
**Regras:**
- Prazos próximos do vencimento (D-7, D-3, D-1, H-2)
- Assinaturas pendentes (`contrato.signature_pending`)
- Eventos importantes da agenda (`evento.reminder_1d`, `evento.cancelled`)
- Mudanças de status críticas (`processo.status_changed`, `contrato.status_changed`)
- Documentos rejeitados (`documento.rejected`)
- Mudanças de permissões (`equipe.permissions_changed`, `advogado.permissions_changed`)
- Pagamentos confirmados (`pagamento.paid`)

**Comportamento:**
- Pode ser desabilitado pelo usuário (exceto prazos)
- Enviado via REALTIME + EMAIL (email configurável por preferência)
- Alerta visual moderado (badge laranja)
- Sem som/alerta sonoro

#### **MÉDIO** 🟡
**Prioridade na Fila:** 3  
**Retenção:** 30 dias (compliance LGPD)  
**Email:** Opcional (habilitado por preferência)  
**Realtime:** Prioridade normal  
**Regras:**
- Atualizações de processos (`processo.updated`, `processo.created`)
- Novos documentos (`documento.uploaded`)
- Mudanças de permissões informativas
- Relatórios gerados (`relatorio.generated`)
- Novos clientes/advogados (`cliente.created`, `advogado.created`)
- Eventos criados (`evento.created`)
- Andamentos criados (`andamento.created`)

**Comportamento:**
- Pode ser totalmente desabilitado pelo usuário
- Enviado via REALTIME (EMAIL opcional por preferência)
- Alerta visual padrão (badge amarelo)
- Sem som/alerta sonoro

#### **INFORMATIVO** 🔵
**Prioridade na Fila:** 4 (mais baixa)  
**Retenção:** 30 dias (compliance LGPD)  
**Email:** Desabilitado por padrão  
**Realtime:** Prioridade baixa  
**Regras:**
- Novos usuários na equipe
- Atualizações de perfil (`advogado.avatar_updated`)
- Sincronizações (`evento.google_synced`)
- Atividades gerais não críticas
- Favoritos (`juiz.favorited`)
- Modelos usados (`modelo.used`)

**Comportamento:**
- Pode ser totalmente desabilitado pelo usuário
- Apenas REALTIME (EMAIL sempre desabilitado)
- Alerta visual discreto (badge azul)
- Sem som/alerta sonoro

---

## 🔒 **REQUISITOS DE COMPLIANCE LGPD**

### **1. POLÍTICA DE RETENÇÃO**

**Regra Geral:**
- Todas as notificações são **retenidas por 30 dias** no banco de dados
- Após 30 dias, dados são **automaticamente removidos** (soft delete + hard delete após 90 dias)
- Campo `expiresAt` define data de expiração baseada na urgência (todos 30 dias para compliance)

**Exceções:**
- Eventos críticos podem ter retenção estendida a 90 dias (auditoria)
- Logs de auditoria mantêm retenção de 1 ano (separado do sistema de notificações)

**Implementação:**
```typescript
// Cálculo automático em NotificationService
expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
```

### **2. CONSENTIMENTO E OPT-IN/OPT-OUT**

**Regras:**
- **Opt-out por padrão**: Usuários podem desabilitar notificações a qualquer momento
- **Opt-in para email**: Email requer consentimento explícito (configurável por evento)
- **Críticos não opt-out**: Eventos CRITICAL não podem ser desabilitados (conformidade legal)
- **Logs de consentimento**: Todas as alterações de preferências são registradas com timestamp

**Auditoria:**
```sql
-- Tabela de logs de consentimento (futura implementação)
CREATE TABLE NotificationConsentLog (
  id UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  userId UUID NOT NULL,
  eventType VARCHAR(100),
  action VARCHAR(50), -- 'ENABLED', 'DISABLED', 'CHANNEL_CHANGED'
  previousState JSONB,
  newState JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### **3. ISOLAMENTO DE DADOS ENTRE TENANTS**

**Regras:**
- **Isolamento total**: Notificações de um tenant **nunca** são visíveis para outro tenant
- **Validação em todas as queries**: `WHERE tenantId = ?` obrigatório
- **Canais separados**: Canais Ably isolados por tenant (`ml-dev:tenant:{tenantId}`)
- **Índices**: Índices compostos garantem performance e isolamento

### **4. DIREITO AO ESQUECIMENTO (Art. 18, VI LGPD)**

**Implementação:**
- Usuário pode **excluir todas suas notificações** via ação `clearAllNotifications`
- Soft delete aplicado primeiro, hard delete após 90 dias
- Logs de auditoria mantidos por 1 ano (conformidade legal)

**Ação do Usuário:**
```typescript
// Frontend: Botão "Limpar Todas as Notificações"
await clearAllNotifications(); // Soft delete imediato
```

### **5. DADOS MINIMIZADOS NO PAYLOAD**

**Regras:**
- Apenas dados **necessários** são incluídos no payload
- **Sem dados sensíveis**: CPF/CNPJ, senhas, tokens nunca no payload
- **IDs apenas**: IDs de referência, nomes básicos, não dados completos
- **Sanitização**: Payloads sanitizados antes de salvar no banco

**Exemplo Correto:**
```typescript
// ✅ BOM - Dados mínimos
{
  processoId: "proc-123",
  numero: "1234567-89.2024.8.05.0001",
  clienteNome: "João Silva"
}

// ❌ RUIM - Dados completos
{
  processo: { /* objeto completo */ },
  cliente: { cpf: "...", endereco: {...}, ... }
}
```

### **6. TRANSPARÊNCIA E ACESSIBILIDADE**

**Regras:**
- Usuário tem **acesso total** às suas notificações via API
- **Exportação**: Pode exportar histórico de notificações (CSV/JSON)
- **Visualização**: Todas as notificações visíveis no centro de notificações
- **Marcação de leitura**: Usuário controla marcação de lido/não lido

**Endpoints:**
- `GET /api/notifications` - Listar notificações
- `GET /api/notifications/export` - Exportar histórico
- `GET /api/notifications/preferences` - Ver preferências
- `PUT /api/notifications/preferences` - Atualizar preferências

### **7. SEGURANÇA E CIFRAGEM**

**Regras:**
- Dados em trânsito: **HTTPS obrigatório** (Ably, Email)
- Dados em repouso: **Cifrados no banco** (PostgreSQL com SSL)
- Payloads sensíveis: **Hash** de dados sensíveis quando necessário
- Logs: **Sem dados sensíveis** nos logs estruturados

### **8. NOTIFICAÇÃO DE VIOLAÇÃO (Art. 48 LGPD)**

**Procedimento:**
- Em caso de vazamento de dados, notificar ANPD e usuários afetados em **72 horas**
- Sistema de alerta interno para detecção de anomalias
- Logs de auditoria para rastreamento de acessos

---

## 📋 **CHECKLIST DE COMPLIANCE LGPD**

Antes de homologação, validar:

- [ ] Política de retenção de 30 dias implementada
- [ ] Opt-out funcional para todos os eventos (exceto críticos)
- [ ] Isolamento total entre tenants validado
- [ ] Direito ao esquecimento implementado
- [ ] Dados minimizados no payload validado
- [ ] Exportação de dados funcionando
- [ ] Logs de consentimento registrados
- [ ] HTTPS obrigatório em todas as comunicações
- [ ] Cifragem de dados em repouso ativa
- [ ] Documentação de procedimentos de violação disponível

---

## 📱 **MATRIZ OFICIAL EVENTO × USUÁRIO × CANAL**

> **Critério de Homologação:** Esta matriz define quem recebe cada evento e em quais canais. Validação obrigatória com stakeholders antes de implementação.

### **Legenda de Canais:**
- ✅ **REALTIME** - Notificação in-app via WebSocket (Ably)
- ✅ **EMAIL** - Notificação via email (Nodemailer per-tenant)
- 🟡 **CONDICIONAL** - Habilitado por preferência do usuário ou configuração
- ❌ **NÃO APLICÁVEL** - Não enviado para este perfil

### **MÓDULO: PROCESSOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `processo.created` | ✅ REALTIME, EMAIL | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ✅ REALTIME (seu processo) | ✅ REALTIME (se vinculado) |
| `processo.updated` | ✅ REALTIME | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ✅ REALTIME (seu processo) | ✅ REALTIME (se vinculado) |
| `processo.status_changed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ✅ REALTIME, EMAIL (seu processo) | ✅ REALTIME (se vinculado) |
| `processo.document_uploaded` | ✅ REALTIME | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ✅ REALTIME (seu processo) | ✅ REALTIME (se vinculado) |

### **MÓDULO: PRAZOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `prazo.created` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME | ❌ | ❌ | ❌ |
| `prazo.updated` | ✅ REALTIME | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ❌ | ❌ |
| `prazo.expiring_7d` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ❌ | ❌ |
| `prazo.expiring_3d` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ❌ | ❌ |
| `prazo.expiring_1d` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ❌ | ❌ |
| `prazo.expiring_2h` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ❌ | ❌ |
| `prazo.expired` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ✅ REALTIME, EMAIL | ❌ | ❌ | ❌ |

### **MÓDULO: ANDAMENTOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `andamento.created` | ✅ REALTIME | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ✅ REALTIME, EMAIL (seu processo) | ✅ REALTIME (se vinculado) |
| `andamento.updated` | ✅ REALTIME | ✅ REALTIME (se responsável) | ✅ REALTIME | ❌ | ✅ REALTIME (seu processo) | ✅ REALTIME (se vinculado) |

### **MÓDULO: CLIENTES**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `cliente.created` | ✅ REALTIME | ✅ REALTIME (clientes vinculados) | ✅ REALTIME | ❌ | ❌ | ❌ |
| `cliente.updated` | ✅ REALTIME | ✅ REALTIME (clientes vinculados) | ✅ REALTIME | ❌ | ✅ REALTIME (próprio perfil) | ❌ |
| `cliente.document_uploaded` | ✅ REALTIME | ✅ REALTIME (clientes vinculados) | ✅ REALTIME | ❌ | ✅ REALTIME (seu documento) | ❌ |
| `cliente.contact_added` | ✅ REALTIME | ✅ REALTIME (clientes vinculados) | ✅ REALTIME | ❌ | ❌ | ❌ |

### **MÓDULO: ADVOGADOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `advogado.created` | ✅ REALTIME | ❌ | ✅ REALTIME | ❌ | ❌ | ❌ |
| `advogado.updated` | ✅ REALTIME | ✅ REALTIME (próprio perfil) | ✅ REALTIME | ❌ | ❌ | ❌ |
| `advogado.avatar_updated` | ✅ REALTIME | ✅ REALTIME (próprio perfil) | ✅ REALTIME | ❌ | ❌ | ❌ |
| `advogado.permissions_changed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se afetado) | ✅ REALTIME | ❌ | ❌ | ❌ |

### **MÓDULO: EQUIPE**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `equipe.cargo_created` | ✅ REALTIME | ❌ | ✅ REALTIME | ❌ | ❌ | ❌ |
| `equipe.cargo_updated` | ✅ REALTIME | ❌ | ✅ REALTIME | ❌ | ❌ | ❌ |
| `equipe.user_invited` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se convidado) | ✅ REALTIME | ✅ REALTIME, EMAIL (se convidado) | ❌ | ✅ REALTIME, EMAIL (se convidado) |
| `equipe.user_joined` | ✅ REALTIME | ✅ REALTIME (se entrou) | ✅ REALTIME | ✅ REALTIME (se entrou) | ❌ | ✅ REALTIME (se entrou) |
| `equipe.permissions_changed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se afetado) | ✅ REALTIME | ✅ REALTIME, EMAIL (se afetado) | ❌ | ✅ REALTIME (se afetado) |
| `equipe.user_removed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se removido) | ✅ REALTIME | ✅ REALTIME, EMAIL (se removido) | ❌ | ✅ REALTIME, EMAIL (se removido) |

### **MÓDULO: FINANCEIRO - CONTRATOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `contrato.created` | ✅ REALTIME | ✅ REALTIME (se responsável) | ❌ | ✅ REALTIME | ✅ REALTIME (seu contrato) | ❌ |
| `contrato.updated` | ✅ REALTIME | ✅ REALTIME (se responsável) | ❌ | ✅ REALTIME | ✅ REALTIME (seu contrato) | ❌ |
| `contrato.status_changed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |
| `contrato.signature_pending` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |
| `contrato.signed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |
| `contrato.expired` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |
| `contrato.cancelled` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |

### **MÓDULO: FINANCEIRO - PAGAMENTOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `pagamento.created` | ✅ REALTIME | ✅ REALTIME (se vinculado) | ❌ | ✅ REALTIME | ✅ REALTIME (seu pagamento) | ❌ |
| `pagamento.paid` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se vinculado) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu pagamento) | ❌ |
| `pagamento.failed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se vinculado) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu pagamento) | ❌ |
| `pagamento.overdue` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se vinculado) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu pagamento) | ❌ |
| `pagamento.estornado` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se vinculado) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu pagamento) | ❌ |
| `boleto.generated` | ✅ REALTIME | ✅ REALTIME (se vinculado) | ❌ | ✅ REALTIME | ✅ REALTIME, EMAIL (seu boleto) | ❌ |
| `pix.generated` | ✅ REALTIME | ✅ REALTIME (se vinculado) | ❌ | ✅ REALTIME | ✅ REALTIME, EMAIL (seu PIX) | ❌ |

### **MÓDULO: FINANCEIRO - HONORÁRIOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `honorario.created` | ✅ REALTIME | ✅ REALTIME (se responsável) | ❌ | ✅ REALTIME | ✅ REALTIME (seu contrato) | ❌ |
| `honorario.updated` | ✅ REALTIME | ✅ REALTIME (se responsável) | ❌ | ✅ REALTIME | ✅ REALTIME (seu contrato) | ❌ |
| `honorario.paid` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se responsável) | ❌ | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (seu contrato) | ❌ |

### **MÓDULO: AGENDA**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `evento.created` | ✅ REALTIME | ✅ REALTIME (se participante) | ✅ REALTIME | ❌ | ✅ REALTIME (se participante) | ✅ REALTIME (se participante) |
| `evento.updated` | ✅ REALTIME | ✅ REALTIME (se participante) | ✅ REALTIME | ❌ | ✅ REALTIME (se participante) | ✅ REALTIME (se participante) |
| `evento.cancelled` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se participante) | ✅ REALTIME, EMAIL | ❌ | ✅ REALTIME, EMAIL (se participante) | ✅ REALTIME, EMAIL (se participante) |
| `evento.confirmation_updated` | ✅ REALTIME | ✅ REALTIME (se participante) | ✅ REALTIME | ❌ | ✅ REALTIME (se participante) | ✅ REALTIME (se participante) |
| `evento.reminder_1h` | ✅ REALTIME | ✅ REALTIME (se participante) | ✅ REALTIME | ❌ | ✅ REALTIME (se participante) | ✅ REALTIME (se participante) |
| `evento.reminder_1d` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se participante) | ✅ REALTIME, EMAIL | ❌ | ✅ REALTIME, EMAIL (se participante) | ✅ REALTIME, EMAIL (se participante) |
| `evento.google_synced` | ✅ REALTIME | ✅ REALTIME (se participante) | ✅ REALTIME | ❌ | ❌ | ❌ |

### **MÓDULO: DOCUMENTOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `documento.uploaded` | ✅ REALTIME | ✅ REALTIME (documentos vinculados) | ✅ REALTIME | ❌ | ✅ REALTIME (seu documento) | ✅ REALTIME (se vinculado) |
| `documento.approved` | ✅ REALTIME | ✅ REALTIME (documentos vinculados) | ✅ REALTIME | ❌ | ✅ REALTIME (seu documento) | ✅ REALTIME (se vinculado) |
| `documento.rejected` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (documentos vinculados) | ✅ REALTIME, EMAIL | ❌ | ✅ REALTIME, EMAIL (seu documento) | ✅ REALTIME (se vinculado) |
| `documento.expired` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (documentos vinculados) | ✅ REALTIME, EMAIL | ❌ | ✅ REALTIME, EMAIL (seu documento) | ❌ |

### **MÓDULO: TAREFAS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `tarefa.created` | ✅ REALTIME | ✅ REALTIME (se atribuído) | ✅ REALTIME | ✅ REALTIME (tarefas financeiras) | ❌ | ❌ |
| `tarefa.updated` | ✅ REALTIME | ✅ REALTIME (se atribuído) | ✅ REALTIME | ✅ REALTIME (tarefas financeiras) | ❌ | ❌ |
| `tarefa.assigned` | ✅ REALTIME | ✅ REALTIME, EMAIL (se atribuído) | ✅ REALTIME | ✅ REALTIME, EMAIL (se atribuído) | ❌ | ❌ |
| `tarefa.completed` | ✅ REALTIME | ✅ REALTIME (se atribuído) | ✅ REALTIME | ✅ REALTIME (tarefas financeiras) | ❌ | ❌ |
| `tarefa.moved` | ✅ REALTIME | ✅ REALTIME (se atribuído) | ✅ REALTIME | ✅ REALTIME (tarefas financeiras) | ❌ | ❌ |
| `tarefa.cancelled` | ✅ REALTIME | ✅ REALTIME (se atribuído) | ✅ REALTIME | ✅ REALTIME (tarefas financeiras) | ❌ | ❌ |

### **MÓDULO: RELATÓRIOS**

| Evento | ADMIN | ADVOGADO | SECRETARIA | FINANCEIRO | CLIENTE | CONVIDADO EXTERNO |
|--------|-------|----------|------------|------------|--------|-------------------|
| `relatorio.generated` | ✅ REALTIME | ✅ REALTIME (se solicitou) | ✅ REALTIME | ✅ REALTIME (relatórios financeiros) | ❌ | ❌ |
| `relatorio.exported` | ✅ REALTIME | ✅ REALTIME (se solicitou) | ✅ REALTIME | ✅ REALTIME (relatórios financeiros) | ❌ | ❌ |
| `relatorio.scheduled` | ✅ REALTIME | ✅ REALTIME (se agendou) | ✅ REALTIME | ✅ REALTIME (relatórios financeiros) | ❌ | ❌ |
| `relatorio.failed` | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (se solicitou) | ✅ REALTIME, EMAIL | ✅ REALTIME, EMAIL (relatórios financeiros) | ❌ | ❌ |

---

### **Notas Importantes da Matriz:**

1. **ADVOGADO**: Recebe eventos apenas de processos/clientes onde é **responsável** ou **vinculado**
2. **SECRETARIA**: Recebe eventos gerais do escritório, exceto financeiros sensíveis
3. **FINANCEIRO**: Recebe apenas eventos financeiros e relacionados a equipe
4. **CLIENTE**: Recebe apenas eventos relacionados aos **seus próprios** processos/contratos/documentos
5. **CONVIDADO EXTERNO**: Recebe apenas eventos onde foi explicitamente **vinculado** (ex: processo, evento)
6. **EMAIL**: Enviado sempre que marcado, exceto para eventos INFO (configurável por preferência)

### **Status dos Canais:**

**In-app (Realtime via Ably):**
- ✅ **Implementado** - Via Ably (funcionando)
- ✅ Todos os eventos
- ✅ Instantâneo (< 1s)

**Email:**
- ✅ **Implementado** - Resend com remetente `onboarding@resend.dev`
- ✅ Eventos críticos e altos (entrega validada para `robsonnonatoiii@gmail.com`)
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

**Status:** ⏳ **Documentação Completa, Implementação em Progresso** - Tabelas oficiais criadas com 75+ eventos documentados, aguardando homologação com stakeholders e validação funcional
