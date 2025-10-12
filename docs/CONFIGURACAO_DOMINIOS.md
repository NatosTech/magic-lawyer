# Configuração de Domínios para Tenants

Este documento explica como configurar domínios personalizados para tenants no sistema Magic Lawyer.

## Visão Geral

O sistema suporta três tipos de configuração de domínios:

1. **Subdomínios Vercel** (Gratuito): `sandra.magiclawyer.vercel.app`
2. **Domínios Customizados com Wildcard**: `sandra.magiclawyer.com.br`
3. **Domínios Diretos**: `sandra.com.br`

## Opções Disponíveis

### 🟢 Opção 1: Subdomínios Vercel (RECOMENDADO para começar)

**Vantagens:**
- ✅ Gratuito
- ✅ Configuração rápida
- ✅ SSL automático
- ✅ Sem necessidade de comprar domínio

**Como configurar:**

1. **No painel da Vercel:**
   - Vá em Settings → Domains
   - Clique em "Add Domain"
   - Digite: `sandra.magiclawyer.vercel.app`
   - Clique em "Save"

2. **No sistema:**
   - O tenant será automaticamente detectado pelo subdomínio
   - Nenhuma configuração adicional necessária

**Limitações:**
- ❌ Não suporta wildcard (`*.magiclawyer.vercel.app`)
- ❌ Precisa adicionar cada subdomínio manualmente

### 🟡 Opção 2: Domínio Próprio com Wildcard

**Vantagens:**
- ✅ Wildcard automático
- ✅ Mais profissional
- ✅ Controle total

**Custos:**
- Domínio: ~R$ 40-80/ano
- Configuração DNS: Gratuita

**Como configurar:**

1. **Comprar domínio:**
   - Recomendado: Registro.br, GoDaddy, Namecheap
   - Exemplo: `magiclawyer.com.br`

2. **Configurar na Vercel:**
   - Settings → Domains → Add Domain
   - Digite: `magiclawyer.com.br`
   - Configure DNS conforme instruções da Vercel

3. **Configurar wildcard:**
   - Adicione registro DNS: `*.magiclawyer.com.br` → `cname.vercel-dns.com`

4. **No sistema:**
   - Configure o domínio base no tenant
   - Subdomínios funcionarão automaticamente

### 🔴 Opção 3: Domínios Individuais

**Vantagens:**
- ✅ Máxima personalização
- ✅ Cada tenant tem seu próprio domínio

**Desvantagens:**
- ❌ Mais caro (um domínio por tenant)
- ❌ Mais complexo de gerenciar

## Implementação Técnica

### Detecção Automática de Tenant

O sistema detecta automaticamente o tenant baseado no domínio:

```typescript
// Exemplos de detecção:
// sandra.magiclawyer.vercel.app → tenant: "sandra"
// sandra.magiclawyer.com.br → tenant: "sandra"  
// sandra.com.br → tenant: "sandra.com.br"
```

### Middleware

O middleware intercepta todas as requisições e:
1. Extrai o domínio da requisição
2. Identifica o tenant correspondente
3. Adiciona o tenant aos headers da requisição

### Autenticação

O sistema de autenticação:
1. Detecta o tenant pelo domínio
2. Busca o usuário no tenant correto
3. Valida credenciais no contexto do tenant

## Configuração no Sistema

### Para Administradores

1. **Acesse:** `/admin/tenants/[tenantId]`
2. **Use o componente:** `TenantDomainManager`
3. **Configure o domínio** do tenant
4. **Valide** se o domínio está disponível

### Para Desenvolvedores

```typescript
// Hook para detectar tenant no cliente
import { useTenantFromDomain } from '@/hooks/use-tenant-from-domain';

function MyComponent() {
  const tenant = useTenantFromDomain();
  // tenant será "sandra" se acessar sandra.magiclawyer.vercel.app
}
```

```typescript
// Função para servidor
import { getTenantByDomain } from '@/app/actions/tenant-domains';

export async function getServerSideProps({ req }) {
  const tenant = await getTenantByDomain(req.headers.host);
  // ...
}
```

## Exemplo Prático: Configurar Tenant da Sandra

### Cenário 1: Usando Vercel (Gratuito)

1. **No painel Vercel:**
   ```
   Domain: sandra.magiclawyer.vercel.app
   ```

2. **No sistema:**
   - Tenant slug: `sandra`
   - Domínio: `null` (não precisa configurar)

3. **Resultado:**
   - URL: `https://sandra.magiclawyer.vercel.app`
   - Login automático no tenant "sandra"

### Cenário 2: Usando Domínio Próprio

1. **Comprar domínio:**
   ```
   magiclawyer.com.br (R$ 40/ano)
   ```

2. **Configurar DNS:**
   ```
   A    @              → IP da Vercel
   CNAME *.magiclawyer.com.br → cname.vercel-dns.com
   ```

3. **Na Vercel:**
   ```
   Domain: magiclawyer.com.br
   ```

4. **No sistema:**
   - Tenant slug: `sandra`
   - Domínio: `magiclawyer.com.br` (configurado no tenant)

5. **Resultado:**
   - URL: `https://sandra.magiclawyer.com.br`
   - Login automático no tenant "sandra"

## Troubleshooting

### Domínio não está funcionando

1. **Verifique DNS:**
   ```bash
   nslookup sandra.magiclawyer.vercel.app
   ```

2. **Verifique propagação:**
   - Pode levar até 24h para propagar

3. **Verifique configuração no sistema:**
   - Tenant existe?
   - Domínio configurado corretamente?

### Login não funciona com domínio

1. **Verifique logs:**
   ```bash
   # Logs do sistema mostrarão:
   # [auth] Tentativa de login recebida { tenantFromDomain: "sandra" }
   ```

2. **Verifique tenant:**
   - Slug do tenant deve coincidir com subdomínio
   - Usuário deve existir no tenant correto

### SSL não funciona

1. **Vercel gerencia SSL automaticamente**
2. **Para domínios próprios:**
   - Verifique se DNS está correto
   - Aguarde propagação (até 24h)

## Migração entre Opções

### De Vercel para Domínio Próprio

1. **Compre o domínio**
2. **Configure DNS**
3. **Adicione domínio na Vercel**
4. **Configure wildcard**
5. **Atualize domínio no tenant**
6. **Teste funcionamento**
7. **Comunique mudança aos usuários**

### Backup e Segurança

- ✅ Todos os dados ficam no mesmo banco
- ✅ Migração é transparente
- ✅ URLs antigas continuam funcionando durante transição

## Custos Estimados

| Opção | Custo Inicial | Custo Anual | Configuração |
|-------|---------------|-------------|--------------|
| Vercel | R$ 0 | R$ 0 | 5 min |
| Domínio Próprio | R$ 40 | R$ 40 | 30 min |
| Domínios Individuais | R$ 40/tenant | R$ 40/tenant | 15 min/tenant |

## Recomendações

1. **Para começar:** Use subdomínios Vercel
2. **Para crescimento:** Migre para domínio próprio com wildcard
3. **Para clientes premium:** Ofereça domínios individuais

## Suporte

Para dúvidas sobre configuração de domínios:
- Documentação Vercel: https://vercel.com/docs/domains
- Suporte DNS: Registro.br, GoDaddy, etc.
- Logs do sistema: `/admin/logs`
