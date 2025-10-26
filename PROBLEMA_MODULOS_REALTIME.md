# 🐛 RELATÓRIO DO PROBLEMA - Módulos Desaparecendo

## 📊 RESUMO EXECUTIVO
Os módulos aparecem momentaneamente no carregamento da página do tenant, mas desaparecem logo em seguida.

---

## 🔍 DIAGNÓSTICO

### 1. **FLUXO ESPERADO**
```
useTenantModules (hook)
  → fetchTenantModules()
  → GET /api/tenant-modules
  → getTenantAccessibleModules()
  → Retorna módulos
  → SWR armazena no cache
  → useProfileNavigation usa os módulos
  → Sidebar renderiza itens
```

### 2. **PROBLEMA IDENTIFICADO**

**Linha 36-42 de `app/hooks/use-tenant-modules.ts`:**
```typescript
const { data, mutate, error, isLoading } = useSWR<Module[]>(
  tenantId ? ["tenant-modules", tenantId] : null, 
  () => fetchTenantModules(tenantId!)
);
```

**Problema**: O SWR só faz o fetch se `tenantId` existir. Se o `tenantId` for `null` ou `undefined`, o SWR retorna `undefined`.

**Linha 59 de `app/hooks/use-profile-navigation.ts`:**
```typescript
const { modules: realtimeModules, isLoading: isLoadingModules } = useTenantModules();
```

**Problema**: Se o SWR retorna `undefined` (porque `tenantId` é null), `realtimeModules` será um array vazio `[]` (linha 64 do hook).

**Linhas 74-78 de `app/hooks/use-profile-navigation.ts`:**
```typescript
const grantedModules = useMemo(() => {
  if (grantedModulesFromRealtime.length > 0) {
    return grantedModulesFromRealtime;
  }
  return sessionModules || [];
}, [grantedModulesFromRealtime, sessionModules]);
```

**Problema**: Se `sessionModules` for `undefined` (não está no JWT), o `grantedModules` será `[]`, causando:
- `hasModuleAccess` retorna `false` para todos os módulos
- Sidebar renderiza vazia

---

## 🔬 CAUSA RAIZ

### **Hipótese 1: Tenant ID ausente no carregamento inicial**
```typescript
const tenantId = session?.user?.tenantId || null;
```
Se `session` ainda está sendo carregada no primeiro render, `session.user` pode ser `undefined`, resultando em `tenantId = null`.

### **Hipótese 2: Session não tem tenantModules no JWT**
O JWT pode não ter sido atualizado com `tenantModules` no momento do login. Isso explicaria por que `sessionModules` é `undefined`.

### **Hipótese 3: Race condition entre SWR e Session**
- `useSession()` carrega a session
- `useSWR()` tenta fazer fetch mas `tenantId` ainda é `null`
- SWR retorna `undefined`
- `useTenantModules` retorna `modules: []`
- `grantedModules` fica `[]`

---

## 🎯 EVIDÊNCIAS DO LOG

```
// Inicial - carregando
🔍 Debug módulos: {realtimeModules: 0, isLoadingModules: true, realtimeSlugs: Array(0), sessionModules: Array(7)}

// Depois - carregado
🔍 Debug módulos: {realtimeModules: 0, isLoadingModules: false, realtimeSlugs: Array(0), sessionModules: undefined}
```

**Observação crítica**: 
- `isLoadingModules: false` indica que o SWR terminou de carregar
- `realtimeModules: 0` indica que o fetch retornou array vazio
- `sessionModules: undefined` indica que o JWT não tem `tenantModules`

---

## 🛠️ SOLUÇÕES PROPOSTAS

### **Solução 1: Adicionar fallback no useTenantModules**
```typescript
return {
  modules: data || session?.user?.tenantModules || [],
  isLoading: isLoading && !session,
  error,
  mutate,
};
```

### **Solução 2: Garantir tenantModules no JWT**
Verificar se `auth.ts` está populando `tenantModules` no token:
```typescript
tenantModules: user.tenantModules // precisa existir
```

### **Solução 3: Adicionar loading state**
Evitar renderizar o sidebar enquanto `isLoadingModules && !session`:
```typescript
if (isLoadingModules && !grantedModules.length) {
  return []; // retorna vazio enquanto carrega
}
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Verificar se `session.user.tenantModules` existe no primeiro render
2. ✅ Verificar se `auth.ts` está populando `tenantModules` no JWT
3. ✅ Adicionar logs temporários para rastrear o fluxo completo
4. ✅ Verificar se `/api/tenant-modules` está retornando dados corretamente

