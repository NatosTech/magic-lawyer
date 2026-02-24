import { NextRequest, NextResponse } from "next/server";
import { fetchComunica } from "@/lib/api/juridical/pje/comunica";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { DigitalCertificateScope } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("[Cron Comunica] CRON_SECRET nao configurado.");
    return NextResponse.json(
      { success: false, error: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  // Seleciona o primeiro tenant com certificado ativo PJE
  const certificate = await prisma.digitalCertificate.findFirst({
    where: { isActive: true, tipo: "PJE", scope: DigitalCertificateScope.OFFICE },
    select: {
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json(
      { success: false, error: "Nenhum certificado PJE ativo encontrado." },
      { status: 400 },
    );
  }

  try {
    const result = await fetchComunica({ tenantId: certificate.tenantId });

    // Staging simples: registrar blobs em tabela de logs do sistema
    await prisma.auditLog.create({
      data: {
        tenantId: certificate.tenantId,
        usuarioId: null,
        acao: "COMUNICA_FETCH",
        entidade: "comunica",
        entidadeId: "comunica-api",
        dados: result.raw as object,
        previousValues: {},
        changedFields: [],
      },
    });

    return NextResponse.json(
      { success: true, count: result.items.length },
      { status: 200 },
    );
  } catch (error) {
    logger.error({ error }, "Falha ao coletar Comunica PJe");

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao coletar Comunica",
      },
      { status: 500 },
    );
  }
}
