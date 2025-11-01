"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import { HybridNotificationService } from "@/app/lib/notifications/hybrid-notification-service";
import { NotificationEvent } from "@/app/lib/notifications/types";
import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";

// =============================================
// TIPOS E INTERFACES
// =============================================

export interface CreateNotificacaoInput {
  advogadoId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade?: string;
  acaoUrl?: string;
  acaoTexto?: string;
}

export interface NotificacaoData {
  id: string;
  advogadoId: string;
  advogadoNome: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  prioridade: string;
  dataCriacao: Date;
  dataLeitura: Date | null;
  acaoUrl?: string;
  acaoTexto?: string;
}

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// LEGACY COMPATIBILITY
// =============================================

export async function getEstatisticasNotificacoes(
  advogadoId: string,
): Promise<
  ActionResponse<{
    total: number;
    naoLidas: number;
    porTipo: Record<string, number>;
    porPrioridade: Record<string, number>;
  }>
> {
  const { getEstatisticasNotificacoes: legacyGet } = await import(
    "./advogados-notificacoes-legacy"
  );

  return legacyGet(advogadoId);
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function getSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  return session;
}

// =============================================
// ACTIONS MIGRADAS PARA SISTEMA HÍBRIDO
// =============================================

/**
 * Cria uma nova notificação para um advogado usando sistema híbrido
 */
export async function createNotificacaoAdvogado(
  input: CreateNotificacaoInput,
): Promise<ActionResponse<NotificacaoData>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o advogado existe e pertence ao tenant
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: input.advogadoId,
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Criar notificação usando sistema híbrido
    const notificationEvent: NotificationEvent = {
      type: "advogado.notification",
      tenantId: session.user.tenantId,
      userId: advogado.usuarioId,
      payload: {
        advogadoId: input.advogadoId,
        advogadoNome:
          `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() ||
          advogado.usuario?.email ||
          "Advogado",
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        prioridade: input.prioridade || "MEDIA",
        acaoUrl: input.acaoUrl,
        acaoTexto: input.acaoTexto,
      },
      urgency:
        input.prioridade === "ALTA"
          ? "HIGH"
          : input.prioridade === "CRITICA"
            ? "CRITICAL"
            : "MEDIUM",
      channels: ["REALTIME"],
    };

    await HybridNotificationService.publishNotification(notificationEvent);

    // Criar objeto de resposta para compatibilidade
    const notificacao: NotificacaoData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      advogadoId: input.advogadoId,
      advogadoNome:
        `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() ||
        advogado.usuario?.email ||
        "Advogado",
      tipo: input.tipo,
      titulo: input.titulo,
      mensagem: input.mensagem,
      lida: false,
      prioridade: input.prioridade || "MEDIA",
      dataCriacao: new Date(),
      dataLeitura: null,
      acaoUrl: input.acaoUrl,
      acaoTexto: input.acaoTexto,
    };

    revalidatePath("/advogados");

    return { success: true, data: notificacao };
  } catch (error) {
    console.error("Erro ao criar notificação do advogado:", error);

    return { success: false, error: "Erro ao criar notificação" };
  }
}

/**
 * Busca notificações de um advogado específico usando sistema híbrido
 */
export async function getNotificacoesAdvogado(
  advogadoId: string,
): Promise<ActionResponse<NotificacaoData[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o advogado existe e pertence ao tenant
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Buscar notificações usando sistema de notificações unificado
    // Importar a função de busca de notificações do sistema híbrido
    const { getNotifications } = await import(
      "@/app/actions/notifications-hybrid"
    );

    // Buscar notificações do usuário associado ao advogado (não do usuário logado!)
    const notificationsResponse = await getNotifications({
      limit: 50,
      userId: advogado.usuarioId, // Passar o userId do advogado, não da sessão
    });

    // Converter para o formato esperado pelo módulo de advogados
    const notificacoes: NotificacaoData[] =
      notificationsResponse.notifications.map((notif) => ({
        id: notif.id,
        advogadoId: advogadoId,
        advogadoNome:
          `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() ||
          advogado.usuario?.email ||
          "Advogado",
        tipo: notif.tipo as any,
        titulo: notif.titulo,
        mensagem: notif.mensagem,
        lida: notif.status === "LIDA",
        prioridade: notif.prioridade as any,
        dataCriacao: new Date(notif.createdAt),
        dataLeitura: notif.lidoEm ? new Date(notif.lidoEm) : null,
        acaoUrl: notif.referenciaId
          ? `/processos/${notif.referenciaId}`
          : undefined,
        acaoTexto: notif.referenciaId ? "Ver Detalhes" : undefined,
      }));

    return { success: true, data: notificacoes };
  } catch (error) {
    console.error("Erro ao buscar notificações do advogado:", error);

    return { success: false, error: "Erro ao buscar notificações" };
  }
}

/**
 * Marca uma notificação como lida usando sistema híbrido
 */
export async function marcarNotificacaoComoLida(
  notificacaoId: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Usar sistema híbrido para marcar como lida
    const { markNotificationAsRead } = await import(
      "@/app/actions/notifications-hybrid"
    );

    await markNotificationAsRead(notificacaoId);

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);

    return { success: false, error: "Erro ao marcar notificação como lida" };
  }
}

/**
 * Marca todas as notificações de um advogado como lidas usando sistema híbrido
 */
export async function marcarTodasNotificacoesComoLidas(
  advogadoId: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Buscar o advogado primeiro
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Usar sistema híbrido para marcar todas como lidas
    const { markAllNotificationsAsRead } = await import(
      "@/app/actions/notifications-hybrid"
    );

    await markAllNotificationsAsRead();

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);

    return {
      success: false,
      error: "Erro ao marcar todas as notificações como lidas",
    };
  }
}
