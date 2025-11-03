# Como Adicionar uma Nova Role ao Sistema

Este guia explica como adicionar uma nova role (ex: ESTAGIARIA) ao sistema.

## 📋 Roles Existentes

Atualmente, o sistema possui as seguintes roles:

```typescript
enum UserRole {
  SUPER_ADMIN  // Acesso total ao sistema (multi-tenant)
  ADMIN        // Administrador do escritório (tenant)
  ADVOGADO     // Advogado do escritório
  SECRETARIA   // Secretária/Assistente
  FINANCEIRO   // Responsável financeiro
  CLIENTE      // Cliente do escritório
}
```

## 🔧 Passo a Passo para Adicionar ESTAGIARIA

### 1. Adicionar ao Enum no Prisma Schema

**Arquivo:** `prisma/schema.prisma`

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  ADVOGADO
  SECRETARIA
  FINANCEIRO
  CLIENTE
  ESTAGIARIA  // ← Adicionar aqui

  @@schema("magiclawyer")
}
```

### 2. Gerar Migration

```bash
npx prisma migrate dev --name add_estagiaria_role
```

### 3. Atualizar Tipos TypeScript

Após a migration, os tipos Prisma serão regenerados automaticamente. Verificar:
- `app/generated/prisma/index.ts` deve incluir `ESTAGIARIA` no enum

### 4. Atualizar Permissões Padrão

**Arquivo:** `app/actions/equipe.ts`

Adicionar permissões padrão para ESTAGIARIA no objeto `rolePermissions`:

```typescript
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  // ... outras roles ...
  
  [UserRole.ESTAGIARIA]: {
    processos: ["visualizar"],  // Estagiária só visualiza
    clientes: ["visualizar"],   // Estagiária só visualiza
    advogados: ["visualizar"],  // Estagiária só visualiza
    financeiro: [],             // Sem acesso financeiro
    equipe: [],                  // Sem acesso à equipe
    relatorios: [],              // Sem relatórios
  },
};
```

### 5. Atualizar Hooks de Permissões

**Arquivo:** `app/hooks/use-user-permissions.ts`

Adicionar `isEstagiaria` ao retorno do hook:

```typescript
export function useUserPermissions() {
  // ...
  return {
    // ... outros campos ...
    isEstagiaria: userRole === "ESTAGIARIA",
  };
}
```

### 6. Atualizar UI (Labels, Cores, Ícones)

**Arquivo:** `app/(protected)/equipe/equipe-content.tsx`

Adicionar labels e cores no `getRoleLabel` e `getRoleColor`:

```typescript
function getRoleLabel(role: string) {
  switch (role) {
    // ... outros cases ...
    case "ESTAGIARIA":
      return "Estagiária";
    default:
      return role;
  }
}

function getRoleColor(role: string): ChipProps["color"] {
  switch (role) {
    // ... outros cases ...
    case "ESTAGIARIA":
      return "default"; // ou outra cor desejada
    default:
      return "default";
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    // ... outros cases ...
    case "ESTAGIARIA":
      return <GraduationCap className="w-3 h-3" />; // ou outro ícone
    default:
      return <User className="w-3 h-3" />;
  }
}
```

### 7. Atualizar Navegação (Se Necessário)

**Arquivo:** `app/hooks/use-profile-navigation.ts`

Se necessário, ajustar permissões de acesso à navegação para ESTAGIARIA.

### 8. Atualizar Validações

Verificar se há validações específicas por role que precisam ser atualizadas:
- `app/actions/equipe.ts` - `updateUsuarioEquipe`
- `app/actions/admin.ts` - `createTenantUser`
- Outros lugares onde roles são verificadas

## 📝 Notas Importantes

1. **Permissões Padrão**: ESTAGIARIA normalmente tem acesso limitado (só visualização)
2. **Cargos vs Roles**: Lembre-se que o sistema permite **cargos customizados** também. Se você quer apenas permissões específicas sem criar uma role global, considere criar um **Cargo** ao invés de uma Role.
3. **Migration**: Sempre teste a migration em ambiente de desenvolvimento primeiro
4. **Backward Compatibility**: Se já existem usuários no banco, a adição de uma nova role não afeta os existentes

## ✅ Checklist

- [ ] Adicionar `ESTAGIARIA` ao enum no Prisma schema
- [ ] Gerar e executar migration
- [ ] Atualizar `rolePermissions` com permissões padrão
- [ ] Adicionar `isEstagiaria` no hook `useUserPermissions`
- [ ] Atualizar labels, cores e ícones na UI
- [ ] Verificar navegação e validações
- [ ] Testar criação/edição de usuários com nova role
- [ ] Documentar permissões padrão da nova role

---

**Última atualização:** Após análise do sistema de roles

