"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import { NotificationPolicy } from "@/app/lib/notifications/domain/notification-policy";
import type {
  NotificationChannel,
  NotificationUrgency,
} from "@/app/lib/notifications/notification-service";

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

// ============================================
// SERVER ACTIONS - NOVO SISTEMA DE NOTIFICAÇÕES
// ============================================

/**
 * Marca notificação do novo sistema como lida
 */
export async function markNewNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se notificação existe e pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        tenantId,
        userId,
      },
    });

    if (!notification) {
      return { success: false, error: "Notificação não encontrada" };
    }

    // Marcar como lida
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
      },
    });

    // Atualizar status de entrega para READ se houver entrega REALTIME
    await prisma.notificationDelivery.updateMany({
      where: {
        notificationId,
        channel: "REALTIME",
        status: { in: ["PENDING", "SENT", "DELIVERED"] },
      },
      data: {
        status: "READ",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[markNewNotificationAsRead] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

/**
 * Marca notificação do novo sistema como não lida
 */
export async function markNewNotificationAsUnread(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se notificação existe e pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        tenantId,
        userId,
      },
    });

    if (!notification) {
      return { success: false, error: "Notificação não encontrada" };
    }

    // Marcar como não lida (remover readAt)
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[markNewNotificationAsUnread] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

/**
 * Busca preferências de notificações do usuário
 */
export async function getNotificationPreferences(): Promise<{
  success: boolean;
  preferences?: Array<{
    eventType: string;
    enabled: boolean;
    channels: string[];
    urgency: string;
  }>;
  defaultEventTypes?: string[];
  error?: string;
}> {
  try {
    const { tenantId, userId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Buscar todas as preferências do usuário
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: {
        eventType: "asc",
      },
    });

    // Buscar preferências padrão (globais) para eventos sem preferência específica
    const defaultPreferences = await prisma.notificationTemplate.findMany({
      where: {
        tenantId,
        isDefault: true,
      },
      select: {
        eventType: true,
      },
    });

    return {
      success: true,
      preferences: preferences.map((p) => ({
        eventType: p.eventType,
        enabled: p.enabled,
        channels: p.channels,
        urgency: p.urgency,
      })),
      defaultEventTypes: defaultPreferences.map((t) => t.eventType),
    };
  } catch (error) {
    console.error("[getNotificationPreferences] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

/**
 * Atualiza preferência de notificação do usuário
 */
export async function updateNotificationPreference(data: {
  eventType: string;
  enabled?: boolean;
  channels?: string[];
  urgency?: string;
}): Promise<{
  success: boolean;
  preference?: {
    eventType: string;
    enabled: boolean;
    channels: string[];
    urgency: string;
  };
  error?: string;
}> {
  try {
    const { tenantId, userId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    if (!data.eventType) {
      return { success: false, error: "eventType é obrigatório" };
    }

    // Validar que o evento pode ser desabilitado (eventos críticos não podem)
    if (!data.enabled && !NotificationPolicy.canDisableEvent(data.eventType)) {
      return {
        success: false,
        error: `Evento "${data.eventType}" é crítico e não pode ser desabilitado`,
      };
    }

    // Validar canais
    const validChannels: NotificationChannel[] = ["REALTIME", "EMAIL", "PUSH"];
    const validChannelsProvided = Array.isArray(data.channels)
      ? data.channels.filter((c) => validChannels.includes(c as NotificationChannel))
      : ["REALTIME"];

    if (validChannelsProvided.length === 0) {
      return {
        success: false,
        error: "Pelo menos um canal válido deve ser informado",
      };
    }

    // Validar urgência
    const validUrgencies: NotificationUrgency[] = [
      "CRITICAL",
      "HIGH",
      "MEDIUM",
      "INFO",
    ];
    const validUrgency =
      data.urgency && validUrgencies.includes(data.urgency as NotificationUrgency)
        ? (data.urgency as NotificationUrgency)
        : "MEDIUM";

    // Criar ou atualizar preferência
    const preference = await prisma.notificationPreference.upsert({
      where: {
        tenantId_userId_eventType: {
          tenantId,
          userId,
          eventType: data.eventType,
        },
      },
      create: {
        tenantId,
        userId,
        eventType: data.eventType,
        enabled: data.enabled ?? true,
        channels: validChannelsProvided,
        urgency: validUrgency,
      },
      update: {
        enabled: data.enabled ?? true,
        channels: validChannelsProvided,
        urgency: validUrgency,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      preference: {
        eventType: preference.eventType,
        enabled: preference.enabled,
        channels: preference.channels,
        urgency: preference.urgency,
      },
    };
  } catch (error) {
    console.error("[updateNotificationPreference] Erro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}
