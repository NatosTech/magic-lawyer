"use server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";

export type NotificationStatus = "NAO_LIDA" | "LIDA" | "ARQUIVADA";

type GetOptions = { limit?: number };

export type NotificationsResponse = {
  notifications: Array<{
    id: string;
    notificacaoId: string; // compat
    titulo: string;
    mensagem: string;
    tipo: string;
    prioridade: string;
    status: NotificationStatus;
    canal: string;
    createdAt: string;
    entregueEm?: string | null;
    lidoEm?: string | null;
    referenciaTipo?: string | null;
    referenciaId?: string | null;
    dados?: unknown;
  }>;
  unreadCount: number;
};

async function ensureSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Não autenticado");
  }

  return {
    userId: (session.user as any).id as string,
    tenantId: (session.user as any).tenantId as string,
  };
}

export async function getNotifications(
  options: GetOptions = {},
): Promise<NotificationsResponse> {
  const { userId, tenantId } = await ensureSession();
  const take = Math.min(options.limit ?? 50, 100);

  const notifications = await prisma.notification.findMany({
    where: { tenantId, userId },
    orderBy: { createdAt: "desc" },
    take,
  });

  const unreadCount = await prisma.notification.count({
    where: { tenantId, userId, readAt: null },
  });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      notificacaoId: n.id,
      titulo: n.title,
      mensagem: n.message,
      tipo: n.type,
      prioridade: (n.urgency as string) ?? "MEDIUM",
      status: (n.readAt ? "LIDA" : "NAO_LIDA") as NotificationStatus,
      canal: (n.channels?.[0] as string) ?? "IN_APP",
      createdAt: n.createdAt.toISOString(),
      entregueEm: null,
      lidoEm: n.readAt ? n.readAt.toISOString() : null,
      referenciaTipo: n.payload && (n.payload as any).referenciaTipo,
      referenciaId: n.payload && (n.payload as any).referenciaId,
      dados: n.payload,
    })),
    unreadCount,
  };
}

export async function setNotificationStatus(
  id: string,
  status: NotificationStatus,
): Promise<void> {
  const { userId, tenantId } = await ensureSession();

  await prisma.notification.updateMany({
    where: { id, tenantId, userId },
    data: {
      readAt:
        status === "LIDA"
          ? new Date()
          : status === "NAO_LIDA"
            ? null
            : new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { userId, tenantId } = await ensureSession();

  await prisma.notification.updateMany({
    where: { tenantId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function clearAllNotifications(): Promise<void> {
  const { userId, tenantId } = await ensureSession();

  await prisma.notification.deleteMany({ where: { tenantId, userId } });
}
