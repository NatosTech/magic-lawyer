/*
  Warnings:

  - A unique constraint covering the columns `[documento]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "documento" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "endereco" JSONB,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "nomeFantasia" TEXT,
ADD COLUMN     "razaoSocial" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "tipoPessoa" "public"."TipoPessoa" NOT NULL DEFAULT 'JURIDICA';

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_documento_key" ON "public"."Tenant"("documento");
