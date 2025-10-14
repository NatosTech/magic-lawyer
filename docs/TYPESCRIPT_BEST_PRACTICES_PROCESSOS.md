# TypeScript Best Practices: Type Safety para Processos

## 🎯 Contexto

Atualmente temos **interfaces manuais** que espelham queries do Prisma. Isso funciona, mas tem problemas de manutenibilidade.

## ❌ Abordagem Atual (O que você tem)

```typescript
// Definição manual da interface
export interface ProcessoDetalhado extends Processo {
  juiz: {
    id: string;
    nome: string;
    nomeCompleto: string | null;
    vara: string | null;
    // ... 10+ campos manualmente definidos
  } | null;
  // ...mais 200 linhas de tipos manuais
}

// Query separada no código
const processo = await prisma.processo.findFirst({
  include: {
    juiz: {
      select: {
        id: true,
        nome: true,
        // ... deve corresponder ao tipo acima
      }
    }
  }
});
```

### Problemas:
- ❌ **Duplicação**: mesma estrutura em 2 lugares
- ❌ **Sincronização manual**: alterar query = alterar interface
- ❌ **Propenso a erros**: tipo do bug que acabamos de resolver
- ❌ **Manutenção difícil**: ~200 linhas de tipos para manter

---

## ✅ Abordagem 1: Prisma Validator + GetPayload (MELHOR)

```typescript
// 1. Define a query uma única vez com validação de tipos
const processoDetalhadoArgs = Prisma.validator<Prisma.ProcessoDefaultArgs>()({
  include: {
    area: {
      select: {
        id: true,
        nome: true,
        slug: true,
      },
    },
    juiz: {
      select: {
        id: true,
        nome: true,
        nomeCompleto: true,
        vara: true,
        comarca: true,
        nivel: true,
        status: true,
        especialidades: true,
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
      },
    },
    // ... resto da query
  },
});

// 2. Deriva o tipo AUTOMATICAMENTE da query
export type ProcessoDetalhado = Prisma.ProcessoGetPayload<typeof processoDetalhadoArgs>;

// 3. Tipos derivados para subpropriedades
export type ProcessoParte = ProcessoDetalhado["partes"][number];
export type ProcessoPrazo = ProcessoDetalhado["prazos"][number];

// 4. Usa na função
export async function getProcessoDetalhado(processoId: string) {
  const processo = await prisma.processo.findFirst({
    where: { id: processoId },
    ...processoDetalhadoArgs, // ✅ Garantia de tipo
  });
  
  return processo; // TypeScript já sabe o tipo exato!
}
```

### Vantagens:
- ✅ **Fonte única da verdade**: query = tipo
- ✅ **Type-safe**: TypeScript valida que a query está correta
- ✅ **Auto-completado**: IDE sugere campos disponíveis
- ✅ **Zero duplicação**: ~200 linhas → ~50 linhas
- ✅ **Manutenção fácil**: muda query, tipo atualiza automaticamente
- ✅ **Impossível desincronizar**: erro de compilação se não corresponder

### Desvantagens:
- ⚠️ Requer refatoração (mas vale a pena!)

---

## ✅ Abordagem 2: Extrair tipo da query inline (RÁPIDO)

```typescript
// Define a query inline e extrai o tipo
const processoComRelacoes = await prisma.processo.findFirst({
  where: { id: processoId },
  include: {
    juiz: {
      select: {
        id: true,
        nome: true,
        vara: true,
        // ...
      },
    },
  },
});

// Exporta o tipo inferido
export type ProcessoDetalhado = NonNullable<typeof processoComRelacoes>;
```

### Vantagens:
- ✅ Simples e direto
- ✅ Tipo derivado automaticamente
- ✅ Sem duplicação

### Desvantagens:
- ⚠️ Precisa de uma query "exemplo" executada
- ⚠️ Menos reutilizável

---

## ✅ Abordagem 3: Hybrid (PRAGMÁTICO)

```typescript
// Mantém interfaces manuais para tipos "públicos"
export interface ProcessoDetalhadoPublic {
  id: string;
  numero: string;
  juiz: {
    nome: string;
    tribunal: { nome: string } | null;
  } | null;
  // ... apenas campos usados externamente
}

// Usa Prisma types internamente
type ProcessoDetalhadoInternal = Prisma.ProcessoGetPayload<{
  include: { /* ... */ }
}>;

// Converte
export function toPublicProcesso(
  processo: ProcessoDetalhadoInternal
): ProcessoDetalhadoPublic {
  return {
    id: processo.id,
    numero: processo.numero,
    juiz: processo.juiz ? {
      nome: processo.juiz.nomeCompleto || processo.juiz.nome,
      tribunal: processo.juiz.tribunal,
    } : null,
  };
}
```

### Vantagens:
- ✅ API pública estável
- ✅ Type-safe internamente
- ✅ Flexibilidade para transformações

### Desvantagens:
- ⚠️ Código adicional de conversão
- ⚠️ Ainda tem alguma duplicação

---

## 📊 Comparação

| Aspecto | Atual | Abordagem 1 | Abordagem 2 | Abordagem 3 |
|---------|-------|-------------|-------------|-------------|
| **Type Safety** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Manutenibilidade** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **DX (Developer Experience)** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Complexidade** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Refatoração** | Não precisa | Média | Pequena | Média/Grande |

---

## 🏆 Recomendação

### Para seu projeto: **Abordagem 1** (Prisma Validator + GetPayload)

**Por quê?**
1. Você tem ~200 linhas de tipos manuais em `processos.ts`
2. Já teve bugs de desincronização (o que consertamos)
3. É a **best practice oficial do Prisma**
4. Escala melhor para um sistema complexo
5. Economiza tempo a longo prazo

### Migração Gradual (sem quebrar nada):

```typescript
// 1. Adiciona os novos tipos
const processoDetalhadoArgs = Prisma.validator<Prisma.ProcessoDefaultArgs>()({ /* ... */ });
export type ProcessoDetalhadoV2 = Prisma.ProcessoGetPayload<typeof processoDetalhadoArgs>;

// 2. Mantém o tipo antigo por compatibilidade
export interface ProcessoDetalhado { /* ... mantém */ }

// 3. Migra função por função
export async function getProcessoDetalhadoV2(id: string): Promise<ProcessoDetalhadoV2> {
  return await prisma.processo.findFirst({
    where: { id },
    ...processoDetalhadoArgs,
  });
}

// 4. Depois que testar, substitui gradualmente no código
// 5. Remove o tipo antigo quando não estiver mais em uso
```

---

## 📚 Exemplos Reais de Uso

### Exemplo 1: Auto-complete perfeito
```typescript
// Com Prisma GetPayload
const processo: ProcessoDetalhado = await getProcessoDetalhado("123");

// IDE sugere automaticamente:
processo.juiz?.tribunal?.siteUrl // ✅ TypeScript sabe todos os campos
processo.juiz?.especialidades.map(...) // ✅ Sabe que é array
```

### Exemplo 2: Evolução segura
```typescript
// Adiciona um novo campo à query
const args = Prisma.validator<Prisma.ProcessoDefaultArgs>()({
  include: {
    juiz: {
      select: {
        telefone: true, // ✅ Adiciona aqui
      }
    }
  }
});

// O tipo já inclui automaticamente
type T = Prisma.ProcessoGetPayload<typeof args>;
// T.juiz.telefone já existe! 🎉
```

### Exemplo 3: Refatoração segura
```typescript
// Remove um campo da query
const args = {
  include: {
    juiz: {
      select: {
        // Remove 'status'
      }
    }
  }
};

// Qualquer código que usava 'status' vai dar erro de compilação
// ✅ Você descobre o problema ANTES de ir para produção
```

---

## 🚀 Ação Recomendada

1. **Curto prazo** (agora): 
   - ✅ Mantém a correção que fizemos (funciona!)
   
2. **Médio prazo** (próxima sprint):
   - Implementa Abordagem 1 para novos recursos
   - Migra `getProcessoDetalhado` para usar Prisma types
   
3. **Longo prazo** (quando tiver tempo):
   - Aplica pattern em outros módulos (clientes, tarefas, etc)
   - Remove interfaces manuais antigas

---

## 📖 Referências

- [Prisma: Generated types](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- [Prisma: Type utilities](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types)
- [Total TypeScript: Prisma patterns](https://www.totaltypescript.com/books/total-typescript-essentials/deriving-types-from-values)

