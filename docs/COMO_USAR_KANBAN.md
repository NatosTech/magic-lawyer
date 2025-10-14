# 🎯 Como Usar o Kanban - Guia Rápido

**Data:** 14/10/2025

---

## 🚀 **AGORA SIM! Kanban Visual Estilo Trello!**

### Você estava vendo a página ERRADA! 😅

```
❌ /tarefas           → Lista simples (não é Kanban)
✅ /tarefas/kanban    → KANBAN VISUAL com drag & drop! 🎨
```

---

## 📍 **Como Acessar o Kanban:**

### Opção 1: URL Direta
```
http://sandra.localhost:9192/tarefas/kanban
```

### Opção 2: Pelo Sidebar
```
Menu Lateral
├─ Tarefas ▼ (clique para expandir)
   ├─ Kanban ⭐ (Visualização em quadros)
   └─ Lista   (Visualização em lista)
```

---

## 🎯 **Primeiro Acesso:**

### 1. **Acesse `/tarefas/kanban`**

Você verá uma tela de boas-vindas:
```
┌─────────────────────────────────┐
│   Bem-vindo ao Kanban!          │
│                                 │
│  Você ainda não tem nenhum      │
│  quadro Kanban...               │
│                                 │
│  [Criar Quadro Padrão]          │
└─────────────────────────────────┘
```

### 2. **Clique em "Criar Quadro Padrão"**

O sistema vai criar automaticamente:
- ✅ **Board:** "Quadro Principal"
- ✅ **4 Colunas:**
  - 📥 A Fazer
  - 🔄 Em Andamento
  - 🔍 Revisão
  - ✅ Concluído

---

## 🎨 **Visual do Kanban:**

```
┌──────────────────────────────────────────────────────────────────┐
│ 📊 Kanban                    Quadro Principal ▼                  │
│                              [Atualizar] [Nova Tarefa]           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│ │ A FAZER │  │ ANDANDO │  │ REVISÃO │  │CONCLUÍDO│             │
│ │ ━━━━━━  │  │ ━━━━━━  │  │ ━━━━━━  │  │ ━━━━━━  │             │
│ │  (2)    │  │  (3)    │  │  (1)    │  │  (5)    │             │
│ ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤             │
│ │         │  │         │  │         │  │         │             │
│ │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │             │
│ │ │Task1│ │  │ │Task4│ │  │ │Task7│ │  │ │Task9│ │             │
│ │ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │             │
│ │         │  │         │  │         │  │         │             │
│ │ ┌─────┐ │  │ ┌─────┐ │  │         │  │ ┌─────┐ │             │
│ │ │Task2│ │  │ │Task5│ │  │         │  │ │Task10││             │
│ │ └─────┘ │  │ └─────┘ │  │         │  │ └─────┘ │             │
│ │         │  │         │  │         │  │         │             │
│ │ [+ Add] │  │ [+ Add] │  │ [+ Add] │  │ [+ Add] │             │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎮 **Como Usar:**

### 1. **Criar Tarefa**
- Vá em `/tarefas` (lista)
- Clique em "Nova Tarefa"
- Preencha os dados
- Selecione um board e coluna
- Salvar

### 2. **Arrastar Tarefa (Drag & Drop)**
```
1. Clique e segure no card da tarefa
2. Arraste para outra coluna
3. Solte
4. 🎉 Tarefa movida!
```

### 3. **Ver Detalhes**
- Clique em qualquer card
- Modal com 5 tabs:
  - ℹ️ Informações
  - ☑️ Checklist (em dev)
  - 📎 Anexos (em dev)
  - 💬 Comentários (em dev)
  - 📋 Atividades (em dev)

---

## 🎨 **Recursos Visuais:**

### Cards mostram:
- ✅ Título da tarefa
- ✅ Prioridade (chip colorido)
- ✅ Tags (se houver)
- ✅ Contador de checklists 📋
- ✅ Contador de comentários 💬
- ✅ Contador de anexos 📎
- ✅ Data limite (com alerta se atrasada) ⏰
- ✅ Avatar do responsável 👤
- ✅ Categoria (chip colorido)
- ✅ Tempo estimado/gasto ⏱️

### Exemplo de Card:
```
┌────────────────────────────┐
│ Preparar Petição Inicial   │ 🔴 Alta
│                            │
│ Redigir petição para...   │
│                            │
│ 🏷️ Urgente  🏷️ Processo   │
│                            │
│ 📋 3  💬 2  📎 1  ⏰ 15/10  │ 👤 JD
│                            │
│ ⚖️ Direito Civil           │
│ ⏱️ 8h                      │
└────────────────────────────┘
```

---

## 🎯 **Fluxo Completo:**

### Passo a Passo para Testar:

1. **Acesse:** `http://sandra.localhost:9192/tarefas/kanban`

2. **Crie o Board:**
   - Clique em "Criar Quadro Padrão"
   - Aguarde criação (2s)
   - ✅ Board criado com 4 colunas!

3. **Crie algumas tarefas:**
   - Vá em "Tarefas > Lista" (ou `/tarefas`)
   - Clique em "Nova Tarefa"
   - Preencha:
     - Título: "Preparar Petição"
     - Prioridade: Alta
     - Board: Quadro Principal
     - Coluna: A Fazer
   - Salvar
   - Repita 2-3 vezes

4. **Volte para o Kanban:**
   - Acesse `/tarefas/kanban`
   - ✅ Você verá as colunas com as tarefas!
   - 🎨 Arraste e solte entre as colunas!

5. **Teste o Drag & Drop:**
   - Clique e segure um card
   - Arraste para outra coluna
   - Solte
   - 🎉 Toast: "Tarefa movida!"
   - ✅ Card mudou de coluna automaticamente!

---

## 🎨 **Diferença Visual:**

### ANTES (`/tarefas`):
```
Lista Simples
├─ Card 1 (lista vertical)
├─ Card 2
├─ Card 3
└─ Card 4
```

### AGORA (`/tarefas/kanban`):
```
Quadro Kanban Estilo Trello
┌─────────┬─────────┬─────────┬─────────┐
│ Coluna1 │ Coluna2 │ Coluna3 │ Coluna4 │
│ ━━━━━━  │ ━━━━━━  │ ━━━━━━  │ ━━━━━━  │
│ Card 1  │ Card 3  │         │ Card 6  │
│ Card 2  │ Card 4  │         │ Card 7  │
│         │ Card 5  │         │         │
└─────────┴─────────┴─────────┴─────────┘
     ↓ ARRASTA E SOLTA! ↓
```

---

## 🔥 **Features Implementadas:**

### Drag & Drop
✅ Arrastar entre colunas  
✅ Reordenar dentro da coluna  
✅ Visual feedback (opacity)  
✅ Hover effect nas colunas  
✅ Toast de confirmação  

### Cards
✅ Visual bonito e limpo  
✅ Informações completas  
✅ Cores por prioridade  
✅ Tags customizadas  
✅ Contadores de recursos  
✅ Avatar do responsável  

### Colunas
✅ Header com nome e cor  
✅ Contador de tarefas  
✅ Limite WIP (se configurado)  
✅ Botão de adicionar tarefa  
✅ Scroll automático  

---

## 🎯 **Próximos Passos:**

### Para Testar Agora:
1. ✅ Acesse `/tarefas/kanban`
2. ✅ Crie board padrão
3. ✅ Crie 2-3 tarefas em `/tarefas`
4. ✅ Volte para `/tarefas/kanban`
5. ✅ **ARRASTE E SOLTE!** 🎨

### Para Desenvolver:
- ⏳ Criar tarefa direto no Kanban
- ⏳ Editar inline (quick edit)
- ⏳ Tabs do modal (checklist, comentários, anexos)
- ⏳ Gerenciar boards e colunas
- ⏳ Outras views (calendário, timeline)

---

## 📊 **Resumo Visual:**

```
ANTES (que você viu):
/tarefas
┌─────────────────────────┐
│ Tarefas                 │
│                         │
│ [Filtros]               │
│                         │
│ ┌─────────────────────┐ │
│ │ ☐ Tarefa 1          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ☐ Tarefa 2          │ │
│ └─────────────────────┘ │
└─────────────────────────┘

AGORA (que você quer):
/tarefas/kanban
┌─────────────────────────────────────────┐
│ 📊 Kanban   [Board ▼] [↻] [+ Tarefa]   │
├─────────────────────────────────────────┤
│ ┌────────┐┌────────┐┌────────┐┌────────┐│
│ │A FAZER ││ANDANDO ││REVISÃO ││PRONTO  ││
│ ├────────┤├────────┤├────────┤├────────┤│
│ │ Card 1 ││ Card 3 ││        ││ Card 6 ││
│ │ Card 2 ││ Card 4 ││        ││        ││
│ └────────┘└────────┘└────────┘└────────┘│
│         👆 ARRASTA E SOLTA! 👆          │
└─────────────────────────────────────────┘
```

---

## 🎉 **Está Pronto!**

✅ Backend 100% funcional  
✅ Drag & drop implementado  
✅ Visual estilo Trello  
✅ Múltiplos boards  
✅ Colunas customizáveis  
✅ Cards bonitos  

**Acesse `/tarefas/kanban` e veja a mágica acontecer!** ✨

---

**Dica:** Crie um board e algumas tarefas para testar o drag & drop! 🎮

