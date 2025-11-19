import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { capturarProcesso } from "@/app/lib/juridical/capture-service";
import logger from "@/lib/logger";

/**
 * Endpoint para captura automática de processos
 * 
 * Deve ser chamado por cron job (Vercel Cron, GitHub Actions, etc.)
 * Protegido por token interno
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticação
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.INTERNAL_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 },
      );
    }

    // Buscar processos que precisam ser atualizados
    // Por enquanto, busca processos com data de última atualização antiga
    const processos = await prisma.processo.findMany({
      where: {
        deletedAt: null,
        // Buscar processos que não foram atualizados nos últimos 7 dias
        updatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 10, // Limitar a 10 por execução
      include: {
        tribunal: {
          select: {
            esfera: true,
          },
        },
      },
    });

    logger.info(`[Cron Capture] Processando ${processos.length} processos`);

    const resultados = [];

    for (const processo of processos) {
      try {
        // Buscar certificado ativo do tenant (se necessário)
        let certificadoId: string | undefined;
        if (processo.tribunal?.esfera === "FEDERAL" || processo.tribunal?.esfera === "TRABALHISTA") {
          // Tribunais federais/trabalhistas geralmente usam PJe
          const certificado = await prisma.digitalCertificate.findFirst({
            where: {
              tenantId: processo.tenantId,
              tipo: "PJE",
              isActive: true,
            },
            orderBy: { createdAt: "desc" },
          });
          certificadoId = certificado?.id;
        }

        const resultado = await capturarProcesso({
          numeroProcesso: processo.numeroCnj || processo.numero,
          tenantId: processo.tenantId,
          tribunalId: processo.tribunalId || undefined,
          certificadoId,
          processoId: processo.id,
        });

        if (resultado.success) {
          // Atualizar processo com dados capturados
          // O campo updatedAt é atualizado automaticamente pelo Prisma
          // TODO: Atualizar outros campos conforme dados capturados
          // await prisma.processo.update({
          //   where: { id: processo.id },
          //   data: { ...dadosCapturados },
          // });

          resultados.push({
            processoId: processo.id,
            numeroProcesso: processo.numeroCnj || processo.numero,
            success: true,
          });
        } else {
          resultados.push({
            processoId: processo.id,
            numeroProcesso: processo.numeroCnj || processo.numero,
            success: false,
            error: resultado.error,
          });
        }
      } catch (error) {
        logger.error(
          `[Cron Capture] Erro ao processar processo ${processo.id}:`,
          error,
        );

        resultados.push({
          processoId: processo.id,
          numeroProcesso: processo.numeroCnj || processo.numero,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    const sucessos = resultados.filter((r) => r.success).length;
    const falhas = resultados.filter((r) => !r.success).length;

    logger.info(
      `[Cron Capture] Concluído: ${sucessos} sucessos, ${falhas} falhas`,
    );

    return NextResponse.json({
      success: true,
      processados: resultados.length,
      sucessos,
      falhas,
      resultados,
    });
  } catch (error) {
    logger.error("[Cron Capture] Erro geral:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
