/*
  Warnings:

  - You are about to drop the column `endereco` on the `Tenant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TipoEndereco" AS ENUM ('MATRIZ', 'FILIAL', 'ESCRITORIO');

-- AlterTable
ALTER TABLE "public"."Tenant" DROP COLUMN "endereco";

-- CreateTable
CREATE TABLE "public"."TenantEndereco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "tipo" "public"."TipoEndereco" NOT NULL DEFAULT 'ESCRITORIO',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Brasil',
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantEndereco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantEndereco_tenantId_principal_idx" ON "public"."TenantEndereco"("tenantId", "principal");

-- CreateIndex
CREATE UNIQUE INDEX "TenantEndereco_tenantId_apelido_key" ON "public"."TenantEndereco"("tenantId", "apelido");

-- AddForeignKey
ALTER TABLE "public"."TenantEndereco" ADD CONSTRAINT "TenantEndereco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
