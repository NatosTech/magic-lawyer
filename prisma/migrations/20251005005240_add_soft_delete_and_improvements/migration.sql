-- DropIndex
DROP INDEX "public"."AreaProcesso_slug_key";

-- DropIndex
DROP INDEX "public"."CategoriaTarefa_slug_key";

-- DropIndex
DROP INDEX "public"."TipoContrato_slug_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "changedFields" TEXT[],
ADD COLUMN     "previousValues" JSONB;

-- AlterTable
ALTER TABLE "public"."Cliente" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Contrato" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Documento" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."NotificacaoUsuario" ADD COLUMN     "tentativaAtual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimoErro" TEXT;

-- AlterTable
ALTER TABLE "public"."Processo" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Tarefa" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PagamentoComissao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "valorComissao" DECIMAL(14,2) NOT NULL,
    "percentualComissao" DECIMAL(5,2) NOT NULL,
    "tipoComissao" "public"."TipoComissao" NOT NULL DEFAULT 'HONORARIOS',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoComissao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_advogadoId_idx" ON "public"."PagamentoComissao"("tenantId", "advogadoId");

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_status_idx" ON "public"."PagamentoComissao"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PagamentoComissao_pagamentoId_idx" ON "public"."PagamentoComissao"("pagamentoId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "public"."AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Documento_tenantId_visivelParaCliente_idx" ON "public"."Documento"("tenantId", "visivelParaCliente");

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataFim_idx" ON "public"."Evento"("tenantId", "dataFim");

-- CreateIndex
CREATE INDEX "Processo_tenantId_status_idx" ON "public"."Processo"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Processo_tenantId_clienteId_idx" ON "public"."Processo"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "Processo_tenantId_createdAt_idx" ON "public"."Processo"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_status_idx" ON "public"."Tarefa"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_responsavelId_idx" ON "public"."Tarefa"("tenantId", "responsavelId");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_dataLimite_idx" ON "public"."Tarefa"("tenantId", "dataLimite");

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "public"."Pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "public"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
