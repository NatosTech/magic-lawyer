# Correção: Select (HeroUI) não exibe valor selecionado

## Problemas observados

- Valor é salvo no estado mas não aparece no `Select`.
- Warnings no console:
  - `Select: Keys "..." passed to selectedKeys are not present in the collection.`
  - `<Item> with non-plain text contents is unsupported... add a textValue prop.`

## Causa raiz

- `selectedKeys` recebia uma chave que não existia na coleção renderizada (dados SWR assíncronos/atualizações).
- Itens não tinham `textValue`, dificultando acessibilidade e render do valor no trigger.

## Solução (padrão definitivo)

1. Validar `selectedKeys` contra a coleção atual (evitar passar chave inexistente).
2. Adicionar `textValue` em todos os `SelectItem`.
3. Usar `onSelectionChange` (Set → Array) e atualizar o estado com a chave.

**Referência:** [Documentação HeroUI Select](https://www.heroui.com/docs/components/select)

## Exemplo 1 — Select de Processo (single)

```tsx
import {Select, SelectItem} from "@heroui/react";

// Lista assíncrona
const processos = processosData?.processos ?? [];

// Validar keys existentes
const processoKeySet = new Set(processos.map((p: any) => p.id));
const selectedProcessKeys = formData.processoId && processoKeySet.has(formData.processoId)
  ? [formData.processoId]
  : [];

<Select
  label="Processo"
  placeholder="Selecione o processo"
  selectedKeys={selectedProcessKeys}
  onSelectionChange={(keys) => {
    const value = Array.from(keys)[0] as string;
    setFormData((s) => ({ ...s, processoId: value }));
  }}
>
  {processos.map((proc: any) => (
    <SelectItem
      key={proc.id}
      textValue={`${proc.numero}${proc.titulo ? ` - ${proc.titulo}` : ""}`}
    >
      {proc.numero} - {proc.titulo || "Sem título"}
    </SelectItem>
  ))}
</Select>
```

## Exemplo 2 — Select simples (status/prioridade)

```tsx
const opcoes = [
  { key: "RASCUNHO", label: "Rascunho" },
  { key: "EM_ANALISE", label: "Em Análise" },
  { key: "PROTOCOLADA", label: "Protocolada" },
];

<Select
  label="Status"
  selectedKeys={formData.status ? [formData.status] : []}
  onSelectionChange={(keys) => {
    const value = Array.from(keys)[0] as string;
    setFormData((s) => ({ ...s, status: value as any }));
  }}
>
  {opcoes.map((o) => (
    <SelectItem key={o.key} textValue={o.label}>
      {o.label}
    </SelectItem>
  ))}
</Select>
```

## Checklist rápido

- [ ] `selectedKeys` só com chaves existentes na coleção.
- [ ] `SelectItem` sempre com `textValue` (string simples do rótulo).
- [ ] `onSelectionChange`: `const value = Array.from(keys)[0]`.
- [ ] Em listas assíncronas (SWR), derive `selectedKeys` após validar contra o array atual.

## Dicas

- Se o warning "keys not present" aparecer, logue `selectedKeys` e a lista atual para conferir se o id existe.
- Se o valor não renderizar no trigger, verifique `textValue` e se o `key` do `SelectItem` é exatamente o id usado em `selectedKeys`.
