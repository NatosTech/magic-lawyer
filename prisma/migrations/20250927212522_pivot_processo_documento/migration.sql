-- CreateTable
CREATE TABLE "public"."ProcessoDocumento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "tag" TEXT,
    "nota" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessoDocumento_tenantId_processoId_idx" ON "public"."ProcessoDocumento"("tenantId", "processoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoDocumento_processoId_documentoId_key" ON "public"."ProcessoDocumento"("processoId", "documentoId");

-- CreateIndex
CREATE INDEX "Documento_tenantId_createdAt_idx" ON "public"."Documento"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
