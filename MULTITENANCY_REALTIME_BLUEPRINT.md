# PLANO COMPLETO — Revogação Imediata & Sincronização Multitenant

Documento mestre para implementar bloqueio imediato de tenants/usuários, sincronização de planos e invalidação em tempo real no **Magic Lawyer**. Serve como referência de arquitetura, tarefas e critérios de validação para todo o ciclo de desenvolvimento.

---

## Índice
1. [Visão Geral](#visão-geral)
2. [Contexto Atual](#contexto-atual)
3. [Objetivos e Critérios de Sucesso](#objetivos-e-critérios-de-sucesso)
4. [Requisitos](#requisitos)
5. [Arquitetura Proposta (Visão Macro)](#arquitetura-proposta-visão-macro)
6. [Fluxo de Eventos (End-to-End)](#fluxo-de-eventos-end-to-end)
7. [Alterações de Banco & Prisma](#alterações-de-banco--prisma)
8. [Backend (Next.js / Node)](#backend-nextjs--node)
9. [Frontend Admin (Painel SuperAdmin)](#frontend-admin-painel-superadmin)
10. [Frontend Tenant (Aplicação do Escritório)](#frontend-tenant-aplicação-do-escritório)
11. [Infra & DevOps](#infra--devops)
12. [Testes & QA](#testes--qa)
13. [Observabilidade & Auditoria](#observabilidade--auditoria)
14. [Plano de Implementação / Cronograma](#plano-de-implementação--cronograma)
15. [Riscos, Mitigações e Perguntas em Aberto](#riscos-mitigações-e-perguntas-em-aberto)
16. [Backlog Fase 2+ (Realtime Avançado)](#backlog-fase-2-realtime-avançado)
17. [Checklist Operacional](#checklist-operacional)
18. [Referências de Arquivos](#referências-de-arquivos)

---

## Visão Geral
- Hoje o login bloqueia tenants/usuários inativos, mas quem já está logado continua navegando até deslogar manualmente.
- Mudanças de plano ou módulos feitas em `/admin/planos` não se propagam automaticamente para as sessões ativas dos escritórios.
- Objetivo: garantir **enforcement imediato** (requisições bloqueadas na hora) e **feedback rápido** no UI usando SWR/invalidadores, com base em versionamento de sessão e eventos internos.

---

## Contexto Atual
- `auth.ts` valida `tenant.status === "ACTIVE"` e `usuario.active === true` **apenas** durante o login.
- JWT gerado pelo NextAuth não contém nenhum indicador de versão/sincronização; `middleware.ts` só decide redirecionamentos por role/módulos.
- `app/actions/admin.ts` -> `updateTenantStatus` / `updateTenantSubscription` atualizam o banco e escrevem audit log, mas **não** notificam front-ends nem invalidam caches.
- Tenants e usuários não possuem campos de `sessionVersion`/`statusChangedAt`; seeds (`prisma/seeds/...`) assumem defaults.
- SWR está configurado com `revalidateOnFocus: false` em algumas telas críticas (ex.: `app/admin/tenants/tenants-content.tsx`), portanto alterações administrativas não “aparecem” para outros admins sem um refresh manual.
- Não existe mecanismo de push / pub-sub (Redis, Pusher, SSE) no projeto; apenas HTTP tradicional.

---

## Objetivos e Critérios de Sucesso

### Objetivos Principais
- Impedir que um tenant/usuário desativado execute qualquer ação protegida imediatamente após o toggle na área admin.
- Atualizar UI do painel admin e da aplicação do tenant logo após mudanças de status/plano/módulos, sem exigir logout manual.
- Registrar auditoria de revogações (quem realizou, qual entidade, data/hora, motivo).
- Permitir evolução futura para canais realtime (Redis Pub/Sub, SSE, WebSocket) sem retrabalho estrutural.

### Indicadores de Sucesso
- `T1`: 100% das rotas protegidas retornam `401/403` para tenants ou usuários desativados.
- `T2`: Após clicar em “Desativar tenant” o cartão em `/admin/tenants` reflete o novo status em < 3s.
- `T3`: Usuário do tenant recebe redirecionamento para `/login` e mensagem “Tenant desativado” dentro de 5s mesmo sem recarregar manualmente.
- `T4`: Logs de auditoria (`auditLogs`, `superAdminAuditLog`) possuem entradas claras para cada alteração.

---

## Requisitos

### Funcionais (RF)
- `RF-01` — SuperAdmin consegue suspender, reativar ou cancelar um tenant e a UI reflete imediatamente.
- `RF-02` — Alterações de planos/módulos (ativar, remover módulos) propagam para o tenant sem exigir novo login.
- `RF-03` — Ao desativar um usuário (`Usuario.active` → `false`), qualquer requisição autenticada posterior falha e a sessão é encerrada.
- `RF-04` — Admin e usuários visualizam mensagens de contexto quando o acesso foi revogado (modal, toast ou tela dedicada).
- `RF-05` — Todos os eventos são registrados com ator, entidade, motivo e timestamp.
- `RF-06` — MVP funciona sem depender de infraestrutura adicional (Redis/Pusher), apenas com HTTP + Mutate + checagens de sessão.

### Não Funcionais (RNF)
- `RNF-01` — Alterações devem ser idempotentes e thread-safe (incremento de versão atômico).
- `RNF-02` — Middlewares/guards não podem adicionar latência > 50ms em média.
- `RNF-03` — Código compatível com **Next.js 15 App Router**, ambiente Vercel.
- `RNF-04` — Todos os scripts/migrações devem ser revertíveis (rollback).
- `RNF-05` — Processo documentado para deploy (incluindo variáveis de ambiente novas).

---

## Arquitetura Proposta (Visão Macro)
- **Versionamento de sessão** (`sessionVersion` + `statusChangedAt`) em `Tenant` e `Usuario`.
- **Guarda centralizada** que compara o valor salvo no JWT com o valor atual do banco; se divergir, sessão é invalidada.
- **Serviço de invalidação** (`app/lib/realtime/invalidation.ts`) encapsula:
  - Incremento de versão no banco.
  - Registro em log.
  - Disparo de `mutate()` (client) e/ou `POST` para rota interna.
  - Hook futuro para Redis/SSE.
- **End-point interno** (`/api/internal/realtime/invalidate`) usado pelo backend para invalidar caches e acionar `revalidateTag`/`revalidatePath`.
- **Hooks SWR/React** (`useRealtimeTenantStatus`, `useTenantSessionGuard`) checam regularmente (ou via EventSource futuro) se a sessão mudou e executam logout forçado.
- **Mensagens de UI** uniformes para revogação (banner, modal, toast) disponíveis tanto no painel admin quanto na aplicação do tenant.

---

## Fluxo de Eventos (End-to-End)
1. SuperAdmin abre `/admin/tenants` ou `/admin/planos`.
2. Ao salvar status ou módulo:
   - `app/actions/admin.ts` (`updateTenantStatus`, `updateTenantSubscription`, `setPlanoModulos`, etc.) chamam `invalidateTenant`/`invalidateTenantPlan`.
   - Serviço incrementa `tenant.sessionVersion`, registra `TenantStatusTransition` (nova tabela), cria log de auditoria e dispara `POST /api/internal/realtime/invalidate`.
3. Rota interna:
   - Executa `revalidateTag("tenant:${tenantId}")` / `revalidatePath`.
   - Em MVP: apenas retorna 200 para confirmar.
   - Em Fase 2: publica evento em Redis Pub/Sub.
4. Painel admin (SWR):
   - Após `await updateTenantStatus`, chama `mutate("admin-tenants")` e `mutate(["tenant-details", tenantId])`.
5. Aplicação do tenant:
   - `useRealtimeTenantStatus` agenda checagem (via `SWR` + `refreshInterval` baixo ou `POST /api/session/heartbeat`).
   - Se API retorna `409`/`401` com payload `{"reason":"TENANT_SUSPENDED"}`, hook dispara `signOut({ callbackUrl: "/login?reason=tenant_suspended" })`.
6. Próxima requisição do usuário:
   - `middleware.ts` detecta mismatch de `sessionVersion` → redireciona para `/login`.
   - Server actions validam via `ensureTenantActive()` e retornam `401` com rótulo sem nem rodar lógica de domínio.

---

## Alterações de Banco & Prisma

### 1. Novos Campos nas Tabelas Existentes (`prisma/schema.prisma`)
- `Tenant`
  - `sessionVersion Int @default(1)` — incrementado a cada alteração crítica.
  - `statusChangedAt DateTime? @updatedAt` (ou setado manualmente) — rastrear última mudança de status.
  - `statusReason String?` — opcional, motivo textual (“inadimplência”, “solicitação do cliente”).
- `Usuario`
  - `active` permanece, acrescentar:
    - `sessionVersion Int @default(1)`.
    - `statusChangedAt DateTime?`.
    - `statusReason String?`.
  - Avaliar substituir `active Boolean` por enum `UsuarioStatus { ACTIVE, INVITED, SUSPENDED, DISABLED }` (opcional; se fizer, atualizar codebase inteira).
- `TenantSubscription`
  - `planRevision Int @default(1)` — aumenta sempre que módulos/plano mudam (útil para invalidar `tenantModules`).
- `AuditLog` / `SuperAdminAuditLog`
  - Garantir modelagem para salvar `sessionVersionBefore/After` (via `Json?` ou campos dedicados).

### 2. Novas Tabelas Sugeridas
- `TenantStatusTransition` (schema `audit`):
  - Campos: `id`, `tenantId`, `changedBy` (SuperAdmin), `fromStatus`, `toStatus`, `reason`, `sessionVersion`, `createdAt`.
- `UserStatusTransition` (schema `audit`):
  - Mesma estrutura para usuários.
- `SessionRevocationLog` (schema `support` ou `audit`):
  - Armazena eventos disparados para ajudar em debug.

### 3. Migrações
- Criar migration com `prisma migrate dev --name add_session_versions`.
- Atualizar seeds em `prisma/seeds/**`:
  - Popular `sessionVersion = 1`.
  - Ajustar seeds que criam tenants/usuários (ex.: `prisma/seeds/tenants/tenantSandra.js`).

### 4. Índices
- Índice composto `@@index([tenantId, sessionVersion])` em `Usuario` para consultas rápidas.
- `@@index([sessionVersion])` em `Tenant`.

### 5. Scripts auxiliares
- `scripts/backfill-session-version.ts` (opcional) para rodar em produção e inicializar valores em bases existentes.

---

## Backend (Next.js / Node)

### 1. Helpers & Serviços (novos)
- Criar `app/lib/session-version.ts` com utilidades:
  - `async getTenantSessionSnapshot(tenantId)` → retorna `{ sessionVersion, status, statusChangedAt }`.
  - `async bumpTenantSession(tenantId, reason, actor)` → incrementa versão via `prisma.tenant.update`.
  - Equivalentes para `Usuario`.
- Criar `app/lib/realtime/invalidation.ts`:
  - Funções `invalidateTenant({ tenantId, reason, actorId })`, `invalidateUser({ userId, tenantId })`.
  - Internamente: incrementa versão, registra auditoria, chama `triggerRealtimeEvent`.
  - `triggerRealtimeEvent` faz `fetch("/api/internal/realtime/invalidate", { method: "POST", body: { type, tenantId, userId } })` com cabeçalho secreto.

### 2. Auth (`auth.ts`)
- Durante `authorize`:
  - Selecionar `sessionVersion`, `statusChangedAt` para tenant e usuário.
  - Retornar no objeto do usuário: `tenantSessionVersion`, `userSessionVersion`.
- `callbacks.jwt`:
  - Persistir `token.tenantSessionVersion`, `token.userSessionVersion`, `token.tenantStatus`.
- `callbacks.session`:
  - Expor os novos campos em `session.user`.
- Tratar respostas da API interna que retornam `REDIRECT_TO_TENANT` + novo motivo (`TENANT_SUSPENDED`, `USER_DISABLED`).

### 3. Middleware (`middleware.ts`)
- Adicionar passo antes das checagens atuais:
  1. Ler `token`.
  2. Se tiver `tenantId`, chamar helper `shouldRevalidateSession`.
     - MVP: Fazer `fetch` para `/api/internal/session/validate?tenantId=...&userId=...&tenantVersion=...&userVersion=...`.
     - A rota compara com banco e devolve:
       - `200 OK` se tudo certo (opcional com `cache-control: max-age=15`).
       - `409 Conflict` com `reason`.
  3. Em caso de conflito → limpar cookies (`NextResponse.redirect("/login?reason=...")`).
- Armazenar timestamp em cookie `x-session-checked-at` para evitar checagem a cada request (ex.: apenas a cada 15 segundos).

### 4. Rotas internas (novas)
- `app/api/internal/session/validate/route.ts`
  - `POST` ou `GET` com secret header.
  - Usa Prisma (runtime node) para comparar `sessionVersion`.
  - Respostas:
    - `200 { status: "ok" }`.
    - `409 { status: "revoked", entity: "TENANT" | "USER", reason: "TENANT_SUSPENDED" }`.
  - Pode atualizar cache in-memory para reduzir hits (TTL 10s).
- `app/api/internal/realtime/invalidate/route.ts`
  - Recebe payload `{ tenantId, userId?, type: "tenant-status" | "plan-update" | "user-status" }`.
  - Executa:
    - `revalidateTag("tenant:${tenantId}")`.
    - `revalidatePath("/admin/tenants")`, `/admin/planos`, etc.
    - (Opcional) publicar no Redis (Fase 2).
  - Retorna `200` + debug.

### 5. Server Actions / Services
- `app/actions/admin.ts`
  - `updateTenantStatus`, `updateTenantDetails`, `updateTenantSubscription`, `updateTenantBranding`:
    - Incluir `await invalidateTenant({ tenantId, reason: "STATUS_UPDATE", actorId: session.user.id })`.
  - Garantir que respostas já tragam `sessionVersion`.
- `app/actions/planos.ts`
  - Ao publicar versão / sincronizar módulos:
    - Chamar `invalidateTenantPlan({ tenantId, planId })`.
    - Atualizar `TenantSubscription.planRevision`.
- `app/actions/tenant-config.ts`
  - Incluir `sessionVersion` e `planRevision` no payload.
  - Ajustar texto de status (hoje usa `ATIVO`, precisa alinhar com enum `TenantStatus`).
- Qualquer action sensível deve chamar `ensureTenantActive(session)` no início.

### 6. Logout Forçado / NextAuth
- Criar util `forceLogout(response)` que remove cookies `next-auth.session-token` / `__Secure` e redireciona.
- Usar no middleware e nas rotas que detectam revogação.

### 7. Tratamento de Tokens/Guardas
- Para JWT inválidos (versão conflitante) retornar `401` com corpo estruturado:
  ```json
  {
    "success": false,
    "reason": "TENANT_SUSPENDED",
    "message": "Seu escritório foi suspenso pelo administrador."
  }
  ```
- Front-end interpreta `reason`.

---

## Guia Passo a Passo (Hands-on)

> Objetivo: permitir que qualquer desenvolvedor (humano ou IA) execute a implementação seguindo instruções prescritivas. Todas as tarefas abaixo assumem branch dedicada (`feature/realtime-multitenancy`) e ambiente de desenvolvimento configurado (`npm install`, banco local ativo).

### Passo 0 — Preparação
1. Criar branch: `git checkout -b feature/realtime-multitenancy`.
2. Executar `npm run setup:dev` para resetar o ambiente local (esse script já derruba processos antigos, reinstala dependências, sobe PostgreSQL, zera migrações, aplica `prisma db push`, roda o seed padrão e inicia o servidor com ngrok quando aplicável).
3. Após o setup, rodar manualmente o seed específico dos planos/módulos (`npm run prisma:seed` ou script customizado) — hoje essa etapa ainda precisa ser disparada separadamente.
4. Definir flag de ambiente:
   - `.env.local` → `REALTIME_INTERNAL_TOKEN="local-realtime-token"`.
   - Atualizar `vercel.json` (quando for deploy) com a mesma variável.

### Passo 1 — Atualizações Prisma
1. Abrir `prisma/schema.prisma` e ajustar:
   ```prisma
   model Tenant {
     // ...
     statusReason      String?
     statusChangedAt   DateTime?   @default(now()) @map("status_changed_at")
     sessionVersion    Int         @default(1)
     planRevision      Int         @default(1)
     // ...
   }

   model Usuario {
     // ...
     statusReason    String?
     statusChangedAt DateTime? @default(now())
     sessionVersion  Int       @default(1)
     // ...
   }

   model TenantSubscription {
     // ...
     planRevision Int @default(1)
   }
   ```
2. Criar novas tabelas (no schema `audit`):
   ```prisma
   model TenantStatusTransition {
     id             String       @id @default(cuid())
     tenantId       String
     changedById    String
     fromStatus     TenantStatus
     toStatus       TenantStatus
     reason         String?
     sessionVersion Int
     createdAt      DateTime     @default(now())
     tenant         Tenant       @relation(fields: [tenantId], references: [id])
     changedBy      SuperAdmin   @relation(fields: [changedById], references: [id])

     @@index([tenantId])
     @@schema("audit")
   }

   model UserStatusTransition {
     id             String   @id @default(cuid())
     tenantId       String
     userId         String
     changedById    String?
     fromStatus     Boolean
     toStatus       Boolean
     reason         String?
     sessionVersion Int
     createdAt      DateTime @default(now())
     tenant         Tenant   @relation(fields: [tenantId], references: [id])
     user           Usuario  @relation(fields: [userId], references: [id])

     @@index([tenantId, userId])
     @@schema("audit")
   }
   ```
3. Rodar `npx prisma migrate dev --name add_realtime_fields`.
4. Atualizar seeds (`prisma/seeds/**`) para preencher campos novos (ex.: `sessionVersion: 1`).
5. Executar `npm run prisma:seed` e validar no banco (`prisma studio`) que campos foram populados.

### Passo 2 — Helpers de Sessão
1. Criar arquivo `app/lib/session-version.ts`:
   ```ts
   import prisma from "@/app/lib/prisma";

   export async function bumpTenantSession(tenantId: string, reason?: string) {
     return prisma.tenant.update({
       where: { id: tenantId },
       data: {
         sessionVersion: { increment: 1 },
         statusChangedAt: new Date(),
         statusReason: reason ?? undefined,
       },
       select: { sessionVersion: true },
     });
   }

   export async function getTenantSessionSnapshot(tenantId: string) {
     return prisma.tenant.findUnique({
       where: { id: tenantId },
       select: {
         id: true,
         status: true,
         statusReason: true,
         statusChangedAt: true,
         sessionVersion: true,
         planRevision: true,
       },
     });
   }
   ```
   - Criar funções equivalentes `bumpUserSession`, `getUserSessionSnapshot`.
2. Escrever testes unitários (Vitest/Jest) em `__tests__/session-version.test.ts`.

### Passo 3 — Serviço de Invalidação
1. Criar diretório `app/lib/realtime/`.
2. Arquivo `app/lib/realtime/invalidation.ts`:
   ```ts
   import { bumpTenantSession, bumpUserSession } from "@/app/lib/session-version";
   import { triggerRealtimeEvent } from "./publisher";
   import prisma from "@/app/lib/prisma";

   export async function invalidateTenant(options: {
     tenantId: string;
     reason: string;
     actorId: string;
   }) {
     const snapshot = await bumpTenantSession(options.tenantId, options.reason);

     await prisma.tenantStatusTransition.create({
       data: {
         tenantId: options.tenantId,
         changedById: options.actorId,
         fromStatus: Prisma.TenantStatus.ACTIVE, // substituir por valor real via query
         toStatus: Prisma.TenantStatus.SUSPENDED, // idem
         reason: options.reason,
         sessionVersion: snapshot.sessionVersion,
       },
     });

     await triggerRealtimeEvent({
         type: "tenant-status",
         tenantId: options.tenantId,
         sessionVersion: snapshot.sessionVersion,
     });
   }
   ```
   - Implementar lógica real de `fromStatus`/`toStatus` consultando tenant antes da atualização.
   - Criar função `invalidateUser`.
3. Criar `app/lib/realtime/publisher.ts` com `fetch` para rota interna (incluindo `REALTIME_INTERNAL_TOKEN`).

### Passo 4 — API Internas
1. Criar `app/api/internal/realtime/invalidate/route.ts` (runtime node):
   ```ts
   import { NextResponse } from "next/server";
   import { revalidatePath, revalidateTag } from "next/cache";

   export async function POST(request: Request) {
     const token = request.headers.get("x-internal-token");
     if (token !== process.env.REALTIME_INTERNAL_TOKEN) {
       return NextResponse.json({ success: false }, { status: 401 });
     }

     const payload = await request.json();

     if (payload.tenantId) {
       revalidateTag(`tenant:${payload.tenantId}`);
     }
     if (payload.type === "plan-update") {
       revalidatePath("/admin/planos");
     }

     return NextResponse.json({ success: true });
   }
   ```
2. Criar `app/api/internal/session/validate/route.ts`:
   ```ts
   import prisma from "@/app/lib/prisma";
   import { NextResponse } from "next/server";

   export async function POST(request: Request) {
     const token = request.headers.get("x-internal-token");
     if (token !== process.env.REALTIME_INTERNAL_TOKEN) {
       return NextResponse.json({ success: false }, { status: 401 });
     }

     const { tenantId, userId, tenantVersion, userVersion } = await request.json();

     const tenant = await prisma.tenant.findUnique({
       where: { id: tenantId },
       select: { status: true, sessionVersion: true, statusReason: true },
     });

     if (!tenant || tenant.status !== "ACTIVE") {
       return NextResponse.json(
         { status: "revoked", entity: "TENANT", reason: tenant?.status ?? "UNKNOWN" },
         { status: 409 },
       );
     }

     if (tenant.sessionVersion !== tenantVersion) {
       return NextResponse.json(
         { status: "revoked", entity: "TENANT", reason: "SESSION_VERSION_MISMATCH" },
         { status: 409 },
       );
     }

     // Validar usuário se informado
     if (userId) {
       const user = await prisma.usuario.findUnique({
         where: { id: userId },
         select: { active: true, sessionVersion: true },
       });

       if (!user?.active) {
         return NextResponse.json(
           { status: "revoked", entity: "USER", reason: "USER_DISABLED" },
           { status: 409 },
         );
       }

       if (user.sessionVersion !== userVersion) {
         return NextResponse.json(
           { status: "revoked", entity: "USER", reason: "SESSION_VERSION_MISMATCH" },
           { status: 409 },
         );
       }
     }

     return NextResponse.json({ status: "ok" }, { status: 200 });
   }
   ```

### Passo 5 — Ajustes NextAuth (`auth.ts`)
1. Ao buscar usuário, selecionar campos novos:
   ```ts
   const user = await prisma.usuario.findFirst({
     // ...
     select: {
       id: true,
       active: true,
       sessionVersion: true,
       tenant: {
         select: {
           id: true,
           status: true,
           sessionVersion: true,
           planRevision: true,
           statusReason: true,
         },
       },
     },
   });
   ```
2. Ao construir `resultUser`, incluir:
   ```ts
   tenantSessionVersion: user.tenant?.sessionVersion,
   tenantPlanRevision: user.tenant?.planRevision,
   tenantStatusReason: user.tenant?.statusReason,
   userSessionVersion: user.sessionVersion,
   ```
3. `callbacks.jwt` e `callbacks.session` devem carregar esses campos para o token/session.

### Passo 6 — Middleware (`middleware.ts`)
1. Antes da lógica atual, inserir:
   ```ts
   if (token && token.tenantId) {
     const shouldCheck =
       !req.cookies.get("ml-last-session-check") ||
       Date.now() - Number(req.cookies.get("ml-last-session-check")?.value ?? 0) > 15000;

     if (shouldCheck) {
       const response = await fetch(
         `${process.env.NEXTAUTH_URL ?? req.nextUrl.origin}/api/internal/session/validate`,
         {
           method: "POST",
           headers: {
             "content-type": "application/json",
             "x-internal-token": process.env.REALTIME_INTERNAL_TOKEN ?? "",
           },
           body: JSON.stringify({
             tenantId: (token as any).tenantId,
             userId: (token as any).id,
             tenantVersion: (token as any).tenantSessionVersion,
             userVersion: (token as any).userSessionVersion,
           }),
         },
       );

       if (response.status === 409) {
         const json = await response.json();
         const logoutUrl = new URL("/login", req.url);
         logoutUrl.searchParams.set("reason", json.reason ?? "SESSION_REVOKED");
         const res = NextResponse.redirect(logoutUrl);
         res.cookies.delete("next-auth.session-token");
         res.cookies.set("ml-session-revoked", "1", { path: "/" });
         return res;
       }

       const res = NextResponse.next();
       res.cookies.set("ml-last-session-check", Date.now().toString(), {
         httpOnly: false,
         path: "/",
       });
       return res;
     }
   }
   ```
2. Manter lógica existente para permissões/roles após esse bloco.

### Passo 7 — Server Actions
- **`app/actions/admin.ts`**:
  - Após `prisma.tenant.update` em `updateTenantStatus`, chamar:
    ```ts
    await invalidateTenant({
      tenantId,
      reason: `STATUS_UPDATED_TO_${status}`,
      actorId: session.user.id,
    });
    ```
  - Nas mutações de assinatura (`updateTenantSubscription`), atualizar `planRevision`:
    ```ts
    await prisma.tenantSubscription.update({
      where: { tenantId },
      data: {
        planoId: planId ?? null,
        planoVersaoId: planoVersaoId ?? null,
        planRevision: { increment: 1 },
      },
    });

    await triggerRealtimeEvent({
      type: "plan-update",
      tenantId,
    });
    ```
- **`app/actions/planos.ts`**:
  - Após publicar versão, listar tenants ativos com aquele plano e chamar `invalidateTenant` para cada (loop ou job async).
- **`app/lib/tenant-modules.ts`**:
  - Ajustar cache para considerar `planRevision`.

### Passo 8 — Frontend Admin
1. `app/admin/tenants/tenants-content.tsx`:
   - SWR config:
     ```ts
     const { data, mutate } = useSWR("admin-tenants", fetchTenants, {
       revalidateOnFocus: true,
       refreshInterval: 15000,
     });
     ```
   - Após `await updateTenantStatus` → `await mutate()`.
   - Exibir `Chip` com `tenant.statusReason`.
2. Mesma abordagem em telas detalhadas (`app/admin/tenants/[tenantId]/...`).
3. Em `/admin/planos`:
   - Após alterar módulos, mostrar toast “Sincronizando tenants…”.
   - Chamar nova action `syncPlanoWithTenants` se necessário.

### Passo 9 — Frontend Tenant
1. Criar hook `hooks/use-session-guard.ts`:
   ```ts
   import { useEffect } from "react";
   import { signOut } from "next-auth/react";

   export function useSessionGuard() {
     useEffect(() => {
       const interval = setInterval(async () => {
         const response = await fetch("/api/internal/session/validate", {
           method: "POST",
           headers: {
             "content-type": "application/json",
             "x-internal-token": process.env.NEXT_PUBLIC_REALTIME_TOKEN ?? "",
           },
           body: JSON.stringify({ heartbeat: true }),
         });

         if (response.status === 409) {
           const data = await response.json();
           await signOut({
             callbackUrl: `/login?reason=${data.reason ?? "SESSION_REVOKED"}`,
           });
         }
       }, 15000);

       return () => clearInterval(interval);
     }, []);
   }
   ```
   - Incluir o hook em `app/(protected)/layout.tsx`.
2. Atualizar componentes de erro para ler `reason` da query string e mostrar mensagens amigáveis.

### Passo 10 — Testes
1. **Unitários**:
   - `session-version` helpers.
   - `invalidateTenant` (mock `triggerRealtimeEvent`).
2. **Integração** (ex.: Playwright):
   - Script: logar como secretaria, administrador suspende tenant → próxima requisição 409, UI redireciona.
3. **Manual** (checklist no final do documento).

### Passo 11 — Documentação & Deploy
1. Atualizar `docs/ROADMAP_COMPLETO.md` com status da feature.
2. Criar seção em `docs/ADMIN_README.md` explicando como suspender tenant/usuário.
3. Deploy: rodar `npm run build` + `npx prisma migrate deploy`.

---

## Frontend Admin (Painel SuperAdmin)

### 1. Hooks SWR / Mutations
- `app/admin/tenants/tenants-content.tsx`
  - Configurar SWR com `revalidateOnFocus: true`, `refreshInterval: 30_000`.
  - Após mutate (toggle), chamar `mutate()` local e aguardar Realtime.
  - Exibir `Chip`/`Badge` com motivo (`statusReason`).
- `app/admin/tenants/[tenantId]/...`
  - Aplicar mesmo padrão em detalhes.

### 2. Feedback imediato
- Mostrar toast “Mudança enviada” + “Sessões impactadas: X” (dados retornados pelo backend).
- Modal de confirmação ao suspender/excluir com campo “Motivo” (gravar em `statusReason`).

### 3. Planos (`app/admin/planos/planos-content.tsx`)
- Após `setPlanoModulos`, `publishPlanoVersao` etc., executar:
  - `mutate("admin-planos")`.
  - Chamar `invalidateTenantPlan` para cada tenant afetado (backend deve decidir alvo).
- Indicar visualmente tenants sincronizados vs. pendentes (usar `planRevision`).

### 4. Página de auditoria
- `app/admin/auditoria` → adicionar filtros para `TenantStatusTransition` e `SessionRevocationLog`.

---

## Frontend Tenant (Aplicação do Escritório)

### 1. Guardas de Sessão
- Criar hook `hooks/use-session-guard.ts`:
  - Usa `useEffect` + `setInterval` (ex.: 15s) para chamar `/api/session/heartbeat`.
  - Se receber `409` → dispara logout + modal.
- Alternativa: usar `SWR` com `refreshInterval`.

### 2. Tratamento de Erros Globais
- `app/providers.tsx` ou contexto de toasts:
  - Capturar fetchers que retornam `reason`.
  - Exibir modal “Conta desativada” / “Plano atualizado, recarregando...”.
- `app/(protected)/layout.tsx`
  - Validar `session.user.tenantSessionVersion` e, se ausente, forçar refetch (`getServerSession` no layout).

### 3. Componentes específicos
- `app/(protected)/configuracoes/page.tsx`
  - Mostrar `tenant.planRevision`, `statusReason`.
  - Botão “Recarregar licença” que força `mutate`.
- `useTenantFromDomain` (hooks) → pode acessar novo endpoint `GET /api/public/tenant-info?slug=...` que retorna status atual (opcional).

### 4. Login Page
- `/login` deve ler query `reason`, exibir mensagens (tenant suspenso, usuário desativado, plano alterado).

---

## Infra & DevOps
- **Variáveis de ambiente**:
  - `REALTIME_INTERNAL_TOKEN` para autenticar requisições internas.
  - (Fase 2) `REDIS_URL`, `REDIS_TOKEN`.
- **Deploy**:
  - Executar migrates antes de publicar.
  - Se usar Redis no futuro, provisionar (ex.: Upstash) e adicionar a `vercel.json`.
- **Monitoramento**:
  - Adicionar logs estruturados (JSON) em `invalidateTenant`.
  - Configurar alertas (ex.: taxa de `409` > limiar).

---

## Testes & QA

### 1. Testes Automatizados
- **Unitários**:
  - Helpers de `sessionVersion`.
  - Serviços de invalidação (mock de Prisma + fetch).
- **Integração (Jest / Vitest ou E2E com Playwright)**:
  - Cenário: SuperAdmin suspende tenant → usuário ativo recebe 401 em chamada subsequente.
  - Cenário: Alteração de plano → `tenantModules` atualiza após `invalidate`.
  - Cenário: Usuário desativado manualmente → middleware redireciona.
- **Testes de API**:
  - `POST /api/internal/session/validate` com versões divergentes → `409`.

### 2. Testes Manuais (Checklist)
- Suspender tenant enquanto usuário está navegando em `/dashboard`.
- Remover módulo essencial e tentar acessar rota correspondente.
- Reativar tenant e garantir que login volta a funcionar.
- Suspender usuário específico, outro usuário do mesmo tenant continua ativo.

### 3. Dados de Teste
- Atualizar seeds para incluir multiplos tenants com estados distintos (ativo, suspenso, cancelado).
- Criar script `npm run seed:realtime-scenarios` (opcional).

---

## Observabilidade & Auditoria
- Expandir `AuditLog`/`SuperAdminAuditLog` para salvar:
  - `targetType` (`TENANT` | `USER` | `PLAN`).
  - `sessionVersionBefore`, `sessionVersionAfter`.
  - `reason`.
- Adicionar logging estruturado em:
  - `invalidateTenant`.
  - Rota interna de validação (quando retornar `409`).
  - Middleware (limitar em produção para não poluir).
- Configurar dashboards (Datadog, Logflare ou similar) — futuro.

---

## Plano de Implementação / Cronograma

| Fase | Bloco | Principais entregas | Estimativa |
| --- | --- | --- | --- |
| **Fase 0** | Preparação | Conferir ambiente, alinhar seeds, criar feature flag `ENABLE_REALTIME_GUARD` | 0,5 dia |
| **Fase 1** | Banco & Models | Migrações (`sessionVersion`, tabelas de transição), atualização seeds, script backfill | 1 dia |
| **Fase 2** | Backend Core | Helpers, rotas internas, hooks NextAuth/middleware, ajustes em server actions | 1,5 dia |
| **Fase 3** | Front Admin | SWR updates, UI feedback, mensagens de motivo | 1 dia |
| **Fase 4** | Front Tenant | Hooks de guarda, modais, tratamento de erro, ajustes UX | 1 dia |
| **Fase 5** | QA & Hardening | Testes automáticos, checklist manual, observabilidade, documentação final | 1 dia |

Total estimado (com folga para imprevistos): **~5 dias corridos** com duas pessoas (você + Codex).

---

## Riscos, Mitigações e Perguntas em Aberto
- **Risco**: Middleware executado em Edge não consegue usar Prisma diretamente → solução via API interna (runtime Node) conforme descrito.
- **Risco**: Incremento simultâneo de `sessionVersion` causando race conditions → usar `update` com `sessionVersion: { increment: 1 }`.
- **Risco**: Loop infinito de redirecionamento caso logout não limpe cookies → garantir que `signOut`/`middleware` zerem token.
- **Pergunta**: Precisamos suportar “modo apenas leitura” quando tenant suspenso? (UI dedicada vs. redirecionamento imediato).
- **Pergunta**: Reativação deve restaurar sessão automaticamente ou requer novo login? (Atualmente planeja novo login).

---

## Backlog Fase 2+ (Realtime Avançado)
1. **Redis / Upstash PubSub**:
   - `invalidateTenant` publica mensagem `tenant:<id>`.
   - Front usa `EventSource`/`WebSocket` para escutar e reagir instantaneamente.
2. **WebSocket via Ably/Supabase Realtime/Pusher**:
   - Canal por tenant.
3. **Session Heartbeat incremental**:
   - Guardar `sessionVersion` em cookie HttpOnly e validar via edge KV.
4. **Tenant Settings UI**:
   - Mostrar histórico de suspensões (timeline).
5. **Admin Notification Center**:
   - Avisar quando plano está desatualizado (revise, republique).

---

## Checklist Operacional
- [ ] Rodar `npm run prisma:migrate` e confirmar migração gerada.
- [ ] Atualizar seeds (`prisma/seeds/**`) e rodar `npm run prisma:seed`.
- [ ] Implementar helper `invalidateTenant` / `invalidateUser`.
- [ ] Atualizar `auth.ts` e `middleware.ts` para usar `sessionVersion`.
- [ ] Criar rotas internas (`/api/internal/session/validate`, `/api/internal/realtime/invalidate`).
- [ ] Ajustar server actions (`app/actions/admin.ts`, `app/actions/planos.ts`, `app/actions/tenant-config.ts`).
- [ ] Atualizar componentes Admin com `mutate` + mensagens.
- [ ] Implementar `useRealtimeTenantStatus` e encaixar nas layouts protegidas.
- [ ] Escrever testes (unit + integração) e checklist manual.
- [ ] Atualizar documentação em `docs/` se necessário (linkar este arquivo).
- [ ] Validar em ambiente de homologação antes de produção.

---

## Referências de Arquivos
- `auth.ts` — callbacks NextAuth.
- `middleware.ts` — guarda global.
- `app/actions/admin.ts`, `app/actions/planos.ts`, `app/actions/tenant-config.ts`.
- `app/admin/tenants/*`, `app/admin/planos/planos-content.tsx`.
- `app/(protected)/**` — principais telas do tenant.
- `prisma/schema.prisma` + `prisma/seeds/**`.
- `app/lib/tenant-modules.ts`, `app/lib/module-map.ts`, `app/lib/module-map-edge.ts`.
- `docs/PROJECT_STRUCTURE.md` (referência cruzada).

---

**Próximos Passos Imediatos**
1. Validar este blueprint juntos (capturar dúvidas).
2. Criar branch `feature/realtime-multitenancy`.
3. Iniciar pela migração e helpers de backend (Fase 1 + 2).

Vamos nessa! 💪

---

## 📊 Progresso de Implementação

> Status: **Fases 1-6 Concluídas** | Branch: `feature/realtime-multitenancy` | Data: 2025-01-25

### ✅ Fase 1: Banco de Dados (CONCLUÍDA)

#### Alterações no Schema (`prisma/schema.prisma`)
- **Model Tenant**:
  - Adicionados campos: `statusReason String?`, `statusChangedAt DateTime?`, `sessionVersion Int @default(1)`, `planRevision Int @default(1)`
  - Adicionado índice: `@@index([sessionVersion])`
  
- **Model Usuario**:
  - Adicionados campos: `sessionVersion Int @default(1)`, `statusChangedAt DateTime?`, `statusReason String?`
  - Adicionado índice composto: `@@index([tenantId, sessionVersion])`

- **Model TenantSubscription**:
  - Adicionado campo: `planRevision Int @default(1)`

#### Configuração de Ambiente
- Adicionado `REALTIME_INTERNAL_TOKEN` ao `.env.local` (gerado com OpenSSL)

---

### ✅ Fase 2: Backend Core (CONCLUÍDA)

#### Helpers de Versão de Sessão (`app/lib/session-version.ts`)
- `bumpTenantSession()` - Incrementa sessionVersion do tenant
- `getTenantSessionSnapshot()` - Busca estado atual da sessão do tenant
- `bumpUserSession()` - Incrementa sessionVersion do usuário
- `getUserSessionSnapshot()` - Busca estado atual da sessão do usuário
- `validateTenantSession()` - Valida sessão do tenant
- `validateUserSession()` - Valida sessão do usuário

#### Serviço de Invalidação (`app/lib/realtime/`)
- `app/lib/realtime/publisher.ts` - Dispara eventos de invalidação
  - `triggerRealtimeEvent()` - POST para rota interna (MVP)
  - Preparado para Redis/WebSocket (Fase 2)

- `app/lib/realtime/invalidation.ts` - Gerencia invalidação de sessões
  - `invalidateTenant()` - Invalida sessão do tenant + registra auditoria
  - `invalidateUser()` - Invalida sessão de usuário específico
  - `invalidateAllTenantUsers()` - Invalida sessões de todos os usuários do tenant

#### Rotas Internas de API
- `app/api/internal/session/validate/route.ts` (POST)
  - Valida sessionVersion do tenant/usuário
  - Retorna 200 (OK) ou 409 (revoked) com motivo
  - Autenticação via `x-internal-token`

- `app/api/internal/realtime/invalidate/route.ts` (POST)
  - Recebe eventos de invalidação
  - Executa `revalidateTag()` e `revalidatePath()`
  - Autenticação via `x-internal-token`

---

### ✅ Fase 5: NextAuth & Middleware (CONCLUÍDA + CORRIGIDA)

#### Alterações no Auth (`auth.ts`)
- Adicionados campos `sessionVersion`, `tenantSessionVersion`, `tenantPlanRevision` na query do usuário
- Incluídos campos de versionamento no `resultUser` e callbacks JWT/session
- Token e sessão agora transportam informações de versão para comparação no middleware

#### Alterações no Middleware (`middleware.ts`) ⚠️ CORREÇÕES
- **BUG FIX**: Cookie `ml-last-session-check` agora é setado APÓS todas as verificações, não durante
- Validação periódica de sessão (a cada 15 segundos via cookie `ml-last-session-check`)
- POST para `/api/internal/session/validate` para comparar versões
- Redirecionamento automático para `/login?reason=...` quando sessão é revogada
- Limpeza de cookies de sessão em caso de revogação
- Tratamento de erros com fail-safe (continua normalmente em caso de erro de rede)
- **ANTES**: Retornava `NextResponse.next()` imediatamente após setar cookie, pulando verificações
- **DEPOIS**: Cookie é setado apenas no final, após todas as checagens de rota/módulos

---

### ✅ Fase 6: Server Actions (CONCLUÍDA + CORRIGIDA)

#### Alterações em `app/actions/admin.ts` ⚠️ CORREÇÕES
- **`updateTenantStatus()`**: Chamada de `invalidateTenant()` após atualizar status
  - Registra reason: `STATUS_CHANGED_FROM_{antigo}_TO_{novo}`
  - Incrementa sessionVersion e invalida sessões de todos os usuários

- **`updateTenantSubscription()`**: Invalidação expandida
  - **CORREÇÃO**: `planRevision` agora é incrementado sempre que a subscription é atualizada
  - Invalidação quando `planId`, `status`, `trialEndsAt` ou `renovaEm` mudam
  - Reasons específicos para cada tipo de mudança:
    - `PLAN_CHANGED_TO_{planId}` (mudança de plano)
    - `SUBSCRIPTION_STATUS_CHANGED_TO_{status}` (mudança de status)
    - `TRIAL_ENDS_AT_CHANGED` (alteração de data de fim de trial)
    - `RENOVA_EM_CHANGED` (alteração de data de renovação)

#### Alterações em `app/actions/tenant-config.ts` ⚠️ NOVO
- Interface `TenantConfigData` atualizada para incluir:
  - `tenant.statusReason`, `tenant.statusChangedAt`, `tenant.sessionVersion`, `tenant.planRevision`
  - `subscription.planRevision`
- Consulta Prisma agora seleciona todos os campos de versionamento
- Frontend agora tem acesso aos dados de invalidação para exibir razões e chips

#### Alterações em `app/actions/admin.ts` - `updateTenantUser()` ⚠️ NOVO
- Invalidação de sessão do usuário quando `active` muda
- Reasons: `USER_REACTIVATED` (reativar) ou `USER_DEACTIVATED` (desativar)
- Log de auditoria registra quem e quando realizou a alteração

#### Alterações em `app/actions/admin.ts` - `updateTenantSubscription()` ⚠️ MELHORIAS
- **Detecção de limpeza de campos**: Invalidação também quando datas são limpas (null)
  - Detecta mudança de `trialEndsAt` ou `renovaEm` → `null`
  - Detecta mudança de `null` → data
- **Subscription criada pela primeira vez**: Invalidação automática com reason `SUBSCRIPTION_CREATED`
  - Garante que módulos disponíveis sejam recalculados imediatamente
  - Útil quando tenant não tinha assinatura e ganha uma nova
- **Total de 5 types de invalidação**:
  1. `SUBSCRIPTION_CREATED` (nova subscription)
  2. `PLAN_CHANGED_TO_{planId}` (mudança de plano)
  3. `SUBSCRIPTION_STATUS_CHANGED_TO_{status}` (mudança de status)
  4. `TRIAL_ENDS_AT_CHANGED` (mudança/limpeza de data de trial)
  5. `RENOVA_EM_CHANGED` (mudança/limpeza de data de renovação)

---

### 🚧 Próximas Fases (A Implementar)

#### Fase 7: Frontend Admin
- [ ] Hook `useRealtimeTenantStatus()` com SWR
- [ ] Atualizar `app/admin/tenants/tenants-content.tsx` com `mutate()`
- [ ] Feedback visual em tempo real
- [ ] Exibir `statusReason` em chips

#### Fase 8: Frontend Tenant
- [ ] Guarda de sessão no `(protected)/layout.tsx`
- [ ] Hook `useSessionGuard()` com heartbeat (15s)
- [ ] Tratamento de erros com mensagens amigáveis
- [ ] Modal de logout forçado

#### Fase 9: Testes & QA
- [ ] Testes unitários dos helpers
- [ ] Testes de integração (Playwright)
- [ ] Checklist manual
- [ ] Documentação

---

### 📁 Arquivos Modificados

#### Criados
- `app/lib/session-version.ts` (142 linhas)
- `app/lib/realtime/publisher.ts` (39 linhas)
- `app/lib/realtime/invalidation.ts` (122 linhas)
- `app/api/internal/session/validate/route.ts` (176 linhas)
- `app/api/internal/realtime/invalidate/route.ts` (89 linhas)

#### Modificados
- `prisma/schema.prisma` - Adicionados campos de sessionVersion em Tenant, Usuario e TenantSubscription
- `.env.local` - Adicionado REALTIME_INTERNAL_TOKEN (gerado com OpenSSL)
- `auth.ts` - Incluídos campos de versionamento no token e sessão
- `middleware.ts` - Validação periódica de sessão e redirecionamento automático (CORRIGIDO: cookie setado após verificações)
- `app/actions/admin.ts` - Chamadas de invalidação em `updateTenantStatus()` e `updateTenantSubscription()` (CORRIGIDO: planRevision incrementado, invalidação expandida)
- `app/actions/tenant-config.ts` - Interface e consultas atualizadas para incluir campos de versionamento

---

### 🎯 Critérios de Sucesso (Parciais)

- ✅ Schema atualizado com campos de versionamento
- ✅ Helpers de sessão implementados
- ✅ Serviço de invalidação criado
- ✅ Rotas internas funcionais
- ✅ Middleware validando sessão periodicamente
- ✅ Server actions chamando invalidação
- ✅ Auth.ts incluindo sessionVersion no token/sessão
- ⏳ Frontend reagindo a mudanças (não implementado)
- ⏳ Testes automatizados (não implementado)

---

### 🔧 Comandos Úteis

```bash
# Ver status do git
git status

# Ver diff das mudanças
git diff prisma/schema.prisma

# Adicionar arquivos
git add prisma/schema.prisma app/lib/session-version.ts app/lib/realtime/ app/api/internal/

# Commit
git commit -m "feat: implementar sistema de versionamento de sessão (fases 1-4)"

# Testar build
npm run build
```

---

**Última Atualização**: 2025-01-25 (Correções críticas + expansão de invalidação) | **Próxima Fase**: Frontend Admin e Tenant (Fases 7-8)

---

## 🔧 Correções Críticas Aplicadas (2025-01-25)

### Bug 1: Middleware quebrando o fluxo (middleware.ts:45)
**Problema**: Cookie `ml-last-session-check` era setado com um `NextResponse.next()` separado, causando retorno imediato e pulando todas as verificações de rota/módulos/roles. A cada 15s qualquer usuário escapava das restrições.

**Solução**: Cookie agora é setado apenas no final do middleware, após todas as verificações. Variável `sessionChecked` controla quando o cookie deve ser atualizado.

### Bug 2: planRevision nunca incrementado (app/actions/admin.ts:928)
**Problema**: Campo `TenantSubscription.planRevision` permanecia em `1` mesmo após mudanças de plano/status, quebrando gatilhos de SWR e invalidação de cache.

**Solução**: Adicionado `planRevision: { increment: 1 }` em toda atualização de `TenantSubscription`.

### Bug 3: Invalidação apenas quando plano muda (app/actions/admin.ts:963)
**Problema**: `invalidateTenant()` só era chamado quando `planId` mudava. Mudanças de status da subscription (ex.: trial → active) não invalidavam sessões.

**Solução**: Invalidação agora detecta mudanças em `planId`, `status`, `trialEndsAt` e `renovaEm`, com reasons específicos:
- `PLAN_CHANGED_TO_{planId}` (quando plano muda)
- `SUBSCRIPTION_STATUS_CHANGED_TO_{status}` (quando status muda)
- `TRIAL_ENDS_AT_CHANGED` (quando data de fim de trial muda)
- `RENOVA_EM_CHANGED` (quando data de renovação muda)

### Bug 4: tenant-config.ts sem campos de versionamento (app/actions/tenant-config.ts:30)
**Problema**: Interface `TenantConfigData` e queries Prisma não incluíam `sessionVersion`, `statusReason`, `planRevision`. Frontend ficava cego para mudanças.

**Solução**: 
- Interface atualizada com todos os campos de versionamento
- Queries incluem `tenant.statusReason`, `tenant.statusChangedAt`, `tenant.sessionVersion`, `tenant.planRevision`, `subscription.planRevision`
- Frontend agora pode exibir razões de invalidação e chips de status

### Expansão de Invalidação (app/actions/admin.ts)
**Mudanças em `updateTenantSubscription()`**:
- Agora detecta mudanças em 4 campos sensíveis: `planId`, `status`, `trialEndsAt`, `renovaEm`
- **Detecção de limpeza de campos**: Detecta quando datas são limpas (null)
- **Subscription criada**: Invalidação automática quando não havia subscription antes
- Reasons específicos para cada tipo de mudança (5 tipos diferentes, incluindo criação)

**Mudanças em `updateTenantUser()`** (NOVO):
- Invalidação de sessão quando `active` muda
- Reasons: `USER_REACTIVATED` ou `USER_DEACTIVATED`
- Garante que usuários desativados são imediatamente bloqueados
