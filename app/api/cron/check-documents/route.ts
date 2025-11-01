import { NextRequest, NextResponse } from "next/server";

import { DocumentSchedulerService } from "@/app/lib/notifications/services/document-scheduler";

/**
 * Cron job para verificação e notificação de documentos expirados
 * Executa diariamente às 10:00 UTC (7:00 BRT)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🕐 [DocumentScheduler] Iniciando verificação de documentos expirados...",
    );

    await DocumentSchedulerService.checkExpiredDocuments();

    console.log(
      "✅ [DocumentScheduler] Verificação de documentos concluída com sucesso",
    );

    return NextResponse.json({
      success: true,
      message: "Verificação de documentos concluída",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [DocumentScheduler] Erro na verificação de documentos:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}

