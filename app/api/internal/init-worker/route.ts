/**
 * Endpoint interno para garantir inicialização dos workers
 * Pode ser chamado no startup da aplicação ou via health check
 */

import { NextResponse } from "next/server";

import { initNotificationWorker } from "@/app/lib/notifications/init-worker";

/**
 * GET /api/internal/init-worker
 * Inicializa workers assíncronos se ainda não estiverem rodando
 */
export async function GET() {
  try {
    await initNotificationWorker();

    return NextResponse.json({
      success: true,
      message: "Workers assíncronos inicializados",
    });
  } catch (error) {
    console.error("[InitWorker] Erro:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}









