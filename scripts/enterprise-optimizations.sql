-- Enterprise optimizations for Magic Lawyer
-- This script adds all advanced constraints, indexes, and full-text search
-- Run automatically after seed to ensure enterprise features are always available

-- =============================================
-- 1. DATE INTEGRITY CONSTRAINTS
-- =============================================

-- Evento: dataFim must be >= dataInicio
ALTER TABLE "Evento" 
ADD CONSTRAINT evento_data_fim_gte_inicio 
CHECK ("dataFim" >= "dataInicio")

-- Contrato: dataFim must be >= dataInicio when both exist
ALTER TABLE "Contrato" 
ADD CONSTRAINT contrato_data_fim_gte_inicio 
CHECK ("dataFim" IS NULL OR "dataInicio" IS NULL OR "dataFim" >= "dataInicio")

-- =============================================
-- 2. FINANCIAL VALUE CONSTRAINTS
-- =============================================

-- Ensure positive values for financial amounts
ALTER TABLE "Fatura" 
ADD CONSTRAINT fatura_valor_positivo 
CHECK ("valor" >= 0)

ALTER TABLE "Pagamento" 
ADD CONSTRAINT pagamento_valor_positivo 
CHECK ("valor" >= 0)

ALTER TABLE "PagamentoComissao" 
ADD CONSTRAINT pagamento_comissao_valor_positivo 
CHECK ("valorComissao" >= 0)

-- =============================================
-- 3. UNIQUE PARTIAL INDEXES
-- =============================================

-- Only one primary address per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tenant_endereco_um_principal 
ON "TenantEndereco"("tenantId") 
WHERE "principal" = true

-- =============================================
-- 4. FULL-TEXT SEARCH SETUP
-- =============================================

-- Add full-text search columns for Processo
ALTER TABLE "Processo" 
ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("titulo", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("descricao", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("numero", '')), 'A')
) STORED

-- Add full-text search columns for Documento
ALTER TABLE "Documento" 
ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("nome", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("descricao", '')), 'B')
) STORED

-- =============================================
-- 5. GIN INDEXES FOR FULL-TEXT SEARCH
-- =============================================

-- Create GIN index for full-text search on Processo
CREATE INDEX IF NOT EXISTS processo_tsv_gin ON "Processo" USING GIN (tsv)

-- Create GIN index for full-text search on Documento
CREATE INDEX IF NOT EXISTS documento_tsv_gin ON "Documento" USING GIN (tsv)

-- GIN index for Juiz.especialidades array searches
CREATE INDEX IF NOT EXISTS juiz_especialidades_gin ON "Juiz" USING GIN ("especialidades")

-- =============================================
-- 6. ADDITIONAL PERFORMANCE INDEXES
-- =============================================

-- Index for soft delete queries across all main entities
CREATE INDEX IF NOT EXISTS "Cliente_tenantId_deletedAt_idx" ON "Cliente"("tenantId", "deletedAt")

CREATE INDEX IF NOT EXISTS "Processo_tenantId_deletedAt_idx" ON "Processo"("tenantId", "deletedAt")

CREATE INDEX IF NOT EXISTS "Documento_tenantId_deletedAt_idx" ON "Documento"("tenantId", "deletedAt")

CREATE INDEX IF NOT EXISTS "Contrato_tenantId_deletedAt_idx" ON "Contrato"("tenantId", "deletedAt")

CREATE INDEX IF NOT EXISTS "Tarefa_tenantId_deletedAt_idx" ON "Tarefa"("tenantId", "deletedAt")

-- Index for financial reconciliation queries
CREATE INDEX IF NOT EXISTS "Pagamento_tenantId_status_idx" ON "Pagamento"("tenantId", "status")

CREATE INDEX IF NOT EXISTS "Pagamento_tenantId_createdAt_idx" ON "Pagamento"("tenantId", "createdAt")

-- Index for document tracking
CREATE INDEX IF NOT EXISTS "ProcessoDocumento_tenantId_documentoId_idx" ON "ProcessoDocumento"("tenantId", "documentoId")

-- Index for notification metrics
CREATE INDEX IF NOT EXISTS "Notificacao_tenantId_createdAt_idx" ON "Notificacao"("tenantId", "createdAt")

CREATE INDEX IF NOT EXISTS "NotificacaoUsuario_tenantId_createdAt_idx" ON "NotificacaoUsuario"("tenantId", "createdAt")

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN "Processo".tsv IS 'Full-text search vector for Portuguese content (title, description, number)'

COMMENT ON COLUMN "Documento".tsv IS 'Full-text search vector for Portuguese content (name, description)'

COMMENT ON CONSTRAINT evento_data_fim_gte_inicio ON "Evento" IS 'Ensures event end time is after start time'

COMMENT ON CONSTRAINT contrato_data_fim_gte_inicio ON "Contrato" IS 'Ensures contract end date is after start date when both exist'

COMMENT ON CONSTRAINT fatura_valor_positivo ON "Fatura" IS 'Ensures invoice values are non-negative'

COMMENT ON CONSTRAINT pagamento_valor_positivo ON "Pagamento" IS 'Ensures payment values are non-negative'
