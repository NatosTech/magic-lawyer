import { NextRequest, NextResponse } from "next/server";

import { EventReminderSchedulerService } from "@/app/lib/notifications/services/event-reminder-scheduler";

/**
 * Cron job para verificação e envio de lembretes de eventos
 * Executa a cada 15 minutos
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
      "🕐 [EventReminderScheduler] Iniciando verificação de lembretes de eventos...",
    );

    await EventReminderSchedulerService.checkEventReminders();

    console.log(
      "✅ [EventReminderScheduler] Verificação de lembretes concluída com sucesso",
    );

    return NextResponse.json({
      success: true,
      message: "Verificação de lembretes de eventos concluída",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [EventReminderScheduler] Erro na verificação de lembretes:",
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
