/*
  Warnings:

  - You are about to drop the `AssinaturasPacote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pacotes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrecosJuiz` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."StatusPacoteJuiz" AS ENUM ('ATIVO', 'INATIVO', 'PROMOCIONAL');

-- DropForeignKey
ALTER TABLE "public"."AssinaturasPacote" DROP CONSTRAINT "AssinaturasPacote_pacoteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssinaturasPacote" DROP CONSTRAINT "AssinaturasPacote_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Pacotes" DROP CONSTRAINT "Pacotes_superAdminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrecosJuiz" DROP CONSTRAINT "PrecosJuiz_juizId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrecosJuiz" DROP CONSTRAINT "PrecosJuiz_pacoteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrecosJuiz" DROP CONSTRAINT "PrecosJuiz_superAdminId_fkey";

-- DropTable
DROP TABLE "public"."AssinaturasPacote";

-- DropTable
DROP TABLE "public"."Pacotes";

-- DropTable
DROP TABLE "public"."PrecosJuiz";

-- DropEnum
DROP TYPE "public"."StatusPacote";

-- DropEnum
DROP TYPE "public"."TipoPacote";

-- CreateTable
CREATE TABLE "public"."PacotesJuiz" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "duracaoDias" INTEGER,
    "limiteUsuarios" INTEGER,
    "limiteConsultas" INTEGER,
    "isPublico" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."StatusPacoteJuiz" NOT NULL DEFAULT 'ATIVO',
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT NOT NULL DEFAULT 'primary',
    "icone" TEXT,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PacotesJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PacoteJuizItems" (
    "id" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacoteJuizItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssinaturasPacoteJuiz" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "precoPago" DECIMAL(10,2) NOT NULL,
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturasPacoteJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PacotesJuiz_status_idx" ON "public"."PacotesJuiz"("status");

-- CreateIndex
CREATE INDEX "PacotesJuiz_superAdminId_idx" ON "public"."PacotesJuiz"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "PacotesJuiz_nome_key" ON "public"."PacotesJuiz"("nome");

-- CreateIndex
CREATE INDEX "PacoteJuizItems_pacoteId_idx" ON "public"."PacoteJuizItems"("pacoteId");

-- CreateIndex
CREATE INDEX "PacoteJuizItems_juizId_idx" ON "public"."PacoteJuizItems"("juizId");

-- CreateIndex
CREATE UNIQUE INDEX "PacoteJuizItems_pacoteId_juizId_key" ON "public"."PacoteJuizItems"("pacoteId", "juizId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_tenantId_idx" ON "public"."AssinaturasPacoteJuiz"("tenantId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_pacoteId_idx" ON "public"."AssinaturasPacoteJuiz"("pacoteId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_status_idx" ON "public"."AssinaturasPacoteJuiz"("status");

-- AddForeignKey
ALTER TABLE "public"."PacotesJuiz" ADD CONSTRAINT "PacotesJuiz_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PacoteJuizItems" ADD CONSTRAINT "PacoteJuizItems_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "public"."PacotesJuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PacoteJuizItems" ADD CONSTRAINT "PacoteJuizItems_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssinaturasPacoteJuiz" ADD CONSTRAINT "AssinaturasPacoteJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssinaturasPacoteJuiz" ADD CONSTRAINT "AssinaturasPacoteJuiz_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "public"."PacotesJuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
