## Checklist de Migração: Resend → Nodemailer (per-tenant)

### Objetivo
Substituir Resend por Nodemailer com credenciais por tenant, cobrindo notificações, convites, agenda, financeiro, documentos e testes de email.

---

### Etapa 1 — Modelagem & Seed
- [x] Criar enum Prisma `TenantEmailCredentialType` (`DEFAULT`, `ADMIN`).
- [x] Criar tabela `TenantEmailCredential(tenantId, type, email, appPassword, fromName, createdAt, updatedAt)`.
- [x] Adicionar relação `Tenant.emailCredentials`.
- [x] Rodar `npx prisma generate`.
- [x] Seed `tenantSandra` → `DEFAULT: magiclawyersaas@gmail.com (dxijwnbycpucxevl)`.
- [x] Seed `tenantSandra` → `ADMIN: robsonnonatoiii@gmail.com (hcwwwqxqzrhdgeuj)`.
- [ ] Atualizar seeds dos demais tenants se necessário.
- [ ] Ajustar seed do super admin (se usar e-mail próprio).

---

### Etapa 2 — Serviço de Emails (Infra)
- [x] Remover dependências/imports de Resend (substituição completa).
- [x] Instalar `nodemailer`.
- [x] Criar helper `getTenantEmailCredential(tenantId, type)` com fallback `ADMIN → DEFAULT`.
- [x] Criar helper `createTransporter({ email, appPassword })` (SMTP Gmail ou provedor configurável).
- [x] Criar helper `resolveEmailFromName`.
- [x] Refatorar amplo de `app/lib/email-service.ts`:
  - [x] Reescrever `sendEmailPerTenant({ tenantId, credentialType?, to, subject, html, text })` usando `nodemailer` (retornar `messageId`).
  - [x] Reescrever `sendBoasVindasAdvogado`.
  - [x] Reescrever `sendNotificacaoAdvogado`.
  - [x] Reescrever `testConnection`.
  - [x] Remover qualquer chamada/uso de Resend remanescente.
- [x] Atualizar `getProvidersStatus` para “Nodemailer (per-tenant)”.

---

### Etapa 3 — Atualizar Call Sites
- [x] Notificações
  - [x] `app/lib/notifications/channels/email-channel.ts` → passa `tenantId` e usa credencial `DEFAULT`.
  - [x] `app/lib/notifications/notification-service.ts` → garante propagação de `tenantId` até o canal.
  - [x] `app/actions/notificacoes.ts` → `testarEmail`/status usam métodos per-tenant.
- [x] Convites de equipe
  - [x] `app/lib/email-convite.ts` → migrado para `emailService` com `tenantId` (`ADMIN` por padrão).
  - [x] `app/actions/convites-equipe.ts` → chamadas incluem `tenantId`.
- [x] Agenda / compromissos
  - [x] `app/lib/agenda.ts` → convites/atualizações via `emailService` com `tenantId`.
  - [x] Ações relacionadas não exigem ajustes adicionais (sem envios próprios).
- [x] Financeiro
  - [x] `app/lib/financeiro.ts` → lembretes/vencimentos via `emailService` com `tenantId`.
- [x] Documentos & assinaturas
  - [x] `app/lib/documento-assinatura.ts` → convites/reenvios usando `emailService` com `tenantId`.
- [x] Advogados
  - [x] `app/actions/advogados-emails.ts` → `enviarEmailBoasVindas/Notificacao` + testes com `tenantId`.
- [x] Notificações gerais
  - [x] `app/actions/notificacoes.ts` → `testarEmail`, `obterStatusProvedores` per-tenant.
- [x] Outros fluxos
  - [x] `app/actions/processar-pagamento-confirmado.ts` → confirmação/credenciais via `sendEmailPerTenant`.
  - [x] Verificado: nenhum `hooks/use-brazil-apis`, `lib/module-detection`, `lib/asaas` ou scripts usam mais Resend.

---

### Etapa 4 — Limpeza & Ajustes Finais
- [x] Remover dependências de Resend no `package.json` (e reinstalar deps).
- [x] Remover arquivos/helpers antigos do Resend (ex.: `lib/email-service.ts` legado).
- [ ] Atualizar docs (`README`, `docs/feature-notifications/*`) para Nodemailer/SMTP multi-tenant.
- [x] Atualizar docs (`README`, `docs/feature-notifications/*`) para Nodemailer/SMTP multi-tenant.
- [x] Remover envs: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, etc. (limpo no .env e docs)
- [x] Documentar como cadastrar credenciais (painel ou seed até existir UI).
  - UI disponível: Super Admin pode gerenciar credenciais em `/admin/tenants/[tenantId]` → aba "Email (SMTP)".
  - Tenant Admin pode cadastrar credenciais em `/configuracoes` → seção "Credenciais SMTP".
  - Alternativa via seed: ver `prisma/seeds/tenants/tenantSandra.js` para exemplo.

---

<!-- Etapa 5 removida a pedido: os testes serão realizados manualmente pelo usuário ao final. -->

### Etapa 6 — Rollout
- [x] Confirmar credenciais reais por tenant (via painel/migração) — Sandra OK (DEFAULT/ADMIN em seed). Outros tenants: quando existirem.
- [x] Script/seed preparado para popular `TenantEmailCredential` (se necessário) — ver `prisma/seeds/tenants/tenantSandra.js`.
- [x] Fallback manual implementado: sem credencial → envio bloqueado com erro claro no `emailService`.
- [x] Documentado: clientes devem fornecer SMTP (ou optar por out‑of‑the‑box futuramente).

---

### Etapa 7 — Pós-migração
- [x] Implementar UI (CRUD) para credenciais por tenant.
  - [x] Super Admin: aba "Email (SMTP)" em `/admin/tenants/[tenantId]` para gerenciar credenciais de qualquer tenant.
  - [x] Tenant Admin: seção "Credenciais SMTP" em `/configuracoes` para cadastrar/editar credenciais DEFAULT/ADMIN do próprio tenant.
  - [x] Funcionalidades: criar, editar, remover credenciais e testar conexão SMTP.
- [ ] Criar job de verificação periódica das conexões.
- [ ] Documentar runbook de suporte.

---

Observação: execute as etapas em ordem, validando testes e logs de SMTP a cada fase.
