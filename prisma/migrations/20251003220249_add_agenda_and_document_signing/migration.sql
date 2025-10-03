-- CreateEnum
CREATE TYPE "public"."EventoTipo" AS ENUM ('AUDIENCIA', 'REUNIAO', 'CONSULTA', 'PRAZO', 'LEMBRETE', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."EventoStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'ADIADO');

-- CreateEnum
CREATE TYPE "public"."EventoRecorrencia" AS ENUM ('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."DocumentoAssinaturaStatus" AS ENUM ('PENDENTE', 'ASSINADO', 'REJEITADO', 'EXPIRADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "public"."Evento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "public"."EventoTipo" NOT NULL DEFAULT 'REUNIAO',
    "status" "public"."EventoStatus" NOT NULL DEFAULT 'AGENDADO',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "participantes" TEXT[],
    "processoId" TEXT,
    "clienteId" TEXT,
    "advogadoResponsavelId" TEXT,
    "criadoPorId" TEXT,
    "recorrencia" "public"."EventoRecorrencia" NOT NULL DEFAULT 'NENHUMA',
    "recorrenciaFim" TIMESTAMP(3),
    "googleEventId" TEXT,
    "googleCalendarId" TEXT,
    "lembreteMinutos" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentoAssinatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "processoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "advogadoResponsavelId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "public"."DocumentoAssinaturaStatus" NOT NULL DEFAULT 'PENDENTE',
    "urlDocumento" TEXT NOT NULL,
    "urlAssinado" TEXT,
    "clicksignDocumentId" TEXT,
    "clicksignSignerId" TEXT,
    "dataEnvio" TIMESTAMP(3),
    "dataAssinatura" TIMESTAMP(3),
    "dataExpiracao" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoAssinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataInicio_idx" ON "public"."Evento"("tenantId", "dataInicio");

-- CreateIndex
CREATE INDEX "Evento_tenantId_status_idx" ON "public"."Evento"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Evento_processoId_idx" ON "public"."Evento"("processoId");

-- CreateIndex
CREATE INDEX "Evento_clienteId_idx" ON "public"."Evento"("clienteId");

-- CreateIndex
CREATE INDEX "Evento_advogadoResponsavelId_idx" ON "public"."Evento"("advogadoResponsavelId");

-- CreateIndex
CREATE INDEX "Evento_googleEventId_idx" ON "public"."Evento"("googleEventId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_status_idx" ON "public"."DocumentoAssinatura"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_clienteId_idx" ON "public"."DocumentoAssinatura"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_processoId_idx" ON "public"."DocumentoAssinatura"("processoId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_clicksignDocumentId_idx" ON "public"."DocumentoAssinatura"("clicksignDocumentId");

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
