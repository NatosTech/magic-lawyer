# 📊 Status das Integrações — Magic Lawyer

**Data:** 2025-12-11  
**Propósito:** dar uma visão única do que o sistema é, quais integrações já estão ativas, o que está em andamento e o que falta priorizar.

## O que é o Magic Lawyer
- SaaS jurídico multi-tenant e white label para escritórios (branding, domínio e credenciais por tenant).
- Módulos core: processos, agenda, financeiro, documentos, notificações em tempo real e portal do cliente.
- Integrações críticas: Asaas (billing), Cloudinary (armazenamento), Google Calendar, Ably (realtime), Resend para e-mail transacional por tenant, Clicksign, certificados PJe/Comunica e BrasilAPI/ViaCEP/ReceitaWS.

## Resumo rápido (foto atual)
- **Cobertura core de integrações SaaS:** ~80% pronta para uso (Asaas, Cloudinary, Google Calendar, realtime+email, BrasilAPI).
- **Integrações jurídicas (PJe/Comunica + scraping):** ~35% — infraestrutura pronta (certificados, cron, capture-service), mas faltam autenticação PJe real, scraping TJBA/TJSP e persistência/normalização dos dados.
- **Assinatura digital (Clicksign):** ~60% — SDK e fluxo backend prontos; falta UI, webhooks/callbacks e configuração por tenant.
- **Integrações avançadas (Slack/Teams/Telegram/GA4/Outlook/Apple Calendar):** 0% — não iniciadas.

## Mapa de integrações (detalhado)

### ✅ Core em produção
- **Financeiro — Asaas (~95%)**
  - O que funciona: configuração por tenant (`app/(protected)/configuracoes/asaas/page.tsx`), ações `app/actions/asaas.ts`, webhook robusto `app/api/webhooks/asaas/route.ts` com `AsaasWebhookService`, checkout/recorrência (`app/actions/processar-pagamento*`), health-check em `app/actions/system-status.ts`.
  - Pendências: sincronizar plano x cobrança recorrente (item aberto no checklist), cobertura E2E e monitoramento do `ASAAS_WEBHOOK_SECRET`.
- **Armazenamento — Cloudinary (100%)**
  - Upload/versionamento/movimentação multi-tenant (`lib/upload-service.ts`, `app/actions/documentos-explorer.ts`), limpeza e health-check (`app/actions/system-status.ts`), estrutura documentada em `docs/infrastructure/CLOUDINARY_FOLDER_STRUCTURE.md`.
- **Agenda — Google Calendar (100%)**
  - Conexão OAuth + sync 2 vias (exportar/importar), toggle de sync, UI completa (`components/google-calendar-integration.tsx`), ações `app/actions/google-calendar.ts`, guia `docs/setup/GOOGLE_CALENDAR_SETUP.md`.
- **Realtime + Notificações (Ably + E-mail transacional) (~85%)**
  - Ably com fallback HTTP (`app/providers/realtime-provider.tsx`, `app/lib/realtime/publisher.ts`), notificações multi-canal (`app/lib/notifications/notification-service.ts`), e-mail via Resend por tenant (`app/lib/email-service.ts`), catálogo de eventos em `docs/features/notifications/NOTIFICATIONS_EVENT_CATALOG.md`.
- **Dados Brasil (CEP/CPF/CNPJ/IBGE) (100%)**
  - Helpers em `lib/api/` (cep/cpf/cnpj/brazil-states/municipios) usados em onboarding e cadastros.

### 🚧 Parcial / Em desenvolvimento
- **Assinatura digital — Clicksign (~60%)**
  - Cliente/SDK e fluxo backend prontos (`app/lib/clicksign.ts`, `app/lib/documento-assinatura.ts`, campos no Prisma).
  - Falta: UI/rotas para envio/gestão, webhooks/callback de status, configuração/token por tenant e testes e2e.
- **Certificados + PJe/Comunica (~35%)**
  - Infra pronta: UI de certificados (`app/(protected)/configuracoes/digital-certificates-panel.tsx`), captura via Comunica `/api/cron/comunica` + `lib/api/juridical/pje/comunica.ts` atualizando logs/audit, capture-service + server actions (`app/lib/juridical/capture-service.ts`, `app/actions/juridical-capture.ts`), base de tipos/config/normalização em `lib/api/juridical/`.
  - Falta: autenticação/consulta PJe real (`lib/api/juridical/pje.ts`), scraping TJBA/TJSP (`lib/api/juridical/scraping.ts`), persistir processos/movimentações no banco e normalizar, workers/filas e métricas; integrações eProc/Projudi/CNJ/OAB ainda não iniciadas.
- **Sincronização plano x cobrança (Asaas)**  
  - Item aberto no checklist (`docs/checklists/CHECKLIST_TOTAL_MAGICLAWYER.md`): alinhar plano do tenant com billing recorrente para evitar divergência.

### ❌ Não iniciadas / backlog
- **Integrações avançadas:** Slack, Microsoft Teams, Telegram, Zapier, Outlook/Apple Calendar, GA4/analytics.
- **Canal WhatsApp/SMS dedicado:** não há provedor configurado (TotalVoice/Zenvia/Twilio).
- **Integrações externas premium:** API de personalização e conectores genéricos (Zapier/Make) não planejados.

## Próximas ações recomendadas
1) Persistir o payload do Comunica PJe em tabelas próprias (Processo/MovimentacaoProcesso) e ligar normalização.  
2) Implementar autenticação PJe real no `lib/api/juridical/pje.ts` e scraping TJBA/TJSP.  
3) Fechar o ciclo Clicksign: configurar token por tenant, criar UI de envio/consulta e webhooks de status.  
4) Automatizar reconciliação Asaas x planos e cobrir com testes e2e de checkout + webhook.  
5) Planejar backlog das integrações avançadas (Slack/Teams/GA4) para evitar choque de prioridades com o PJe.

## Links rápidos
- Checklist geral: `docs/checklists/CHECKLIST_TOTAL_MAGICLAWYER.md`
- Status APIs jurídicas (detalhe): `lib/api/juridical/README.md` e cron `app/api/cron/comunica/route.ts`
- Setup: `docs/setup/README.md`
