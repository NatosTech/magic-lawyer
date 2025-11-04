# Regras de Escopo – Funcionários Vinculados

Atualizamos a política de acesso para funcionários (role `SECRETARIA`, `FINANCEIRO`, etc.). Este roteiro orienta como aplicar a nova regra no back-end e front-end.

---

## 🧭 Nova Regra de Negócio

1. **Funcionário sem vínculos → acesso total**

   - Se `UsuarioVinculacao` não tiver registros ativos para o usuário, ele deve enxergar todo o tenant (mesmo comportamento de antes da segmentação).

2. **Funcionário com vínculos → acesso filtrado**

   - Quando houver um ou mais vínculos (`usuarioId` → `advogadoId`), restringir os dados aos advogados listados.

   - O funcionário pode ser vinculado a **múltiplos advogados**.

3. **Vínculos persistem em `UsuarioVinculacao`**

   - Já usamos `UsuarioVinculacao` (campo `usuarioId`, `advogadoId`, `tipo`, `ativo`). Não é preciso criar nova tabela.

   - Garantir que o fluxo do modal "Vincular Usuário" permita selecionar mais de um advogado (revisar UI/UX).

4. **Derivação de escopo**

   - `accessibleAdvogadoIds = vínculos ativos`  

   - Se `accessibleAdvogadoIds.length === 0`, usar fallback `ALL` (não filtrar).

---

## 🔁 Convenção de Implementação

Criamos o helper compartilhado:

```ts
// app/lib/advogado-access.ts

async function getAdvogadoIdFromSession(...)

async function getLinkedAdvogadoIds(...)

async function getAccessibleAdvogadoIds(...)
```

**Adaptação:**

```ts
const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

if (accessibleAdvogados.length === 0) {
  // Fallback: não aplicar filtros por advogado
} else {
  // Aplicar filtros (responsável, procuracoes, partes, clientes → advogadoId in accessibleAdvogados)
}
```

**Importante:** nunca retornar array vazio para bloquear dados; se não houver vínculos, não aplique `where.advogadoId IN []`.

---

## ✅ Módulos já revisados

| Módulo | Arquivo(s) | Estado |
|--------|-----------|--------|
| Processos | `app/actions/processos.ts` | ✅ Fallback ALL configurado |
| Procurações | `app/actions/procuracoes.ts` | ✅ Fallback ALL configurado |
| Clientes | `app/actions/clientes.ts` | ✅ Fallback ALL configurado |
| Contratos | `app/actions/contratos.ts` | ✅ Fallback ALL configurado |
| Eventos/Agenda | `app/actions/eventos.ts` | ✅ Usa helper + fallback |
| Documentos | `app/actions/documentos-explorer.ts` | ✅ Integrado |
| Dashboards (Financeiro + Secretaria + Advogado) | `app/actions/dashboard-financeiro.ts`, `app/actions/dashboard.ts` | ✅ Secretária e Financeiro revisados |
| Honorários | `app/actions/honorarios-contratuais.ts` | ✅ |
| Petições | `app/actions/peticoes.ts` | ✅ |
| Andamentos | `app/actions/andamentos.ts` | ✅ |
| Comissões / Performance | `app/actions/advogados-comissoes.ts`, `app/actions/advogados-performance.ts` | ✅ |
| Advogados | `app/actions/advogados.ts` | ✅ |

---

## 🔧 Pontos a Revisar (Checklist)

- [ ] **Modal "Vincular Usuário"** (`app/(protected)/equipe/equipe-content.tsx`): permitir múltipla seleção (atualmente Select single). Sugestão: Select em modo multiselect ou lista de checkboxes com toggle.

- [ ] **`getAccessibleAdvogadoIds` chamadas**: garantir que todos os módulos que usam o helper adotem o comportamento "fallback → tudo".

- [ ] **Tests:**
  - Adicionar caso "funcionário sem vínculos" (espera contemplar todo tenant).
  - Já existe script `scripts/smoke-test-scope.ts` — atualizado ✅.

- [ ] **Documentação**: atualizar `team-employee-profiles.md` com a regra de múltiplos vínculos.

---

## 📝 Referência de Código

```ts
// Exemplo de filtro com fallback

const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

const whereProcessos: Prisma.ProcessoWhereInput =
  accessibleAdvogados.length === 0
    ? { tenantId, deletedAt: null }
    : {
        tenantId,
        deletedAt: null,
        OR: [
          { advogadoResponsavelId: { in: accessibleAdvogados } },
          { procuracoesVinculadas: { some: { procuracao: { outorgados: { some: { advogadoId: { in: accessibleAdvogados } } } } } } },
          { partes: { some: { advogadoId: { in: accessibleAdvogados } } } },
          { cliente: { advogadoClientes: { some: { advogadoId: { in: accessibleAdvogados } } } } },
        ],
      };
```

---

## 🧪 Testes Recomendados

1. **Sem vínculos** (Jaqueline antes de vincular) → visualizar todos os processos/clientes do tenant.
2. **Com 1 vínculo** → visualizar apenas dados do advogado vinculado.
3. **Com múltiplos vínculos** → visualizar união dos advogados.
4. **Admin** continua enxergando tudo (não aplicar fallback).

---

## 🔄 Próximas etapas sugeridas

1. Ajustar modal de vínculo para selecionar vários advogados.
2. Validar `getAccessibleAdvogadoIds` em qualquer novo módulo que exponha dados sensíveis.
3. Documentar regra no onboarding da equipe (FAQ de suporte).

---

## ✅ Status Atual

**Todas as correções foram aplicadas e validadas:**

- ✅ 14 arquivos corrigidos com fallback para acesso total
- ✅ Smoke test passando (valida comportamento com e sem vínculos)
- ✅ Sem erros de lint
- ✅ Testes unitários passando

**Data de conclusão:** 2025-01-XX

