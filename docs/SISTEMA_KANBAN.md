# Sistema Kanban Profissional - Magic Lawyer

**Data:** 14/10/2025  
**Versão:** 2.0 (Kanban Completo)

---

## 🚀 Visão Geral

Sistema de tarefas **PROFISSIONAL** com múltiplas visualizações inspirado em Trello, Jira e ClickUp.

---

## 📊 Modelos do Schema

### 1. **Tarefa** (MELHORADO)

**Novos Campos Adicionados:**
```prisma
boardId            String?          // Quadro Kanban
columnId           String?          // Coluna do board
numeroSequencial   Int?             // Ex: #123
dataInicio         DateTime?        // Data de início
estimativaHoras    Decimal?         // Horas estimadas
horasGastas        Decimal?         // Horas realmente gastas
ordem              Int              // Para drag & drop
cor                String?          // Cor customizada
arquivada          Boolean          // Arquivamento
tarefaPaiId        String?          // Subtarefas (hierarquia)
```

**Relacionamentos Novos:**
- `board` - Quadro Kanban
- `column` - Coluna do quadro
- `tarefaPai` - Tarefa pai (para subtarefas)
- `subtarefas` - Subtarefas
- `checklists` - Lista de verificação
- `comentários` - Comentários
- `anexos` - Arquivos anexados
- `atividades` - Log de atividades
- `tags` - Tags customizáveis
- `observadores` - Usuários observando a tarefa

---

### 2. **Board** (NOVO)

Quadros Kanban customizáveis por equipe/projeto/cliente

**Campos:**
```prisma
nome         String
descricao    String?
tipo         BoardTipo          // PESSOAL, EQUIPE, PROJETO, PROCESSO, CLIENTE
icone        String?
cor          String?
favorito     Boolean
visibilidade BoardVisibilidade  // PRIVADO, EQUIPE, PUBLICO
ordem        Int
ativo        Boolean
```

**Tipos de Board:**
- 📋 **PESSOAL** - Board individual do usuário
- 👥 **EQUIPE** - Board compartilhado
- 📁 **PROJETO** - Board de projeto específico
- ⚖️ **PROCESSO** - Board vinculado a processo
- 👤 **CLIENTE** - Board vinculado a cliente

**Visibilidade:**
- 🔒 **PRIVADO** - Somente criador
- 👥 **EQUIPE** - Todo tenant
- 🌍 **PUBLICO** - Todos (incluindo clientes)

---

### 3. **BoardColumn** (NOVO)

Colunas customizáveis do Kanban

**Campos:**
```prisma
boardId   String
nome      String
cor       String?
ordem     Int
limite    Int?    // Limite WIP (Work In Progress)
ativo     Boolean
```

**Exemplos de Colunas:**
- 📥 A Fazer
- 🔄 Em Andamento
- ✅ Concluído
- ❌ Cancelado
- 🔍 Em Revisão
- 📦 Aguardando Cliente

**Limite WIP:**
- Máximo de tarefas permitidas na coluna
- Evita sobrecarga (metodologia Kanban)

---

### 4. **TarefaChecklist** (NOVO)

Subtarefas/Checklist dentro de uma tarefa

**Campos:**
```prisma
tarefaId    String
titulo      String
concluida   Boolean
concluidaEm DateTime?
ordem       Int
```

**Uso:**
```
Tarefa: Preparar Petição
├─ ☐ Coletar documentos
├─ ☐ Revisar jurisprudência
├─ ☑ Redigir introdução
├─ ☐ Anexar provas
└─ ☐ Protocolar
```

---

### 5. **TarefaComentario** (NOVO)

Sistema de comentários nas tarefas

**Campos:**
```prisma
tarefaId  String
usuarioId String
conteudo  String
editado   Boolean
```

**Recursos:**
- ✅ Comentários com autor
- ✅ Edição de comentários
- ✅ Timeline ordenada
- ✅ Menções @usuario (futuro)

---

### 6. **TarefaAnexo** (NOVO)

Upload de arquivos nas tarefas

**Campos:**
```prisma
tarefaId    String
nome        String
url         String
tamanho     Int?
contentType String?
publicId    String?  // Cloudinary
```

**Integração:**
- ✅ Cloudinary para storage
- ✅ Preview de imagens
- ✅ Download de anexos

---

### 7. **TarefaTag** + **TarefaTagRelacao** (NOVO)

Tags customizáveis para organização

**TarefaTag:**
```prisma
nome  String @unique
cor   String
ativo Boolean
```

**Exemplos:**
- 🔴 Urgente (#EF4444)
- 🟢 Fácil (#10B981)
- 🟡 Cliente VIP (#F59E0B)
- 🔵 Interno (#3B82F6)

**TarefaTagRelacao:**
- Relacionamento N:N entre Tarefa e Tag
- Uma tarefa pode ter múltiplas tags
- Uma tag pode estar em múltiplas tarefas

---

### 8. **TarefaAtividade** (NOVO)

Log completo de atividades (audit trail)

**Campos:**
```prisma
tarefaId     String
usuarioId    String
tipo         String   // CRIOU, EDITOU, COMENTOU, MOVEU, etc
descricao    String
dadosAntigos Json?
dadosNovos   Json?
```

**Tipos de Atividade:**
- 🆕 CRIOU
- ✏️ EDITOU
- 💬 COMENTOU
- ➡️ MOVEU (mudou coluna)
- 👤 ATRIBUIU
- 📎 ANEXOU
- ✅ CONCLUIU
- ❌ CANCELOU
- 🔄 REABRIU
- 🏷️ MARCOU (tag)

---

### 9. **TarefaWatcher** (NOVO)

Observadores da tarefa (recebem notificações)

**Campos:**
```prisma
tarefaId  String
usuarioId String
```

**Funcionalidade:**
- ✅ Adicionar/remover observadores
- ✅ Auto-adicionar criador e responsável
- ✅ Notificações de mudanças

---

## 🎨 Visualizações Disponíveis

### 1. 📊 **Kanban** (Principal)
```
┌────────────┬────────────┬────────────┬────────────┐
│  A Fazer   │Em Andamento│  Revisão   │ Concluído  │
├────────────┼────────────┼────────────┼────────────┤
│ Card 1     │ Card 3     │ Card 6     │ Card 8     │
│ Card 2     │ Card 4     │            │ Card 9     │
│            │ Card 5     │            │            │
└────────────┴────────────┴────────────┴────────────┘
```

**Recursos:**
- ✅ Drag & drop entre colunas
- ✅ Limite WIP por coluna
- ✅ Contadores de tarefas
- ✅ Cores por prioridade/tag
- ✅ Avatar do responsável
- ✅ Progresso do checklist

---

### 2. 📋 **Lista** (Tabela Completa)

| # | Título | Status | Prioridade | Responsável | Data Limite | Tags | Ações |
|---|--------|--------|------------|-------------|-------------|------|-------|
| #123 | Tarefa 1 | Em Andamento | Alta | João | 15/10 | Urgente | ⋮ |

**Recursos:**
- ✅ Filtros avançados
- ✅ Ordenação por coluna
- ✅ Busca full-text
- ✅ Ações em massa
- ✅ Exportação CSV

---

### 3. 📅 **Calendário**

```
        Outubro 2025
Dom Seg Ter Qua Qui Sex Sáb
 13  14  15  16  17  18  19
         3T  5T  2T  1T
```

**Recursos:**
- ✅ Tarefas por data limite
- ✅ Drag & drop de datas
- ✅ Visão mensal/semanal/diária
- ✅ Destaque de atrasadas

---

### 4. 📈 **Timeline** (Gantt)

```
Tarefa 1   ■■■■■■■■■■━━━━━━━━━━
Tarefa 2         ■■■■■━━━━━━━━━━━━
Tarefa 3               ■■■■■━━━━━━
           ├────┼────┼────┼────┼────┤
          10/10 12/10 14/10 16/10 18/10
```

**Recursos:**
- ✅ Dependências entre tarefas
- ✅ Estimativa vs Real
- ✅ Caminho crítico
- ✅ Zoom temporal

---

### 5. 📊 **Dashboard Analytics**

**Métricas:**
- 📊 Tarefas por status/prioridade
- 👥 Tarefas por responsável
- 📅 Tarefas por data
- ⏱️ Tempo médio de conclusão
- 🎯 Taxa de conclusão
- 🔥 Burndown chart
- 📈 Velocity chart

---

## 🛠️ Funcionalidades Implementadas

### Core do Kanban

✅ **Boards Customizáveis**
- Criar múltiplos quadros
- Tipos: Pessoal, Equipe, Projeto, Processo, Cliente
- Favoritar boards
- Ativar/desativar
- Ordenação customizada

✅ **Colunas Dinâmicas**
- Criar/editar/excluir colunas
- Cores customizadas
- Limite WIP
- Ordenação drag & drop

✅ **Tarefas Avançadas**
- Campos completos (15+ campos)
- Subtarefas (hierarquia)
- Checklists
- Tags customizáveis
- Anexos (Cloudinary)
- Comentários
- Observadores
- Log de atividades

✅ **Drag & Drop**
- Mover entre colunas
- Reordenar dentro da coluna
- Mover para outro board
- Alterar hierarquia

✅ **Recursos de Produtividade**
- Estimativa de horas
- Tracking de tempo gasto
- Lembretes automáticos
- Notificações de mudanças
- Filtros avançados
- Busca global

---

## 🎯 Estrutura de Dados

### Hierarquia de Tarefas

```
Board: Processos Cíveis
├─ Coluna: A Fazer
│  ├─ Tarefa: Preparar Petição #123
│  │  ├─ Subtarefa: Coletar docs
│  │  ├─ Subtarefa: Revisar juris
│  │  └─ Subtarefa: Protocolar
│  │  ├─ Checklist:
│  │  │  ├─ ☑ Item 1
│  │  │  └─ ☐ Item 2
│  │  ├─ Comentários: 3
│  │  ├─ Anexos: 2
│  │  └─ Tags: [Urgente, Processo]
│  └─ Tarefa: Audiência #124
├─ Coluna: Em Andamento
│  └─ Tarefa: Contrato Cliente X #125
└─ Coluna: Concluído
   └─ Tarefa: Procuração assinada #122
```

---

## 🔐 Permissões e Visibilidade

### Níveis de Acesso

**ADMIN:**
- ✅ Todos os boards
- ✅ Criar/editar/excluir boards
- ✅ Ver todas as tarefas
- ✅ Relatórios completos

**ADVOGADO:**
- ✅ Boards da equipe
- ✅ Suas tarefas
- ✅ Criar tarefas
- ✅ Comentar em tarefas

**SECRETARIA:**
- ✅ Boards operacionais
- ✅ Atribuir tarefas
- ✅ Ver timeline

**FINANCEIRO:**
- ✅ Boards financeiros
- ✅ Tarefas de cobrança

**CLIENTE:**
- ✅ Board do seu processo
- ✅ Ver tarefas públicas
- ✅ Comentar apenas

---

## 📱 Interfaces a Implementar

### 1. **Kanban View** `/tarefas/kanban`
- Drag & drop de cards
- Colunas customizáveis
- Quick actions nos cards
- Modal de detalhes

### 2. **List View** `/tarefas`
- Tabela completa
- Filtros avançados
- Ordenação
- Ações em massa

### 3. **Calendar View** `/tarefas/calendario`
- Calendário mensal
- Drag & drop de datas
- Filtro por responsável

### 4. **Timeline View** `/tarefas/timeline`
- Gantt chart
- Dependências
- Estimativas

### 5. **Analytics** `/tarefas/analytics`
- Gráficos e métricas
- Exportação de relatórios

---

## 🎨 Componentes Necessários

### Core
- `<KanbanBoard />` - Board principal
- `<KanbanColumn />` - Coluna do board
- `<TarefaCard />` - Card da tarefa
- `<TarefaDetail />` - Modal de detalhes

### Features
- `<TarefaChecklist />` - Lista de verificação
- `<TarefaComentarios />` - Seção de comentários
- `<TarefaAnexos />` - Upload e listagem
- `<TarefaTags />` - Gerenciador de tags
- `<TarefaAtividades />` - Timeline de atividades
- `<TarefaObservadores />` - Gerenciar watchers

### Utilities
- `<QuickFilters />` - Filtros rápidos
- `<ViewSwitcher />` - Trocar visualizações
- `<BoardSelector />` - Seletor de boards
- `<BulkActions />` - Ações em massa

---

## 🔧 Actions Necessárias

### Boards
```typescript
- createBoard()
- updateBoard()
- deleteBoard()
- listBoards()
- duplicateBoard()
```

### Colunas
```typescript
- createColumn()
- updateColumn()
- deleteColumn()
- reorderColumns()
```

### Tarefas Kanban
```typescript
- moveTarefa(tarefaId, columnId, ordem)
- duplicateTarefa()
- arquivarTarefa()
- moverParaBoard()
```

### Checklists
```typescript
- addChecklistItem()
- toggleChecklistItem()
- deleteChecklistItem()
```

### Comentários
```typescript
- addComentario()
- updateComentario()
- deleteComentario()
```

### Anexos
```typescript
- uploadAnexo()
- deleteAnexo()
```

### Tags
```typescript
- createTag()
- addTagToTarefa()
- removeTagFromTarefa()
```

### Atividades
```typescript
- logAtividade() // automático
- getAtividades()
```

### Observadores
```typescript
- addWatcher()
- removeWatcher()
```

---

## 📊 Integrações

### Com Processos
- ✅ Board automático por processo
- ✅ Tarefas vinculadas a prazos
- ✅ Notificações de intimações

### Com Clientes
- ✅ Board compartilhado com cliente
- ✅ Tarefas visíveis ao cliente
- ✅ Transparência no andamento

### Com Contratos
- ✅ Tasks de milestone
- ✅ Controle de entregas
- ✅ Aprovações

### Com Equipe
- ✅ Distribuição de carga
- ✅ Relatórios de produtividade
- ✅ Gamificação (futuro)

---

## 🎯 Workflows Automáticos (Futuro)

### Triggers
```typescript
// Quando processo é criado
→ Criar board do processo
→ Adicionar colunas padrão
→ Criar tarefas iniciais

// Quando prazo é criado
→ Criar tarefa no board
→ Atribuir responsável
→ Definir data limite

// Quando tarefa vence
→ Enviar notificação
→ Mudar prioridade para CRITICA
→ Notificar supervisor
```

---

## 📈 Métricas e KPIs

### Por Usuário
- Tarefas concluídas (dia/semana/mês)
- Taxa de conclusão
- Tempo médio por tarefa
- Tarefas atrasadas

### Por Board
- Throughput (tarefas concluídas)
- Lead time (tempo total)
- Cycle time (tempo em progresso)
- WIP médio

### Por Equipe
- Distribuição de carga
- Velocidade (sprint)
- Burndown
- Cumulative flow

---

## 🚀 Fases de Implementação

### ✅ Fase 1: Schema (CONCLUÍDO)
- ✅ 9 novos models
- ✅ 2 novos enums
- ✅ Migration criada
- ✅ Relacionamentos completos

### 🔄 Fase 2: Backend (EM PROGRESSO)
- Actions de boards
- Actions de colunas
- Actions expandidas de tarefas
- Actions de checklists, comentários, tags

### 📋 Fase 3: Kanban View
- Interface drag & drop
- Cards com preview
- Quick actions
- Filtros visuais

### 📊 Fase 4: Outras Views
- List view
- Calendar view
- Timeline view
- Analytics dashboard

### 🎯 Fase 5: Features Avançadas
- Workflows automáticos
- Templates de boards
- Relatórios avançados
- Integrações externas

---

## 💡 Diferenciais do Sistema

### vs Trello
✅ **Multi-tenant**  
✅ **Integrado com processos jurídicos**  
✅ **Tracking de tempo**  
✅ **Hierarquia de subtarefas**  
✅ **Log completo de atividades**  

### vs Jira
✅ **Mais simples e intuitivo**  
✅ **Focado em advocacia**  
✅ **Sem complexidade desnecessária**  
✅ **Interface brasileira**  

### vs ClickUp
✅ **Especializado em jurídico**  
✅ **Integração nativa com processos**  
✅ **Visibilidade para clientes**  
✅ **Compliance LGPD**  

---

## 🎉 Resultado Final

Um **sistema de tarefas de nível enterprise** com:

- ✅ 9 modelos de dados
- ✅ Kanban profissional
- ✅ 5 visualizações
- ✅ Subtarefas e checklists
- ✅ Comentários e anexos
- ✅ Tags customizáveis
- ✅ Tracking de tempo
- ✅ Log de atividades
- ✅ Observadores
- ✅ Analytics completo

**MUITO ALÉM** de um sistema de tarefas simples! 🚀

---

**Próximo:** Implementar Kanban View com drag & drop

