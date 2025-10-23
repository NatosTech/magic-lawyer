# Changelog — Controle de Planos (24/01/2025)

## 🧱 Alterações de Schema
- Adicionadas tabelas globais `Modulo`, `PlanoModulo`, `PlanoVersao` e `PlanoVersaoModulo` para representar o catálogo de módulos e snapshots publicados.
- Inserido campo opcional `planoVersaoId` em `TenantSubscription` para apontar a versão aplicada ao tenant.
- Novas relações em `Plano`, `TenantSubscription` e `Usuario` para suportar versionamento e auditoria (criação/publicação de versões).
- Criado enum `PlanoVersaoStatus` (`DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`) para o fluxo de publicação.

> **Ação necessária:** executar `npx prisma migrate dev --name add-controle-planos` após aplicar esta branch.

## 🌱 Seeds Atualizados
- `prisma/seeds/modulos.js`: catálogo padrão de módulos (dashboard, processos, financeiro, IA, etc.).
- `prisma/seeds/planos.js`: cria/atualiza planos Básico, Pro, Enterprise e Ultra com relacionamentos em `PlanoModulo` e `PlanoVersao`.
- `prisma/seeds/dadosFinanceiros.js`: associa cada tenant à versão publicada do plano (`planoVersaoId`).
- `prisma/seed.js`: executa o seed de módulos antes da sincronização dos planos.

> **Ação necessária:** rodar `npm run seed` (ou `node prisma/seed.js`) para popular os novos dados base.

## ✅ Impactos Esperados
- Super admin terá visão consistente do catálogo de módulos e da configuração ativa de cada plano.
- Tenants ficam vinculados a uma versão explícita do plano, facilitando auditoria e futuras publicações.
- Preparação concluída para implementar o builder visual e o fluxo de drag & drop descritos no checklist.

## 🧠 Camada de Aplicação
- Novos server actions em `app/actions/planos.ts`:
  - `getModuloCatalogo` e `getPlanoConfiguracao` expõem o catálogo central de módulos e a matriz Plano × Módulo.
  - `setPlanoModulos` permite habilitar/desabilitar módulos (modo edição completa para qualquer plano).
  - `publishPlanoVersao` gera snapshots publicados, atualiza `TenantSubscription.planoVersaoId` e arquiva versões anteriores.
  - `createPlano` e `duplicatePlano` cobrem criação e clonagem com versionamento automático.
- Todas as ações exigem super admin (`robsonnonatoiii@gmail.com`) e registram atualizações no `updatedAt` do plano, garantindo trilha de auditoria.
- Nova interface `/admin/planos` com visão por plano, agrupamento por categorias de módulo, toggle em tempo real e timeline das versões publicadas.
- Builder drag & drop entre colunas de módulos ativos/disponíveis com sincronização imediata nas ações do super admin.

## 🔎 Pontos de Atenção
- Validar migração/seed em bases existentes para evitar duplicidades (planos antigos terão suas permissões redefinidas).
- Integrações que consultam `TenantSubscription` devem considerar o novo campo `planoVersaoId`.
- Ajustar pipelines CI/CD para executar o novo seed (se aplicável).
