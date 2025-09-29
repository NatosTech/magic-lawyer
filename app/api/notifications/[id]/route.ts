import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/auth";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  if (!["NAO_LIDA", "LIDA", "ARQUIVADA"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const notificacaoDelegate = prisma.notificacaoUsuario;

  if (!notificacaoDelegate) {
    return NextResponse.json(
      {
        error:
          "Modelo de notificações indisponível. Rode `prisma generate` e reinicie o servidor.",
      },
      { status: 500 },
    );
  }

  const updated = await notificacaoDelegate.updateMany({
    where: {
      id: params.id,
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
    },
    data: {
      status: body.status,
      lidoEm:
        body.status === "LIDA"
          ? new Date()
          : body.status === "NAO_LIDA"
            ? null
            : undefined,
      reabertoEm: body.status === "NAO_LIDA" ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
