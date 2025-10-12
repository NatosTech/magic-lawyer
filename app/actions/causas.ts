"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface CausaPayload {
  nome: string;
  codigoCnj?: string | null;
  descricao?: string | null;
}

export async function listCausas() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const causas = await prisma.causa.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });

    return {
      success: true,
      causas,
    };
  } catch (error) {
    logger.error("Erro ao listar causas:", error);

    return {
      success: false,
      error: "Erro ao carregar causas",
    };
  }
}

export async function createCausa(payload: CausaPayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    if (!payload.nome?.trim()) {
      return { success: false, error: "Nome da causa é obrigatório" };
    }

    const causa = await prisma.causa.create({
      data: {
        tenantId: user.tenantId,
        nome: payload.nome.trim(),
        codigoCnj: payload.codigoCnj?.trim() || null,
        descricao: payload.descricao?.trim() || null,
      },
    });

    return {
      success: true,
      causa,
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "Já existe uma causa com este nome",
      };
    }

    logger.error("Erro ao criar causa:", error);

    return {
      success: false,
      error: "Erro ao criar causa",
    };
  }
}

export async function updateCausa(
  causaId: string,
  payload: Partial<CausaPayload>,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const causa = await prisma.causa.findFirst({
      where: {
        id: causaId,
        tenantId: user.tenantId,
      },
    });

    if (!causa) {
      return { success: false, error: "Causa não encontrada" };
    }

    const data: any = {};

    if (payload.nome !== undefined) {
      if (!payload.nome.trim()) {
        return { success: false, error: "Nome da causa é obrigatório" };
      }
      data.nome = payload.nome.trim();
    }

    if (payload.codigoCnj !== undefined) {
      data.codigoCnj = payload.codigoCnj?.trim() || null;
    }

    if (payload.descricao !== undefined) {
      data.descricao = payload.descricao?.trim() || null;
    }

    const updated = await prisma.causa.update({
      where: { id: causa.id },
      data,
    });

    return { success: true, causa: updated };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "Já existe uma causa com este nome",
      };
    }

    logger.error("Erro ao atualizar causa:", error);

    return {
      success: false,
      error: "Erro ao atualizar causa",
    };
  }
}

export async function setCausaAtiva(causaId: string, ativo: boolean) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const causa = await prisma.causa.findFirst({
      where: { id: causaId, tenantId: user.tenantId },
    });

    if (!causa) {
      return { success: false, error: "Causa não encontrada" };
    }

    const updated = await prisma.causa.update({
      where: { id: causa.id },
      data: { ativo },
    });

    return { success: true, causa: updated };
  } catch (error) {
    logger.error("Erro ao alterar status da causa:", error);

    return {
      success: false,
      error: "Erro ao atualizar status da causa",
    };
  }
}
