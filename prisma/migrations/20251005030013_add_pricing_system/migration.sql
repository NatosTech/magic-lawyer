-- CreateEnum
CREATE TYPE "public"."TipoPacote" AS ENUM ('GRATUITO', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."StatusPacote" AS ENUM ('ATIVO', 'INATIVO', 'PROMOCIONAL');

-- CreateTable
CREATE TABLE "public"."Pacotes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "public"."TipoPacote" NOT NULL,
    "precoMensal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "precoAnual" DECIMAL(10,2),
    "limiteUsuarios" INTEGER,
    "limiteProcessos" INTEGER,
    "limiteDocumentos" INTEGER,
    "limiteArmazenamento" INTEGER,
    "recursos" TEXT[],
    "isPublico" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."StatusPacote" NOT NULL DEFAULT 'ATIVO',
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT NOT NULL DEFAULT 'primary',
    "icone" TEXT,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pacotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssinaturasPacote" (
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

    CONSTRAINT "AssinaturasPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrecosJuiz" (
    "id" TEXT NOT NULL,
    "pacoteId" TEXT,
    "juizId" TEXT NOT NULL,
    "precoConsulta" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "precoDownload" DECIMAL(10,2),
    "precoAnalise" DECIMAL(10,2),
    "isIncluso" BOOLEAN NOT NULL DEFAULT false,
    "limiteConsultas" INTEGER,
    "limiteDownloads" INTEGER,
    "limiteAnalises" INTEGER,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecosJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConfiguracoesPreco" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracoesPreco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pacotes_tipo_idx" ON "public"."Pacotes"("tipo");

-- CreateIndex
CREATE INDEX "Pacotes_status_idx" ON "public"."Pacotes"("status");

-- CreateIndex
CREATE INDEX "Pacotes_superAdminId_idx" ON "public"."Pacotes"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "Pacotes_nome_key" ON "public"."Pacotes"("nome");

-- CreateIndex
CREATE INDEX "AssinaturasPacote_tenantId_idx" ON "public"."AssinaturasPacote"("tenantId");

-- CreateIndex
CREATE INDEX "AssinaturasPacote_pacoteId_idx" ON "public"."AssinaturasPacote"("pacoteId");

-- CreateIndex
CREATE INDEX "AssinaturasPacote_status_idx" ON "public"."AssinaturasPacote"("status");

-- CreateIndex
CREATE INDEX "PrecosJuiz_juizId_idx" ON "public"."PrecosJuiz"("juizId");

-- CreateIndex
CREATE INDEX "PrecosJuiz_superAdminId_idx" ON "public"."PrecosJuiz"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "PrecosJuiz_pacoteId_juizId_key" ON "public"."PrecosJuiz"("pacoteId", "juizId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracoesPreco_chave_key" ON "public"."ConfiguracoesPreco"("chave");

-- CreateIndex
CREATE INDEX "ConfiguracoesPreco_chave_idx" ON "public"."ConfiguracoesPreco"("chave");

-- CreateIndex
CREATE INDEX "ConfiguracoesPreco_categoria_idx" ON "public"."ConfiguracoesPreco"("categoria");

-- AddForeignKey
ALTER TABLE "public"."Pacotes" ADD CONSTRAINT "Pacotes_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssinaturasPacote" ADD CONSTRAINT "AssinaturasPacote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssinaturasPacote" ADD CONSTRAINT "AssinaturasPacote_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "public"."Pacotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrecosJuiz" ADD CONSTRAINT "PrecosJuiz_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "public"."Pacotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrecosJuiz" ADD CONSTRAINT "PrecosJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrecosJuiz" ADD CONSTRAINT "PrecosJuiz_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConfiguracoesPreco" ADD CONSTRAINT "ConfiguracoesPreco_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
