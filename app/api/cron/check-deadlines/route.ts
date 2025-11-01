import { NextRequest, NextResponse } from "next/server";

import { DeadlineSchedulerService } from "@/app/lib/notifications/services/deadline-scheduler";

/**
 * Cron job para verificação e notificação de prazos próximos do vencimento
 * Executa diariamente às 8:00 UTC (5:00 BRT)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 [DeadlineScheduler] Iniciando verificação de prazos...");

    await DeadlineSchedulerService.checkExpiringDeadlines();

    console.log("✅ [DeadlineScheduler] Verificação de prazos concluída com sucesso");

    return NextResponse.json({
      success: true,
      message: "Verificação de prazos concluída",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [DeadlineScheduler] Erro na verificação de prazos:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}

