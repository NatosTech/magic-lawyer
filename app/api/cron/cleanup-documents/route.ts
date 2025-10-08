import { NextRequest, NextResponse } from "next/server";
import { cleanupOrphanedDocuments } from "@/app/actions/documentos-procuracao";

/**
 * Cron job para limpeza automática de documentos órfãos
 * Executa diariamente às 2:00 UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 Iniciando cron job de limpeza de documentos...");

    const result = await cleanupOrphanedDocuments();

    if (result.success) {
      console.log("✅ Cron job concluído com sucesso:", result);
      return NextResponse.json({
        success: true,
        message: "Limpeza de documentos concluída",
        data: result,
      });
    } else {
      console.error("❌ Cron job falhou:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Erro no cron job de limpeza:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
