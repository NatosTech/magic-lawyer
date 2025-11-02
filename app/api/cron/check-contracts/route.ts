import { NextRequest, NextResponse } from "next/server";

import { ContratoSchedulerService } from "@/app/lib/notifications/services/contrato-scheduler";

/**
 * Cron job para verificação e notificação de contratos expirados ou próximos do vencimento
 * Executa diariamente às 9:00 UTC (6:00 BRT)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 [ContratoScheduler] Iniciando verificação de contratos...");

    await ContratoSchedulerService.checkExpiringContracts();

    console.log(
      "✅ [ContratoScheduler] Verificação de contratos concluída com sucesso",
    );

    return NextResponse.json({
      success: true,
      message: "Verificação de contratos concluída",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [ContratoScheduler] Erro na verificação de contratos:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
