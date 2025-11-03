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

- **`checkPermission(modulo, acao, usuarioId?)`** - Verifica uma permissão específica (recomendado para uso público)
- **`checkPermissions(requests[], usuarioId?)`** - Verifica múltiplas permissões de uma vez (otimizado)
- **`verificarPermissao(modulo, acao, usuarioId?)`** - Função interna (usada por checkPermission)
- **`getPermissoesEfetivas(usuarioId)`** - Retorna o estado efetivo de todas as permissões com origem (apenas ADMIN)
- **`adicionarPermissaoIndividual(...)`** - Cria/atualiza override individual

**Recomendações:**
- Use `checkPermission` para verificações individuais em Server Actions
- Use `checkPermissions` quando precisar verificar múltiplas permissões (evita N round-trips)
- Use `getPermissoesEfetivas` apenas em contextos administrativos (requer ADMIN)

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

- **`usePermissionCheck(modulo, acao, options?)`** - Hook para verificar uma permissão específica
- **`usePermissionsCheck(checks[], options?)`** - Hook para verificar múltiplas permissões

**Características:**
- ✅ Assina eventos realtime (`usuario-update`, `cargo-update`) para revalidação automática
- ✅ Cache inteligente com chave estável incluindo `tenantId`
- ✅ Suporte a `requiredAll` e `requiredAny` para checks múltiplos
- ✅ Opção `enableEarlyAccess` para retornar `false` até carregar

**Uso - Verificação Individual:**

```typescript
// Verificar uma permissão específica
const { hasPermission, isLoading, error, refetch } = usePermissionCheck(
  "processos",
  "criar",
  {
    enabled: true, // Habilitar verificação (padrão: true)
    usuarioId: undefined, // Verificar permissão do usuário atual (padrão)
    enableEarlyAccess: false, // Retornar false até carregar (padrão: false)
  }
);

// Exibir botão condicionalmente
{hasPermission && (
  <Button onClick={handleCriarProcesso}>Criar Processo</Button>
)}

// Exibir skeleton enquanto carrega
{isLoading ? (
  <Skeleton className="h-10 w-32" />
) : (
  hasPermission && <Button>Criar</Button>
)}
```

**Uso - Verificação Múltipla:**

```typescript
// Verificar múltiplas permissões de uma vez (otimizado)
const { 
  permissions, 
  hasPermission, 
  hasPermissionFor,
  isLoading,
  refetch 
} = usePermissionsCheck(
  [
    { modulo: "processos", acao: "criar" },
    { modulo: "processos", acao: "editar" },
    { modulo: "clientes", acao: "visualizar" },
  ],
  {
    enabled: true,
    requiredAll: false, // hasPermission = true se TODAS forem true
    requiredAny: true,   // hasPermission = true se QUALQUER uma for true
    enableEarlyAccess: false,
  }
);

// Acessar permissão específica
const podeCriar = hasPermissionFor("processos", "criar");

// Verificar se tem alguma das permissões
{hasPermission && (
  <Button>Opções Disponíveis</Button>
)}

// Verificar permissão específica
{permissions["processos.criar"] && (
  <Button>Criar Processo</Button>
)}
```

**Uso - Revalidação Automática:**

Os hooks automaticamente revalidam quando:
- Evento `usuario-update` é recebido (permissões individuais mudaram)
- Evento `cargo-update` é recebido (cargo/permissões do cargo mudaram)
- Reconeção após queda de conexão
- Foco na janela (configurável)

Não é necessário fazer nada - a UI atualiza automaticamente!

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

### Exemplos de Uso em Server Actions

**Verificação Individual:**

```typescript
import { checkPermission } from "@/app/actions/equipe";

export async function criarProcesso(data: ProcessoData) {
  // Verificar permissão antes de criar
  const podeCriar = await checkPermission("processos", "criar");
  
  if (!podeCriar) {
    throw new Error("Você não tem permissão para criar processos");
  }
  
  // Continuar com a criação...
  return await prisma.processo.create({ data });
}
```

**Verificação Múltipla (Otimizada):**

```typescript
import { checkPermissions } from "@/app/actions/equipe";

export async function atualizarProcessoCompleto(
  processoId: string,
  data: ProcessoData,
) {
  // Verificar múltiplas permissões de uma vez
  const permissoes = await checkPermissions([
    { modulo: "processos", acao: "visualizar" },
    { modulo: "processos", acao: "editar" },
  ]);

  if (!permissoes["processos.visualizar"]) {
    throw new Error("Você não tem permissão para visualizar processos");
  }

  if (!permissoes["processos.editar"]) {
    throw new Error("Você não tem permissão para editar processos");
  }

  // Continuar com a atualização...
  return await prisma.processo.update({
    where: { id: processoId },
    data,
  });
}
```

**Verificação de Outro Usuário (Apenas ADMIN):**

```typescript
import { checkPermission } from "@/app/actions/equipe";

export async function verificarPermissoesUsuario(usuarioId: string) {
  // Apenas ADMIN pode verificar permissões de outros usuários
  const permissoes = await checkPermissions(
    [
      { modulo: "processos", acao: "criar" },
      { modulo: "clientes", acao: "editar" },
    ],
    usuarioId, // Especificar ID do usuário
  );

  return permissoes;
}
```

## 🧪 Testes

### Testes Unitários (Recomendado)

**Testar `checkPermission` e `checkPermissions`:**

```typescript
describe("checkPermission", () => {
  it("deve retornar true para ADMIN", async () => {
    const result = await checkPermission("processos", "criar", adminUserId);
    expect(result).toBe(true);
  });

  it("deve respeitar override individual", async () => {
    // Criar override negando permissão
    await adicionarPermissaoIndividual(usuarioId, "processos", "criar", false);
    
    const result = await checkPermission("processos", "criar", usuarioId);
    expect(result).toBe(false);
  });

  it("deve herdar permissão do cargo quando não há override", async () => {
    // Criar cargo com permissão
    const cargo = await createCargo({ permissoes: [{ modulo: "processos", acao: "criar", permitido: true }] });
    await vincularCargo(usuarioId, cargo.id);
    
    const result = await checkPermission("processos", "criar", usuarioId);
    expect(result).toBe(true);
  });
});
```

### Testes de Integração

**Testar fluxo completo de permissões:**

```typescript
describe("Fluxo de Permissões", () => {
  it("deve atualizar permissões em tempo real via eventos", async () => {
    // 1. Verificar permissão inicial
    const { hasPermission: inicial } = usePermissionCheck("processos", "criar");
    expect(inicial).toBe(true);

    // 2. Remover permissão via cargo
    await updateCargo(cargoId, { permissoes: [] });

    // 3. Aguardar evento realtime
    await waitFor(() => {
      const { hasPermission: atualizada } = usePermissionCheck("processos", "criar");
      expect(atualizada).toBe(false);
    });
  });
});
```

### Testes E2E

**Validar comportamento completo no browser:**

```typescript
test("usuário sem permissão não vê botão de criar", async () => {
  // Login como usuário sem permissão
  await loginAs("usuario-sem-permissao");
  
  // Navegar para página de processos
  await page.goto("/processos");
  
  // Verificar que botão não existe
  const botaoCriar = await page.$('button:has-text("Criar Processo")');
  expect(botaoCriar).toBeNull();
});
```

## 🚀 Próximos Passos

- [x] Criar server actions `checkPermission` e `checkPermissions`
- [x] Implementar hooks `usePermissionCheck` e `usePermissionsCheck` com realtime
- [x] Documentar sistema completo de permissões
- [x] Integrar `checkPermission` em Server Actions críticas:
  - [x] Processos: `createProcesso`, `updateProcesso`
  - [x] Clientes: `createCliente`, `updateCliente`
  - [x] Financeiro: `createContrato`, `updateContrato`
- [ ] Integrar `checkPermission` em Server Actions restantes:
  - [ ] Processos: `deleteProcesso` (quando implementado)
  - [ ] Clientes: `deleteCliente` (quando implementado)
  - [ ] Financeiro: `deleteContrato`, `createParcelaContrato`, `updateParcelaContrato`, `deleteParcelaContrato`
  - [ ] Outras operações sensíveis
- [ ] Atualizar guards de rota para usar verificação consolidada (middleware já verifica módulos, mas ações específicas são validadas nas Server Actions)
- [ ] Criar testes unitários para `checkPermission` e `checkPermissions`
- [ ] Criar testes de integração cobrindo override, cargo e role
- [ ] Criar testes E2E simulando mudança de permissão e re-render
- [ ] Adicionar métricas de auditoria de permissões

## 📚 Referências

- `app/actions/equipe.ts` - Lógica de verificação de permissões
- `app/hooks/use-permission-check.ts` - Hooks para verificação no frontend
- `components/permission-guard.tsx` - Componente guard para ocultar/mostrar conteúdo
- `docs/features/tenant-dashboard-enhancements/tenant-team-role-management.md` - Planejamento completo

