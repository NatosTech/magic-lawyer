# Plano de Migração de Permissões

Este documento mapeia os componentes que ainda usam o sistema antigo de permissões e define o plano de migração.

## 📊 Status Atual

**Resultado do mapeamento:**
- ✅ Server actions: 100% migrado (38 ocorrências de `checkPermission`)
- ✅ Hooks client-side: `use-user-permissions.ts` migrado para o novo sistema
  - `permission-guard.tsx` utiliza o hook migrado (validar fluxos críticos)
  - `use-profile-navigation.ts` usa `useUserPermissions()` (principalmente para role)

## 🎯 Componentes para Migrar

### 1. `app/hooks/use-user-permissions.ts` ✅ CONCLUÍDO

**Status:** Refatorado para usar `usePermissionsCheck`, mantendo interface compatível.

**Ações realizadas:**
- ✓ Uso de batch check (`usePermissionsCheck`)
- ✓ Mapeamento legado → módulo/ação
- ✓ Suporte a override/cargo/role com precedência correta
- ✓ Exposição de `isLoadingPermissions`

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

**Status:** Usa o hook migrado; falta rodar cenários críticos.

**Próximos passos:**
- [ ] Validar principais fluxos
- [ ] Considerar uso direto de `usePermissionCheck` se precisar de granularidade

### 3. `app/hooks/use-profile-navigation.ts` ⚠️ PRIORIDADE BAIXA

**Status:** Continua dependente de role; monitorar necessidade de migração.

**Próximos passos:**
- [ ] Revisar se alguma permissão específica será necessária futuramente

### 4. Uso direto de `session.user.role` ✅ OK

**Arquivos:**
- `app/(protected)/usuario/perfil/editar/profile-content.tsx` - OK (apenas role, não permissões)
- `app/actions/honorarios-contratuais.ts` - OK (apenas role, não permissões)

**Status:** Usar `session.user.role` diretamente é OK, pois role não tem override/cargo.

## 📋 Plano de Execução

### Fase 1: Migração do Hook Principal ✅ CONCLUÍDA
- Versão migrada criada e validada.
- Componentes consumidores mantiveram compatibilidade.

### Fase 2: Validação e Limpeza (em andamento)
1. [ ] Validar `permission-guard.tsx` e `use-profile-navigation.ts`
2. [ ] Atualizar testes/estórias se necessário

### Fase 3: Melhorias Futuras
1. [ ] Criar helpers de mapeamento compartilhados (opcional)
2. [ ] Fortalecer typings (opcional)

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
