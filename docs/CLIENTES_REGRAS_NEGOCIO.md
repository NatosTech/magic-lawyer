# Módulo de Clientes - Regras de Negócio

## 📋 Visão Geral
O módulo de clientes gerencia a visualização e interação com clientes e seus processos, com comportamentos diferentes dependendo do perfil do usuário logado.

## 👥 Perfis de Acesso e Comportamentos

### 1. Advogado Logado

#### Visualização Inicial (Lista de Clientes)
- **Exibe**: Lista de clientes vinculados ao advogado através da tabela `AdvogadoCliente`
- **Filtros aplicados**: 
  - `tenantId` do usuário
  - `advogadoId` do usuário logado
  - Clientes não deletados (`deletedAt IS NULL`)
  
#### Ao Clicar em um Cliente
- **Tela**: Detalhes do Cliente com Cards de Processos
- **Exibe**: 
  - Informações do cliente (nome, documento, contatos, etc.)
  - **Cards separados por processo** do cliente
  - Cada card mostra resumo do processo (número, status, área, etc.)
  
#### Ao Clicar em um Processo
- **Tela**: Detalhes Completos do Processo
- **Exibe**:
  - Todas as informações do processo
  - **Procuração(ões) vinculada(s) ao processo** através de `ProcuracaoProcesso`
  - Documentos do processo
  - Movimentações processuais
  - Eventos/audiências relacionados
  - Tarefas vinculadas
  - Histórico de ações
  
### 2. Cliente Logado

#### Visualização Inicial (Lista de Processos)
- **NÃO EXIBE**: Menu/opção "Clientes"
- **Exibe DIRETAMENTE**: Lista de processos do próprio cliente
- **Filtros aplicados**:
  - `tenantId` do tenant associado
  - `clienteId` vinculado ao `Usuario` logado
  - Processos não deletados (`deletedAt IS NULL`)
  - Apenas processos visíveis para cliente (se houver flag)
  
#### Ao Clicar em um Processo
- **Tela**: Detalhes do Processo (visão cliente)
- **Exibe**:
  - Informações básicas do processo
  - **Procuração(ões) do processo**
  - Documentos marcados como `visivelParaCliente = true`
  - Eventos/audiências relevantes
  - Status e andamentos principais
- **NÃO EXIBE**:
  - Informações internas do escritório
  - Documentos com `visivelParaCliente = false`
  - Dados financeiros sensíveis (se houver regra específica)

## 🔗 Estrutura de Relacionamentos

```
Cliente
  ├── AdvogadoCliente (N:N com Advogado)
  ├── Processo (1:N)
  │     ├── ProcuracaoProcesso (N:N com Procuracao)
  │     ├── Documento
  │     ├── Evento
  │     ├── MovimentacaoProcesso
  │     └── Tarefa
  └── Procuracao (1:N)
        └── ProcuracaoProcesso
```

## 🔒 Regras de Segurança

### Multi-tenancy
- **SEMPRE** filtrar por `tenantId` em todas as queries
- **SEMPRE** validar que o usuário pertence ao tenant antes de exibir dados
- Isolamento total entre tenants

### Controle de Acesso (Advogado)
- Advogado só vê clientes vinculados a ele via `AdvogadoCliente`
- Pode ver todos os processos dos seus clientes
- Pode ver todas as procurações vinculadas aos processos

### Controle de Acesso (Cliente)
- Cliente só vê seus próprios processos
- Cliente só vê documentos marcados como visíveis (`visivelParaCliente = true`)
- Cliente não tem acesso a dados de outros clientes
- Cliente não tem acesso ao módulo "Clientes" (menu oculto)

### Soft Delete
- Sempre considerar `deletedAt` nas queries
- Clientes, processos e documentos deletados não devem aparecer nas listagens padrão
- Manter integridade referencial ao fazer soft delete

## 📊 Queries Principais

### Para Advogado - Buscar Clientes
```typescript
// Buscar clientes do advogado
await prisma.cliente.findMany({
  where: {
    tenantId: session.user.tenantId,
    deletedAt: null,
    advogadoClientes: {
      some: {
        advogadoId: session.user.advogadoId
      }
    }
  },
  include: {
    _count: {
      select: { processos: true }
    }
  }
})
```

### Para Advogado - Buscar Processos de um Cliente
```typescript
await prisma.processo.findMany({
  where: {
    tenantId: session.user.tenantId,
    clienteId: clienteId,
    deletedAt: null
  },
  include: {
    area: true,
    advogadoResponsavel: true,
    _count: {
      select: { 
        documentos: true,
        eventos: true,
        movimentacoes: true 
      }
    }
  }
})
```

### Para Cliente - Buscar Processos
```typescript
// Primeiro encontrar o cliente vinculado ao usuário
const cliente = await prisma.cliente.findUnique({
  where: {
    tenantId_usuarioId: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id
    }
  }
})

// Depois buscar processos
await prisma.processo.findMany({
  where: {
    tenantId: session.user.tenantId,
    clienteId: cliente.id,
    deletedAt: null
  },
  include: {
    area: true,
    advogadoResponsavel: {
      select: { nome: true, oab: true }
    }
  }
})
```

### Buscar Procurações de um Processo
```typescript
await prisma.procuracao.findMany({
  where: {
    tenantId: session.user.tenantId,
    processos: {
      some: {
        processoId: processoId
      }
    }
  },
  include: {
    outorgados: {
      include: {
        advogado: true
      }
    }
  }
})
```

## 🎯 Funcionalidades Essenciais

### Tela de Listagem (Advogado)
- [x] Tabela/Grid de clientes com busca e filtros
- [x] Informações: nome, documento, telefone, email
- [x] Contador de processos por cliente
- [x] Ações: visualizar, editar, arquivar

### Tela de Detalhes do Cliente (Advogado)
- [x] Informações completas do cliente
- [x] **Cards de processos** organizados
- [x] Cada card: número, status, área, prazo principal
- [x] Filtros por status/área de processo
- [x] Ação rápida para adicionar novo processo

### Tela de Detalhes do Processo
- [x] Dados processuais completos
- [x] **Seção destacada de Procuração(ões)**
  - [x] Visualização do arquivo PDF
  - [x] Download da procuração
  - [x] Status da procuração (ativa, revogada, vencida)
  - [x] Advogados outorgados
- [x] Timeline de movimentações
- [x] Lista de documentos
- [x] Eventos/audiências
- [x] Tarefas vinculadas

### Tela de Processos (Cliente)
- [x] Lista direta de processos (sem passar por "clientes")
- [x] Cards ou tabela com processos
- [x] Informações simplificadas e claras
- [x] Status visual (em andamento, finalizado, etc.)

### Tela de Detalhes do Processo (Cliente)
- [x] Visão simplificada do processo
- [x] **Procuração visível e acessível**
- [x] Documentos permitidos
- [x] Próximos eventos/audiências
- [x] Mensagens/comunicados do advogado

## 🎨 UX/UI Considerations

### Cards de Processos
- Visual limpo e organizado
- Status com cores diferenciadas
- Badges para informações importantes (prazo próximo, audiência marcada)
- Hover com preview de mais informações

### Visualização de Procuração
- Ícone/badge destacado indicando procuração disponível
- Visualizador PDF inline (ou modal)
- Botão de download em destaque
- Indicador de status (ativa, vencida, revogada)

### Navegação
- Breadcrumb: Clientes > [Nome do Cliente] > [Processo]
- Botão voltar intuitivo
- Navegação rápida entre processos do mesmo cliente

## 📝 Notas de Implementação

### Server Actions
- Usar Server Actions para todas as operações (seguir padrão do projeto)
- Arquivo: `app/actions/clientes.ts` (criar)
- Validação de permissões em cada action

### Cache e Performance
- Usar SWR para cache client-side
- Paginação em listas grandes
- Loading states adequados

### Validações
- Sempre validar `tenantId`
- Verificar permissões antes de exibir dados
- Validar relacionamento Advogado-Cliente
- Validar vinculação Cliente-Usuario

## 🔄 Fluxo de Navegação

### Advogado
```
/clientes 
  → [Clique no Cliente] 
    → /clientes/[clienteId] (cards de processos)
      → [Clique no Processo]
        → /processos/[processoId] (detalhes + procuração)
```

### Cliente
```
/processos (lista direta)
  → [Clique no Processo]
    → /processos/[processoId] (visão cliente + procuração)
```

## ⚠️ Pontos de Atenção

1. **Procuração é vinculada ao Processo**, não diretamente ao Cliente
2. Um processo pode ter **múltiplas procurações** através de `ProcuracaoProcesso`
3. Cliente pode ter procurações não vinculadas a nenhum processo ainda
4. Sempre checar se usuário é Advogado ou Cliente para exibir view correta
5. Documentos têm flag `visivelParaCliente` que deve ser respeitada
6. Soft delete deve ser considerado em todas as queries

## 🚀 Próximos Passos

1. Criar Server Actions em `app/actions/clientes.ts`
2. Criar componente de listagem de clientes (advogado)
3. Criar componente de detalhes do cliente com cards de processos
4. Criar/adaptar componente de detalhes do processo
5. Criar componente de visualização de procuração
6. Implementar filtros e busca
7. Adicionar testes de permissão
8. Documentar endpoints e actions

