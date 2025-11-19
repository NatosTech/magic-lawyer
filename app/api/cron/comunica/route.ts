import { NextResponse } from "next/server";
import { fetchComunica } from "@/lib/api/juridical/pje/comunica";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  // Seleciona o primeiro tenant com certificado ativo PJE
  const certificate = await prisma.digitalCertificate.findFirst({
    where: { isActive: true, tipo: "PJE" },
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
