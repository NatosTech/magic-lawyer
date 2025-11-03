# Sistema de Permissões

Documentação do sistema de permissões do Magic Lawyer, que permite controle granular de acesso a módulos e ações através de múltiplas camadas.

## 📋 Visão Geral

O sistema de permissões funciona em **três camadas hierárquicas** que são verificadas em ordem de precedência:

1. **Override Individual** (maior precedência)
2. **Cargo** (herança do cargo ativo)
3. **Role Padrão** (permissões baseadas no tipo de usuário)

### Ordem de Precedência

```
Override Individual → Cargo Ativo → Role Padrão
```

Quando uma permissão é verificada, o sistema:
1. Primeiro verifica se há um **override individual** (`UsuarioPermissaoIndividual`)
2. Se não houver override, verifica as **permissões do cargo** ativo (`UsuarioCargo` + `CargoPermissao`)
3. Se ainda não encontrar, aplica as **permissões padrão** baseadas no `UserRole`

## 🏗️ Arquitetura

### Backend

#### Server Actions

**`app/actions/equipe.ts`:**

- **`verificarPermissao(modulo, acao, usuarioId?)`** - Verifica se um usuário tem permissão considerando todas as camadas
- **`getPermissoesEfetivas(usuarioId)`** - Retorna o estado efetivo de todas as permissões com origem
- **`adicionarPermissaoIndividual(...)`** - Cria/atualiza override individual

#### Fluxo de Verificação

```typescript
// 1. Verifica override individual
const override = await prisma.usuarioPermissaoIndividual.findFirst({
  where: { modulo, acao, usuarioId, tenantId }
});
if (override) return override.permitido;

// 2. Verifica cargo ativo
const cargo = await prisma.usuarioCargo.findFirst({
  where: { usuarioId, ativo: true },
  include: { cargo: { include: { permissoes: true } } }
});
if (cargo?.cargo.permissoes) {
  const permissaoCargo = cargo.cargo.permissoes.find(p => p.modulo === modulo && p.acao === acao);
  if (permissaoCargo) return permissaoCargo.permitido;
}

// 3. Aplica matriz padrão do role
const rolePermissions = getRolePermissions(userRole);
return rolePermissions[modulo]?.includes(acao) ?? false;
```

### Frontend

#### Hooks

**`app/hooks/use-permission-check.ts`:**

- **`usePermissionCheck(modulo, acao)`** - Hook para verificar uma permissão específica
- **`usePermissionsCheck(checks[])`** - Hook para verificar múltiplas permissões

**Uso:**

```typescript
// Verificar permissão individual
const { hasPermission, isLoading } = usePermissionCheck("processos", "criar");

// Verificar múltiplas permissões
const { hasPermission, permissions } = usePermissionsCheck([
  { modulo: "processos", acao: "criar" },
  { modulo: "clientes", acao: "editar" }
]);
```

#### Componentes

**`components/permission-guard.tsx`:**

Wrapper component que oculta/mostra conteúdo baseado em permissões.

**API Routes**

**`app/api/permissions/check/route.ts`:**

Endpoint HTTP que expõe `verificarPermissao` para uso em client components.

## 🎨 Interface do Usuário

### Modal de Permissões (`/equipe`)

O modal de gerenciamento de permissões exibe:

- **Estado efetivo** de cada permissão (ativa/inativa)
- **Origem** da permissão através de chips coloridos:
  - 🔵 **Override** - Permissão personalizada
  - 🟣 **Herdado do cargo** - Vem do cargo ativo
  - ⚪ **Padrão do role** - Permissão padrão do tipo de usuário
  - 🔴 **Sem permissão** - Negado em todas as camadas

### Legenda Integrada

O modal inclui documentação contextual explicando:
- Ordem de precedência
- Significado de cada chip
- Como criar/remover overrides

## 📊 Matriz de Permissões por Role

### ADMIN
- Todas as permissões em todos os módulos

### ADVOGADO
- Processos: criar, editar, visualizar, exportar
- Clientes: criar, editar, visualizar, exportar
- Advogados: visualizar
- Financeiro: visualizar
- Equipe: visualizar
- Relatórios: visualizar, exportar

### SECRETARIA
- Processos: criar, editar, visualizar, exportar
- Clientes: criar, editar, visualizar, exportar
- Advogados: visualizar
- Financeiro: visualizar
- Equipe: visualizar
- Relatórios: visualizar, exportar

### FINANCEIRO
- Processos: visualizar
- Clientes: visualizar
- Advogados: visualizar
- Financeiro: criar, editar, excluir, visualizar, exportar
- Equipe: visualizar
- Relatórios: visualizar, exportar

### CLIENTE
- Processos: visualizar (apenas os seus)
- Clientes: visualizar (apenas os seus)
- Advogados: visualizar
- Financeiro: visualizar (apenas o que deve pagar)
- Equipe: sem acesso
- Relatórios: visualizar (apenas os seus)

## 🔒 Segurança

### Boas Práticas

1. **Sempre verifique permissões no servidor** - Não confie apenas em verificações client-side
2. **Use `verificarPermissao` em Server Actions** - Para validação server-side
3. **Cache com SWR** - Permissões são cacheadas por 2 segundos para performance
4. **Auditoria** - Todas as mudanças são registradas em `EquipeHistorico`

### Exemplo de Uso em Server Action

```typescript
export async function criarProcesso(data: ProcessoData) {
  const session = await getSession();
  
  // Verificar permissão antes de criar
  const podeCriar = await verificarPermissao("processos", "criar", session.user.id);
  
  if (!podeCriar) {
    throw new Error("Você não tem permissão para criar processos");
  }
  
  // Continuar com a criação...
}
```

## 🚀 Próximos Passos

- [ ] Integrar `verificarPermissao` em todas as Server Actions críticas
- [ ] Atualizar guards de rota para usar verificação consolidada
- [ ] Criar testes automatizados para o fluxo de permissões
- [ ] Adicionar métricas de auditoria de permissões

## 📚 Referências

- `app/actions/equipe.ts` - Lógica de verificação de permissões
- `app/hooks/use-permission-check.ts` - Hooks para verificação no frontend
- `components/permission-guard.tsx` - Componente guard para ocultar/mostrar conteúdo
- `docs/features/tenant-dashboard-enhancements/tenant-team-role-management.md` - Planejamento completo

