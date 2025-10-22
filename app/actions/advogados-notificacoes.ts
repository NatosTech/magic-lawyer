"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

// =============================================
// TYPES
// =============================================

export interface NotificacaoData {
  id: string;
  advogadoId: string;
  advogadoNome: string;
  tipo: "PROCESSO_CRIADO" | "PROCESSO_ATUALIZADO" | "PRAZO_VENCENDO" | "COMISSAO_PENDENTE" | "NOVO_CLIENTE" | "SISTEMA";
  titulo: string;
  mensagem: string;
  lida: boolean;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  dataCriacao: Date;
  dataLeitura: Date | null;
  acaoUrl?: string;
  acaoTexto?: string;
}

export interface CreateNotificacaoInput {
  advogadoId: string;
  tipo: "PROCESSO_CRIADO" | "PROCESSO_ATUALIZADO" | "PRAZO_VENCENDO" | "COMISSAO_PENDENTE" | "NOVO_CLIENTE" | "SISTEMA";
  titulo: string;
  mensagem: string;
  prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  acaoUrl?: string;
  acaoTexto?: string;
}

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// ACTIONS
// =============================================

/**
 * Cria uma nova notificação para um advogado
 */
export async function createNotificacaoAdvogado(input: CreateNotificacaoInput): Promise<ActionResponse<NotificacaoData>> {
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

    // Criar notificação (simulada - em um sistema real, isso seria uma tabela no banco)
    const notificacao: NotificacaoData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      advogadoId: input.advogadoId,
      advogadoNome: `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() || advogado.usuario?.email || "Advogado",
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

    // Em um sistema real, salvaria no banco de dados
    // await prisma.notificacao.create({ data: notificacao });

    revalidatePath("/advogados");

    return { success: true, data: notificacao };
  } catch (error) {
    console.error("Erro ao criar notificação do advogado:", error);
    return { success: false, error: "Erro ao criar notificação" };
  }
}

/**
 * Busca notificações de um advogado específico
 */
export async function getNotificacoesAdvogado(advogadoId: string): Promise<ActionResponse<NotificacaoData[]>> {
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

    // Buscar notificações reais do banco de dados
    const notificacoesDb = await prisma.notificacao.findMany({
      where: {
        tenantId: session.user.tenantId,
        destinos: {
          some: {
            usuarioId: advogado.usuarioId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        destinos: {
          where: {
            usuarioId: advogado.usuarioId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter para o formato esperado
    const notificacoes: NotificacaoData[] = notificacoesDb.map((notif) => {
      const destino = notif.destinos[0]; // Primeiro destino (deveria ter apenas um)
      return {
        id: notif.id,
        advogadoId: advogadoId,
        advogadoNome: `${advogado.usuario?.firstName || ""} ${advogado.usuario?.lastName || ""}`.trim() || advogado.usuario?.email || "Advogado",
        tipo: notif.tipo as any,
        titulo: notif.titulo,
        mensagem: notif.mensagem,
        lida: destino?.status === "LIDA",
        prioridade: notif.prioridade as any,
        dataCriacao: notif.createdAt,
        dataLeitura: destino?.status === "LIDA" ? notif.createdAt : null,
        acaoUrl: notif.referenciaId ? `/processos/${notif.referenciaId}` : undefined,
        acaoTexto: notif.referenciaId ? "Ver Detalhes" : undefined,
      };
    });

    return { success: true, data: notificacoes };
  } catch (error) {
    console.error("Erro ao buscar notificações do advogado:", error);
    return { success: false, error: "Erro ao buscar notificações" };
  }
}

/**
 * Marca uma notificação como lida
 */
export async function marcarNotificacaoComoLida(notificacaoId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Atualizar no banco de dados
    await prisma.notificacaoUsuario.updateMany({
      where: {
        notificacaoId: notificacaoId,
        notificacao: {
          tenantId: session.user.tenantId,
        },
      },
      data: { status: "LIDA" },
    });

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return { success: false, error: "Erro ao marcar notificação como lida" };
  }
}

/**
 * Marca todas as notificações de um advogado como lidas
 */
export async function marcarTodasNotificacoesComoLidas(advogadoId: string): Promise<ActionResponse> {
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

    // Atualizar no banco de dados
    await prisma.notificacaoUsuario.updateMany({
      where: {
        usuarioId: advogado.usuarioId,
        status: "NAO_LIDA",
        notificacao: {
          tenantId: session.user.tenantId,
        },
      },
      data: { status: "LIDA" },
    });

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    return { success: false, error: "Erro ao marcar todas as notificações como lidas" };
  }
}

/**
 * Busca estatísticas de notificações de um advogado
 */
export async function getEstatisticasNotificacoes(advogadoId: string): Promise<
  ActionResponse<{
    total: number;
    naoLidas: number;
    porTipo: Record<string, number>;
    porPrioridade: Record<string, number>;
  }>
> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const result = await getNotificacoesAdvogado(advogadoId);

    if (!result.success || !result.data) {
      return { success: false, error: "Erro ao buscar notificações" };
    }

    const notificacoes = result.data;
    const total = notificacoes.length;
    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    const porTipo = notificacoes.reduce(
      (acc, notif) => {
        acc[notif.tipo] = (acc[notif.tipo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const porPrioridade = notificacoes.reduce(
      (acc, notif) => {
        acc[notif.prioridade] = (acc[notif.prioridade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        total,
        naoLidas,
        porTipo,
        porPrioridade,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de notificações:", error);
    return { success: false, error: "Erro ao buscar estatísticas de notificações" };
  }
}
