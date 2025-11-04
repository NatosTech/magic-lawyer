import { NextResponse } from "next/server";

import { checkPermission, checkPermissions } from "@/app/actions/equipe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modulo, acao, usuarioId, requests } = body;

    // Verificar múltiplas permissões de uma vez
    if (requests && Array.isArray(requests)) {
      if (!requests.every((r: any) => r.modulo && r.acao)) {
        return NextResponse.json(
          { error: "Todos os requests devem ter módulo e ação" },
          { status: 400 },
        );
      }

      const permissions = await checkPermissions(requests, usuarioId);

      return NextResponse.json({ permissions });
    }

    // Verificar uma permissão específica
    if (!modulo || !acao) {
      return NextResponse.json(
        { error: "Módulo e ação são obrigatórios" },
        { status: 400 },
      );
    }

    const hasPermission = await checkPermission(modulo, acao, usuarioId);

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao verificar permissão",
      },
      { status: 500 },
    );
  }
}
