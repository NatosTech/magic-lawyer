"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";

export type NotificationStatus = "NAO_LIDA" | "LIDA" | "ARQUIVADA";

type GetNotificationsOptions = {
  limit?: number;
};

export type NotificationsResponse = {
  notifications: Array<{
    id: string;
    notificacaoId: string;
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

  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  const userId = (session.user as any)?.id;

  if (!userId) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return {
    userId,
    tenantId: (session.user as any)?.tenantId, // null para SuperAdmin
    isSuperAdmin,
    userRole,
  };
}

export async function getNotifications(
  options: GetNotificationsOptions = {},
): Promise<NotificationsResponse> {
  const { tenantId, userId, isSuperAdmin } = await ensureSession();

  const take = Math.min(options.limit ?? 50, 100);

  // SuperAdmin não tem notificações específicas por enquanto
  // Retorna array vazio para evitar erros
  if (isSuperAdmin) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  const notifications = await prisma.notificacaoUsuario.findMany({
    where: {
      tenantId,
      usuarioId: userId,
    },
    orderBy: [{ createdAt: "desc" }],
    take,
    include: {
      notificacao: true,
    },
  });

  const unreadCount = notifications.reduce((count, item) => {
    return item.status === "NAO_LIDA" ? count + 1 : count;
  }, 0);

  return {
    notifications: notifications.map((item) => ({
      id: item.id,
      notificacaoId: item.notificacaoId,
      titulo: item.notificacao.titulo,
      mensagem: item.notificacao.mensagem,
      tipo: item.notificacao.tipo,
      prioridade: item.notificacao.prioridade,
      status: item.status as NotificationStatus,
      canal: item.canal,
      createdAt: item.createdAt.toISOString(),
      entregueEm: item.entregueEm?.toISOString() ?? null,
      lidoEm: item.lidoEm?.toISOString() ?? null,
      referenciaTipo: item.notificacao.referenciaTipo,
      referenciaId: item.notificacao.referenciaId,
      dados: item.notificacao.dados,
    })),
    unreadCount,
  };
}

export async function setNotificationStatus(
  id: string,
  status: NotificationStatus,
): Promise<void> {
  const { tenantId, userId, isSuperAdmin } = await ensureSession();

  // SuperAdmin não tem notificações por enquanto
  if (isSuperAdmin) {
    return;
  }

  if (!id) {
    throw new Error("Notificação inválida");
  }

  if (!["NAO_LIDA", "LIDA", "ARQUIVADA"].includes(status)) {
    throw new Error("Status inválido");
  }

  const result = await prisma.notificacaoUsuario.updateMany({
    where: {
      id,
      tenantId,
      usuarioId: userId,
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
    throw new Error("Notificação não encontrada");
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await setNotificationStatus(id, "LIDA");
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { tenantId, userId, isSuperAdmin } = await ensureSession();

  // SuperAdmin não tem notificações por enquanto
  if (isSuperAdmin) {
    return;
  }

  await prisma.notificacaoUsuario.updateMany({
    where: {
      tenantId,
      usuarioId: userId,
      status: {
        in: ["NAO_LIDA", "ARQUIVADA"],
      },
    },
    data: {
      status: "LIDA",
      lidoEm: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function clearAllNotifications(): Promise<void> {
  const { tenantId, userId, isSuperAdmin } = await ensureSession();

  // SuperAdmin não tem notificações por enquanto
  if (isSuperAdmin) {
    return;
  }

  await prisma.notificacaoUsuario.deleteMany({
    where: {
      tenantId,
      usuarioId: userId,
    },
  });
}
