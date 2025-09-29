"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

const DEFAULT_LIMIT = 50;
const ALLOWED_STATUSES = ["NAO_LIDA", "LIDA", "ARQUIVADA"] as const;

type NotificationStatus = (typeof ALLOWED_STATUSES)[number];

type NotificationRecord = {
  id: string;
  status: NotificationStatus;
  canal: string | null;
  entregueEm: Date | null;
  lidoEm: Date | null;
  createdAt: Date;
  notificacaoId: string;
  titulo: string;
  mensagem: string | null;
  tipo: string;
  prioridade: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  dados: unknown;
};

function ensureDelegate() {
  const delegate = prisma.notificacaoUsuario;

  if (!delegate) {
    throw new Error(
      "Modelo de notificações indisponível. Rode `prisma generate` e reinicie o servidor.",
    );
  }

  return delegate;
}

export default async function fetchNotifications(limit = DEFAULT_LIMIT) {
  const session = await getSession();

  if (!session?.user?.id || !session.user.tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const take = Math.min(limit, 100);
  const delegate = ensureDelegate();

  const notifications = await delegate.findMany({
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

  const mapped: NotificationRecord[] = notifications.map((item) => ({
    id: item.id,
    status: item.status as NotificationStatus,
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
  }));

  const unreadCount = mapped.filter(
    (item) => item.status === "NAO_LIDA",
  ).length;

  return { notifications: mapped, unreadCount };
}

export async function changeNotificationStatus(
  notificationId: string,
  status: NotificationStatus,
) {
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("Status inválido para atualização de notificação.");
  }

  const session = await getSession();

  if (!session?.user?.id || !session.user.tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const delegate = ensureDelegate();

  const result = await delegate.updateMany({
    where: {
      id: notificationId,
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
    },
    data: {
      status,
      lidoEm:
        status === "LIDA"
          ? new Date()
          : status === "NAO_LIDA"
            ? null
            : undefined,
      reabertoEm: status === "NAO_LIDA" ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("Notificação não encontrada ou fora do escopo do usuário.");
  }

  return { success: true };
}

export async function clearNotifications() {
  const session = await getSession();

  if (!session?.user?.id || !session.user.tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const delegate = ensureDelegate();

  await delegate.deleteMany({
    where: {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
    },
  });

  return { success: true };
}
