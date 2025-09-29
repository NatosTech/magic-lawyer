-- CreateEnum
CREATE TYPE "public"."NotificacaoTipo" AS ENUM ('SISTEMA', 'PRAZO', 'DOCUMENTO', 'MENSAGEM', 'FINANCEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."NotificacaoPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "public"."NotificacaoStatus" AS ENUM ('NAO_LIDA', 'LIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "public"."NotificacaoCanal" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM', 'PUSH');

-- CreateTable
CREATE TABLE "public"."Notificacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "public"."NotificacaoTipo" NOT NULL DEFAULT 'SISTEMA',
    "prioridade" "public"."NotificacaoPrioridade" NOT NULL DEFAULT 'MEDIA',
    "canais" "public"."NotificacaoCanal"[] DEFAULT ARRAY['IN_APP']::"public"."NotificacaoCanal"[],
    "dados" JSONB,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "agendarPara" TIMESTAMP(3),
    "expiracaoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificacaoUsuario" (
    "id" TEXT NOT NULL,
    "notificacaoId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "canal" "public"."NotificacaoCanal" NOT NULL DEFAULT 'IN_APP',
    "status" "public"."NotificacaoStatus" NOT NULL DEFAULT 'NAO_LIDA',
    "entregueEm" TIMESTAMP(3),
    "lidoEm" TIMESTAMP(3),
    "reabertoEm" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificacaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_tipo_idx" ON "public"."Notificacao"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_prioridade_idx" ON "public"."Notificacao"("tenantId", "prioridade");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_agendarPara_idx" ON "public"."Notificacao"("tenantId", "agendarPara");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_tenantId_usuarioId_status_idx" ON "public"."NotificacaoUsuario"("tenantId", "usuarioId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoUsuario_notificacaoId_usuarioId_canal_key" ON "public"."NotificacaoUsuario"("notificacaoId", "usuarioId", "canal");

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_notificacaoId_fkey" FOREIGN KEY ("notificacaoId") REFERENCES "public"."Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
