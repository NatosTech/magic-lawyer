-- Adicionar campos financeiros para comissões e percentuais
-- Esta migração adiciona campos necessários para o sistema financeiro

-- Adicionar campos de comissão ao modelo Advogado
ALTER TABLE "Advogado" ADD COLUMN "comissaoPadrao" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Advogado" ADD COLUMN "comissaoAcaoGanha" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Advogado" ADD COLUMN "comissaoHonorarios" DECIMAL(5,2) DEFAULT 0.00;

-- Adicionar campos de comissão ao modelo Contrato
ALTER TABLE "Contrato" ADD COLUMN "comissaoAdvogado" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Contrato" ADD COLUMN "percentualAcaoGanha" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Contrato" ADD COLUMN "valorAcaoGanha" DECIMAL(14,2) DEFAULT 0.00;

-- Adicionar campos de comissão ao modelo Fatura
ALTER TABLE "Fatura" ADD COLUMN "comissaoAdvogado" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Fatura" ADD COLUMN "valorComissao" DECIMAL(14,2) DEFAULT 0.00;
ALTER TABLE "Fatura" ADD COLUMN "tipoComissao" TEXT DEFAULT 'HONORARIOS';

-- Adicionar campos de comissão ao modelo Pagamento
ALTER TABLE "Pagamento" ADD COLUMN "comissaoAdvogado" DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE "Pagamento" ADD COLUMN "valorComissao" DECIMAL(14,2) DEFAULT 0.00;
ALTER TABLE "Pagamento" ADD COLUMN "pagoParaAdvogado" BOOLEAN DEFAULT false;

-- Adicionar comentários para documentação
COMMENT ON COLUMN "Advogado"."comissaoPadrao" IS 'Percentual padrão de comissão do advogado (0-100)';
COMMENT ON COLUMN "Advogado"."comissaoAcaoGanha" IS 'Percentual de comissão em ações ganhas (0-100)';
COMMENT ON COLUMN "Advogado"."comissaoHonorarios" IS 'Percentual de comissão em honorários contratuais (0-100)';

COMMENT ON COLUMN "Contrato"."comissaoAdvogado" IS 'Percentual de comissão específico para este contrato (0-100)';
COMMENT ON COLUMN "Contrato"."percentualAcaoGanha" IS 'Percentual sobre resultado em ação ganha (0-100)';
COMMENT ON COLUMN "Contrato"."valorAcaoGanha" IS 'Valor base para cálculo de comissão em ação ganha';

COMMENT ON COLUMN "Fatura"."comissaoAdvogado" IS 'Percentual de comissão aplicado nesta fatura (0-100)';
COMMENT ON COLUMN "Fatura"."valorComissao" IS 'Valor calculado da comissão do advogado';
COMMENT ON COLUMN "Fatura"."tipoComissao" IS 'Tipo de comissão: HONORARIOS, ACAO_GANHA, CUSTAS, OUTROS';

COMMENT ON COLUMN "Pagamento"."comissaoAdvogado" IS 'Percentual de comissão aplicado neste pagamento (0-100)';
COMMENT ON COLUMN "Pagamento"."valorComissao" IS 'Valor da comissão paga ao advogado';
COMMENT ON COLUMN "Pagamento"."pagoParaAdvogado" IS 'Indica se a comissão já foi paga ao advogado';
