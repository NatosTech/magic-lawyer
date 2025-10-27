# Solução Dinâmica para NEXTAUTH_URL em Preview Deployments

## Problema
Quando fazemos push para uma branch que não é `main`, o Vercel cria um preview deployment com um domínio diferente (ex: `magic-lawyer-git-feature-realtime-multitenancy-magiclawyer.vercel.app`), mas o `NEXTAUTH_URL` estava fixo para o domínio de produção (`https://magiclawyer.vercel.app/`).

Isso causava problemas de autenticação porque o NextAuth.js precisa que a URL de callback seja exatamente a mesma do domínio atual.

## Solução Implementada

### 1. Configuração Dinâmica (`app/lib/auth-config.ts`)
- Detecta automaticamente o tipo de ambiente baseado no domínio
- Retorna configurações apropriadas para cada ambiente:
  - **Desenvolvimento local**: `http://localhost:3000`
  - **Preview deployments**: `https://[branch-name]-magiclawyer.vercel.app`
  - **Produção**: `https://magiclawyer.vercel.app`
  - **Domínios customizados**: `https://[custom-domain]`

### 2. Auth Options Dinâmico (`auth.ts`)
- Função `createAuthOptions(host)` que cria configuração baseada no domínio
- Mantém compatibilidade com configuração padrão existente
- Detecta automaticamente se deve usar cookies seguros ou não

### 3. API Route Personalizado (`app/api/auth/[...nextauth]/route.ts`)
- Handler dinâmico que detecta o domínio da requisição
- Aplica configuração apropriada automaticamente

### 4. Middleware Atualizado (`middleware.ts`)
- Usa URL dinâmica para validação de sessão
- Mantém funcionalidade existente de detecção de tenant

## Como Funciona

1. **Requisição chega** → Middleware detecta o domínio
2. **Configuração dinâmica** → `getNextAuthConfig()` retorna configuração apropriada
3. **NextAuth aplica** → URL de callback correta baseada no domínio atual
4. **Autenticação funciona** → Login funciona em qualquer ambiente

## Ambientes Suportados

### ✅ Desenvolvimento Local
- Domínio: `localhost:3000`
- URL: `http://localhost:3000`
- Cookies: Não seguros

### ✅ Preview Deployments (Branches)
- Domínio: `magic-lawyer-git-[branch]-magiclawyer.vercel.app`
- URL: `https://magic-lawyer-git-[branch]-magiclawyer.vercel.app`
- Cookies: Seguros

### ✅ Produção (Main Branch)
- Domínio: `magiclawyer.vercel.app`
- URL: `https://magiclawyer.vercel.app`
- Cookies: Seguros

### ✅ Domínios Customizados
- Domínio: `[custom-domain].com`
- URL: `https://[custom-domain].com`
- Cookies: Seguros

## Benefícios

1. **Login funciona em qualquer ambiente** - Não precisa mais configurar manualmente
2. **Testes em preview deployments** - Pode testar features em branches sem problemas
3. **Compatibilidade mantida** - Não quebra funcionalidade existente
4. **Detecção automática** - Não precisa de configuração manual por ambiente
5. **Segurança mantida** - Cookies seguros quando apropriado

## Uso

A solução é **transparente** - não requer mudanças no código existente. O NextAuth automaticamente detecta o ambiente e aplica a configuração correta.

### Para Desenvolvedores
- Continue fazendo push para branches normalmente
- Login funcionará automaticamente em preview deployments
- Não precisa configurar NEXTAUTH_URL manualmente

### Para Produção
- Funciona normalmente no domínio principal
- Mantém todas as funcionalidades existentes
- Não afeta usuários finais
