import { NextRequest, NextResponse } from "next/server";

import {
  startNotificationWorker,
  stopNotificationWorker,
  getNotificationWorker,
} from "@/app/lib/notifications/notification-worker";
import { getNotificationQueue } from "@/app/lib/notifications/notification-queue";

/**
 * Inicia o worker de notificações
 */
export async function POST(request: NextRequest) {
  try {
    await startNotificationWorker();

    return NextResponse.json({
      success: true,
      message: "Worker de notificações iniciado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao iniciar worker:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao iniciar worker" },
      { status: 500 },
    );
  }
}

/**
 * Para o worker de notificações
 */
export async function DELETE(request: NextRequest) {
  try {
    await stopNotificationWorker();

    return NextResponse.json({
      success: true,
      message: "Worker de notificações parado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao parar worker:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao parar worker" },
      { status: 500 },
    );
  }
}

/**
 * Obtém status do worker e estatísticas da fila
 */
export async function GET(request: NextRequest) {
  try {
    const worker = getNotificationWorker();
    const queue = getNotificationQueue();

    const [workerStats, queueStats] = await Promise.all([
      worker.getStats(),
      queue.getQueueStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        worker: workerStats,
        queue: queueStats,
        status: "running",
      },
    });
  } catch (error) {
    console.error("Erro ao obter status:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao obter status" },
      { status: 500 },
    );
  }
}
