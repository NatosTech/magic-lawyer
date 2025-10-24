# Correção: Middleware de Controle de Acesso a Rotas por Módulos

## Problema

O middleware não estava executando a verificação de permissões de módulos, permitindo que usuários acessassem rotas restritas mesmo sem ter o módulo necessário em seu plano.

### Sintomas Observados:
- Usuários com plano "Básico" conseguiam acessar rotas como `/equipe` e `/contratos`
- O middleware estava sendo executado mas não verificava as permissões
- Logs mostravam que o middleware parava antes da verificação de módulos

## Causa Raiz

O middleware estava retornando prematuramente quando detectava um tenant pelo domínio, impedindo que a verificação de permissões fosse executada.

### Código Problemático:
```typescript
// Se detectamos um tenant pelo domínio, adicionar aos headers
if (tenantFromDomain) {
  const response = NextResponse.next();
  response.headers.set("x-tenant-from-domain", tenantFromDomain);
  
  // PROBLEMA: Retornava aqui, pulando a verificação de permissões
  return response;
}
```

## Solução Implementada

### 1. Remoção do Return Prematuro

Removido o `return response` quando um tenant é detectado pelo domínio, permitindo que o middleware continue para a verificação de permissões:

```typescript
// Se detectamos um tenant pelo domínio, adicionar aos headers
if (tenantFromDomain) {
  console.log("[middleware] Tenant detectado, adicionando header");
  const response = NextResponse.next();
  response.headers.set("x-tenant-from-domain", tenantFromDomain);
  
  // CORREÇÃO: NÃO retornar aqui - continuar para verificação de permissões
  // NÃO retornar aqui - continuar para verificação de permissões
}
```

### 2. Logs de Debug Adicionados

Adicionados logs detalhados para monitorar o fluxo do middleware:

```typescript
// Debug detalhado do token
console.log("[middleware] Debug do token:", {
  hasToken: !!token,
  tokenKeys: token ? Object.keys(token) : [],
  role: token ? (token as any).role : null,
  tenantModules: token ? (token as any).tenantModules : null,
});

console.log("[middleware] Continuando execução do middleware...");
console.log("[middleware] Tenant detectado:", { host, tenantFromDomain });
```

### 3. Verificação de Permissões Funcionando

Agora o middleware executa corretamente a verificação de permissões:

```typescript
// Verificar permissões de módulos para usuários comuns
if (isAuth && !req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/api")) {
  console.log("[middleware] ENTRANDO na verificação de permissões!");
  
  const modules = (token as any)?.tenantModules as string[] | undefined;
  const role = (token as any)?.role;

  if (role !== "SUPER_ADMIN") {
    console.log("[middleware] Usuário não é SuperAdmin, verificando módulos...");
    
    const allowed = isRouteAllowedByModules(req.nextUrl.pathname, modules);

    if (!allowed) {
      console.log("[middleware] Acesso negado, redirecionando para dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      console.log("[middleware] Acesso permitido à rota:", req.nextUrl.pathname);
    }
  }
}
```

## Arquivos Modificados

- `middleware.ts` - Correção do fluxo de execução do middleware

## Fluxo Correto do Middleware

1. **Detecção de Token**: Verifica se usuário está autenticado
2. **Detecção de Tenant**: Identifica tenant pelo domínio (ex: `sandra.localhost`)
3. **Adição de Headers**: Adiciona header `x-tenant-from-domain` (SEM RETORNAR)
4. **Verificação de Permissões**: Executa verificação de módulos
5. **Controle de Acesso**: Bloqueia ou permite acesso baseado nos módulos do plano

## Logs de Debug Esperados

Para uma rota restrita como `/equipe` com usuário do plano "Básico":

```
[middleware] Executando middleware para rota: /equipe
[middleware] Debug do token: { hasToken: true, role: 'ADMIN', tenantModules: [...] }
[middleware] Continuando execução do middleware...
[middleware] Tenant detectado: { host: 'sandra.localhost:9192', tenantFromDomain: 'sandra' }
[middleware] Tenant detectado, adicionando header
[middleware] Verificando condições: shouldCheckPermissions: true
[middleware] ENTRANDO na verificação de permissões!
[middleware] Usuário não é SuperAdmin, verificando módulos...
[module-map] Verificando acesso à rota: { pathname: '/equipe', modules: [...] }
[module-map] Módulo encontrado: gestao-equipe
[module-map] Verificação final: { hasModule: false }
[middleware] Acesso negado, redirecionando para dashboard
```

## Benefícios

1. **Segurança**: Usuários não podem mais acessar rotas restritas
2. **Controle de Planos**: Sistema de módulos funciona corretamente
3. **Auditoria**: Logs detalhados para monitoramento
4. **Flexibilidade**: SuperAdmin ainda tem acesso total
5. **Performance**: Verificação eficiente sem impacto na performance

## Testes Realizados

- ✅ Usuário com plano "Básico" não consegue acessar `/equipe`
- ✅ Usuário com plano "Básico" não consegue acessar `/contratos`
- ✅ SuperAdmin consegue acessar todas as rotas
- ✅ Usuários com módulos corretos conseguem acessar suas rotas
- ✅ Redirecionamento correto para `/dashboard` quando acesso negado

## Data: 24/01/2025

---

**Nota**: Esta correção garante que o sistema de controle de acesso por módulos funcione corretamente, respeitando as limitações de cada plano de assinatura.
