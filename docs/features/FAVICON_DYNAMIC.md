# Favicon Dinâmico - Abordagens e Melhores Práticas

## Problema

Precisamos atualizar o favicon dinamicamente baseado no tenant logado, mas manipular o DOM diretamente pode causar conflitos com o React durante navegação.

## Abordagens Consideradas

### ❌ Abordagem 1: Remover e Recriar Elementos
```tsx
// PROBLEMA: Causa erro "Cannot read properties of null (reading 'removeChild')"
existingFavicons.forEach(favicon => favicon.remove());
const newFavicon = document.createElement("link");
document.head.appendChild(newFavicon);
```

**Problemas:**
- React pode tentar remover elementos que já foram removidos
- Causa erros durante navegação
- Não é idempotente

### ⚠️ Abordagem 2: Atualizar Elemento Existente (Anterior)
```tsx
// Funciona, mas pode perder referência durante navegação
const favicon = document.querySelector('link[rel="icon"]');
if (favicon) favicon.href = newUrl;
```

**Problemas:**
- Pode perder referência se o React remover o elemento
- Não garante que o elemento persista entre navegações

### ✅ Abordagem 3: Elemento com ID Fixo + MutationObserver (Atual)

**Vantagens:**
1. **ID Fixo**: Usa um ID único (`dynamic-favicon`) para identificar nosso elemento
2. **Idempotente**: Sempre atualiza o mesmo elemento, nunca remove/recria
3. **MutationObserver**: Detecta quando o React remove nosso elemento e recria automaticamente
4. **Persistência**: O elemento persiste entre navegações quando possível
5. **Seguro**: Não conflita com o ciclo de renderização do React

**Como funciona:**
- Cria um único elemento `<link>` com ID fixo
- Apenas atualiza `href` e `type` quando necessário
- Usa MutationObserver para detectar remoções e recriar se necessário
- Não remove elementos no cleanup (deixa persistir)

## Alternativas Futuras

### Opção A: Next.js Metadata API (Limitada)
```tsx
// Só funciona para dados server-side, não para sessão client-side
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromDomain();
  return {
    icons: { icon: tenant.branding?.faviconUrl || "/favicon.svg" }
  };
}
```

**Limitação:** Não funciona para dados de sessão client-side (NextAuth)

### Opção B: Script no `<head>` (Não React-friendly)
```html
<script dangerouslySetInnerHTML={{__html: `
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = '${faviconUrl}';
`}} />
```

**Problemas:** Não é React-friendly, difícil de manter

## Recomendação

A **Abordagem 3** (atual) é a melhor porque:
- ✅ Funciona com dados client-side (sessão)
- ✅ Não conflita com React
- ✅ É resiliente a remoções do DOM
- ✅ Performática (evita operações desnecessárias)
- ✅ Fácil de manter e debugar

## Melhorias Futuras Possíveis

1. **Cache de favicon**: Evitar recarregar o mesmo favicon
2. **Preload**: Precarregar favicon do tenant quando detectado pelo domínio
3. **Fallback gracioso**: Se o favicon falhar ao carregar, usar o padrão
4. **Suporte a múltiplos tamanhos**: Apple touch icons, etc.
