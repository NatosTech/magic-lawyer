# Plano de Migração de Permissões

Este documento mapeia os componentes que ainda usam o sistema antigo de permissões e define o plano de migração.

## 📊 Status Atual

**Resultado do mapeamento:**
- ✅ Server actions: 100% migrado (38 ocorrências de `checkPermission`)
- ⚠️ Hooks client-side: **PARCIALMENTE migrado**
  - `use-user-permissions.ts` ainda usa `session.user.permissions` diretamente
  - `permission-guard.tsx` depende do hook antigo
  - `use-profile-navigation.ts` usa `useUserPermissions()` antigo

## 🎯 Componentes para Migrar

### 1. `app/hooks/use-user-permissions.ts` ⚠️ PRIORIDADE ALTA

**Problema:** Usa `session.user.permissions` e `session.user.role` diretamente, não respeitando override/cargo.

**Status:** Hook antigo baseado apenas em role, ignora sistema de override/cargo.

**Ação:** 
- [ ] Refatorar para usar `usePermissionCheck` e `usePermissionsCheck` internamente
- [ ] Mapear permissões antigas para o novo formato (módulo + ação)
- [ ] Manter interface compatível para não quebrar componentes que usam
- [ ] Adicionar suporte a override/cargo nas verificações

**Mapeamento de permissões antigas → novas:**
```typescript
canViewAllProcessos → { modulo: 'processos', acao: 'visualizar' }
canCreateEvents → { modulo: 'agenda', acao: 'criar' }
canEditAllEvents → { modulo: 'agenda', acao: 'editar' }
canViewFinancialData → { modulo: 'financeiro', acao: 'visualizar' }
canManageTeam → { modulo: 'equipe', acao: 'visualizar' }
canManageOfficeSettings → { modulo: 'configuracoes', acao: 'editar' }
canViewReports → { modulo: 'relatorios', acao: 'visualizar' }
canManageContracts → { modulo: 'financeiro', acao: 'criar/editar' }
canViewJudgesDatabase → { modulo: 'juizes', acao: 'visualizar' }
canManageJudgesDatabase → { modulo: 'juizes', acao: 'editar' }
```

### 2. `components/permission-guard.tsx` ⚠️ PRIORIDADE MÉDIA

**Status:** Usa `useUserPermissions()` que depende do sistema antigo.

**Ação:**
- [ ] Após migrar `use-user-permissions.ts`, validar que funciona corretamente
- [ ] Ou criar nova versão usando `usePermissionCheck` diretamente

### 3. `app/hooks/use-profile-navigation.ts` ⚠️ PRIORIDADE BAIXA

**Status:** Usa `useUserPermissions()` mas principalmente para role, não permissões específicas.

**Ação:**
- [ ] Validar se realmente precisa de permissões ou apenas role
- [ ] Se precisar permissões, usar novo sistema

### 4. Uso direto de `session.user.role` ✅ OK

**Arquivos:**
- `app/(protected)/usuario/perfil/editar/profile-content.tsx` - OK (apenas role, não permissões)
- `app/actions/honorarios-contratuais.ts` - OK (apenas role, não permissões)

**Status:** Usar `session.user.role` diretamente é OK, pois role não tem override/cargo.

## 📋 Plano de Execução

### Fase 1: Migração do Hook Principal (Alta Prioridade)

1. **Criar versão migrada de `use-user-permissions.ts`**
   - Manter interface atual para compatibilidade
   - Internamente usar `usePermissionCheck` e `usePermissionsCheck`
   - Mapear permissões antigas para módulo + ação
   - Adicionar suporte a override/cargo

2. **Testar componentes que usam**
   - `permission-guard.tsx`
   - `use-profile-navigation.ts`
   - Outros componentes que importam `useUserPermissions`

3. **Validar comportamento**
   - Verificar que override funciona
   - Verificar que cargo funciona
   - Verificar que role padrão funciona

### Fase 2: Validação e Limpeza (Média Prioridade)

1. **Remover código antigo** (se houver)
2. **Documentar migração**
3. **Atualizar testes**

### Fase 3: Melhorias (Baixa Prioridade)

1. **Criar helpers de mapeamento**
2. **Adicionar tipos TypeScript mais fortes**
3. **Otimizar performance (batch checks)**

## 🔍 Como Identificar Componentes que Precisam Migrar

```bash
# Buscar uso do hook antigo
grep -r "useUserPermissions" app/ components/

# Buscar uso direto de session.user.permissions
grep -r "session.*user.*permissions" app/ components/

# Verificar componentes específicos
grep -r "hasPermission\|hasAnyPermission\|hasAllPermissions" app/ components/
```

## 📝 Notas

- **Compatibilidade:** Manter interface atual do `useUserPermissions` para não quebrar componentes existentes
- **Performance:** Usar `usePermissionsCheck` (batch) quando possível para evitar múltiplas chamadas
- **Testes:** Validar que override/cargo funcionam após migração
- **Gradual:** Migração pode ser feita gradualmente, mantendo ambos sistemas funcionando

---

**Última atualização:** Após mapeamento inicial
**Próxima revisão:** Após início da migração

