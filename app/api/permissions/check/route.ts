import { NextResponse } from "next/server";

import { verificarPermissao } from "@/app/actions/equipe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modulo, acao, usuarioId } = body;

    if (!modulo || !acao) {
      return NextResponse.json(
        { error: "Módulo e ação são obrigatórios" },
        { status: 400 },
      );
    }

    const hasPermission = await verificarPermissao(modulo, acao, usuarioId);

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao verificar permissão",
      },
      { status: 500 },
    );
  }
}

