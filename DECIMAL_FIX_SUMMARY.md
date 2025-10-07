# Correção de Serialização de Objetos Decimal

## Problema

O erro `"Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported."` estava ocorrendo ao tentar passar dados contendo campos Decimal (como `valorCausa`) de Server Components para Client Components no Next.js 15.

Além disso, após a correção inicial, foram identificados problemas adicionais:
- **Invalid Date**: Campos de data aparecendo como "Invalid Date" na interface
- **NaN Values**: Campos monetários aparecendo como "R$ NaN" na interface

## Causa Raiz

Os campos `Decimal` do Prisma não podem ser serializados diretamente pelo Next.js quando passados entre Server e Client Components. Esses campos precisam ser convertidos para tipos JavaScript nativos (number) antes da serialização.

Os problemas adicionais identificados foram causados por:
- **Date Objects**: Objetos Date não sendo convertidos adequadamente para strings durante a serialização
- **Null/Invalid Values**: Valores nulos ou inválidos não sendo tratados adequadamente no client-side

## Solução Implementada

### 1. Funções Utilitárias em `app/lib/prisma.ts`

#### `toNumber(value: Decimal | null | undefined): number | null`
Converte um valor Decimal do Prisma para number de forma segura.

#### `convertDecimalFields<T>(obj: T, fields: (keyof T)[]): T`
Converte campos Decimal específicos de um objeto para number, com suporte a objetos aninhados e arrays.

#### `convertAllDecimalFields<T>(obj: T): T`
Converte automaticamente TODOS os campos Decimal de um objeto para number e Date objects para strings ISO, incluindo objetos aninhados e arrays, sem precisar especificar quais campos converter.

### 2. Serialização JSON Explícita

Para garantir que nenhum objeto Decimal permaneça na estrutura de dados, aplicamos serialização JSON explícita após a conversão:

```typescript
const convertedData = data.map((item) => convertAllDecimalFields(item));
const serialized = JSON.parse(JSON.stringify(convertedData));
```

Essa abordagem dupla garante que:
1. Os campos Decimal são convertidos para number
2. Qualquer objeto que não possa ser serializado será detectado imediatamente
3. A estrutura de dados final é completamente limpa e pode ser passada para Client Components

### 3. Aplicação nas Actions de Processos

Todas as funções em `app/actions/processos.ts` que retornam dados com campos Decimal foram atualizadas:

- `getAllProcessos()` - Lista todos os processos
- `getProcessosDoClienteLogado()` - Processos do cliente logado
- `getProcessosDoCliente(clienteId)` - Processos de um cliente específico
- `getProcessoDetalhado(processoId)` - Detalhes completos de um processo
- `createProcesso(data)` - Criação de novo processo

## Campos Decimal no Schema

Os seguintes campos Decimal existem no schema do Prisma:

### Processo
- `valorCausa: Decimal?` - Valor da causa do processo

### Outros Modelos
- `Advogado.comissaoPadrao: Decimal`
- `Advogado.comissaoAcaoGanha: Decimal`
- `Advogado.comissaoHonorarios: Decimal`
- `Juiz.precoAcesso: Decimal?`
- `Contrato.valor: Decimal?`
- `Contrato.comissaoAdvogado: Decimal`
- `Contrato.percentualAcaoGanha: Decimal`
- `Contrato.valorAcaoGanha: Decimal`
- E outros...

## Recomendações para Novas Features

Sempre que criar ou modificar Server Actions que retornam dados contendo campos Decimal:

1. Importe as funções de conversão:
```typescript
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
```

2. Aplique a conversão e serialização antes de retornar os dados:
```typescript
const data = await prisma.model.findMany({ ... });
const converted = data.map((item) => convertAllDecimalFields(item));
const serialized = JSON.parse(JSON.stringify(converted));
return { success: true, data: serialized };
```

3. Para objetos individuais:
```typescript
const item = await prisma.model.findUnique({ ... });
const converted = convertAllDecimalFields(item);
const serialized = JSON.parse(JSON.stringify(converted));
return { success: true, item: serialized };
```

## Benefícios

1. **Compatibilidade Total**: Dados podem ser passados entre Server e Client Components sem erros
2. **Type-Safe**: As funções mantêm a tipagem TypeScript
3. **Recursivo**: Converte Decimal objects em toda a estrutura de dados, incluindo objetos aninhados e arrays
4. **Automático**: `convertAllDecimalFields` detecta e converte todos os campos Decimal automaticamente
5. **Performance**: JSON serialization é nativa e otimizada
6. **Confiável**: Falhas de serialização são detectadas imediatamente

## Testing

Para verificar se a conversão está funcionando corretamente:

1. Verifique que não há mais erros de "Decimal objects are not supported" no console
2. Os valores Decimal (como `valorCausa`) devem aparecer como números nos Client Components
3. A formatação de moeda deve funcionar corretamente: `Number(valorCausa).toLocaleString("pt-BR", { minimumFractionDigits: 2 })`

### 4. Melhorias no Client-Side

Adicionadas validações no componente `ProcessosContent` para tratar valores nulos e inválidos:

```typescript
// Validação de datas
{processo.dataDistribuicao && DateUtils.isValid(processo.dataDistribuicao) && (
  <span>{DateUtils.formatDate(processo.dataDistribuicao)}</span>
)}

// Validação de valores monetários
{processo.valorCausa && !isNaN(Number(processo.valorCausa)) && (
  <span>R$ {Number(processo.valorCausa).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
)}
```

## Arquivos Modificados

- `app/lib/prisma.ts` - Funções utilitárias de conversão
- `app/actions/processos.ts` - Aplicação da conversão em todas as funções que retornam processos
- `app/(protected)/processos/processos-content.tsx` - Validações client-side para valores nulos e inválidos

## Data: 07/10/2025

