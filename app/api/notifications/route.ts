import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/auth";

const DEFAULT_LIMIT = 50;

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { searchParams } = new URL(request.url);
  const take = Math.min(
    Number(searchParams.get("limit") ?? DEFAULT_LIMIT),
    100,
  );

  const notifications = await notificacaoDelegate.findMany({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
    },
    orderBy: [{ createdAt: "desc" }],
    take,
    include: {
      notificacao: true,
    },
  });

  const unreadCount = notifications.filter(
    (item) => item.status === "NAO_LIDA",
  ).length;

  return NextResponse.json({
    notifications: notifications.map((item) => ({
      id: item.id,
      status: item.status,
      canal: item.canal,
      entregueEm: item.entregueEm,
      lidoEm: item.lidoEm,
      createdAt: item.createdAt,
      notificacaoId: item.notificacaoId,
      titulo: item.notificacao.titulo,
      mensagem: item.notificacao.mensagem,
      tipo: item.notificacao.tipo,
      prioridade: item.notificacao.prioridade,
      referenciaTipo: item.notificacao.referenciaTipo,
      referenciaId: item.notificacao.referenciaId,
      dados: item.notificacao.dados,
    })),
    unreadCount,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  await notificacaoDelegate.deleteMany({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
