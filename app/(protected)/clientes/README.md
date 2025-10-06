# Módulo de Clientes

## 📍 Localização
`app/(protected)/clientes/`

## 📖 Documentação Completa
Para regras de negócio detalhadas, estrutura de dados e fluxos, consulte:
**[/docs/CLIENTES_REGRAS_NEGOCIO.md](/docs/CLIENTES_REGRAS_NEGOCIO.md)**

## 🎯 Objetivo
Gerenciar a visualização e interação com clientes e seus processos, adaptando a interface conforme o perfil do usuário (Advogado ou Cliente).

## 🏗️ Estrutura de Arquivos

```
clientes/
├── README.md                    # Este arquivo
├── page.tsx                     # Página principal (lista de clientes para Advogado)
├── [clienteId]/
│   ├── page.tsx                # Detalhes do cliente + cards de processos
│   └── components/
│       ├── cliente-header.tsx  # Header com info do cliente
│       ├── processos-cards.tsx # Grid de cards dos processos
│       └── processo-card.tsx   # Card individual de processo
└── components/
    ├── clientes-table.tsx      # Tabela de clientes (Advogado)
    └── clientes-filters.tsx    # Filtros da listagem
```

## 🔑 Pontos-Chave

### Diferença entre Perfis

| Aspecto | Advogado | Cliente |
|---------|----------|---------|
| **Rota inicial** | `/clientes` | `/processos` |
| **Vê** | Lista de clientes | Lista de processos |
| **Acesso** | Via AdvogadoCliente | Via clienteId do Usuario |
| **Navegação** | Clientes → Processos → Detalhes | Processos → Detalhes |

### Relacionamentos Importantes

- `Cliente` ← N:N → `Advogado` (via `AdvogadoCliente`)
- `Cliente` → 1:N → `Processo`
- `Processo` ← N:N → `Procuracao` (via `ProcuracaoProcesso`)

### Segurança

- ✅ Sempre filtrar por `tenantId`
- ✅ Advogado só vê clientes vinculados a ele
- ✅ Cliente só vê seus próprios processos
- ✅ Respeitar `deletedAt` (soft delete)
- ✅ Documentos: respeitar `visivelParaCliente`

## 🛠️ Server Actions

Arquivo: `app/actions/clientes.ts`

```typescript
// Actions principais a serem implementadas:
- getClientesAdvogado(advogadoId: string)
- getClienteById(clienteId: string)
- getProcessosCliente(clienteId: string)
- createCliente(data: ClienteCreateInput)
- updateCliente(clienteId: string, data: ClienteUpdateInput)
- deleteCliente(clienteId: string) // soft delete
```

## 🎨 Componentes

### ClientesTable
- Lista de clientes do advogado
- Busca e filtros
- Ações rápidas

### ProcessosCards
- Grid responsivo de cards
- Cada card representa um processo
- Status visual com cores
- Badges para alertas (prazo, audiência)

### ClienteHeader
- Informações do cliente
- Avatar/inicial
- Dados de contato
- Botões de ação (editar, arquivar)

## 📋 Tasks Implementação

- [ ] Criar Server Actions (`app/actions/clientes.ts`)
- [ ] Implementar `page.tsx` - Lista de clientes
- [ ] Implementar `[clienteId]/page.tsx` - Detalhes + Processos
- [ ] Criar componente `ClientesTable`
- [ ] Criar componente `ProcessosCards`
- [ ] Criar componente `ClienteHeader`
- [ ] Adicionar filtros e busca
- [ ] Implementar paginação
- [ ] Adicionar testes de permissão
- [ ] Integrar com módulo de processos
- [ ] Testar visão de Advogado
- [ ] Testar visão de Cliente

## 🔗 Integrações

- **Processos**: `/processos/[processoId]` para detalhes
- **Procurações**: Exibidas dentro dos detalhes do processo
- **Documentos**: Filtrados por `visivelParaCliente`
- **Eventos**: Audiências e compromissos do processo

## ⚠️ Avisos Importantes

1. **Procuração está no PROCESSO, não no Cliente**
2. Um processo pode ter várias procurações
3. Cliente NÃO vê a rota `/clientes`
4. Sempre validar permissões no server
5. Usar SWR para cache quando apropriado

## 📚 Referências

- [Documentação Completa das Regras](/docs/CLIENTES_REGRAS_NEGOCIO.md)
- [Schema Prisma](/prisma/schema.prisma)
- [Estrutura do Projeto](/docs/PROJECT_STRUCTURE.md)
- [Regras de Negócio Gerais](/docs/BUSINESS_RULES.md)

