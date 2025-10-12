"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface RegimePrazoPayload {
  nome: string;
  tipo:
    | "JUSTICA_COMUM"
    | "JUIZADO_ESPECIAL"
    | "TRABALHISTA"
    | "FEDERAL"
    | "OUTRO";
  contarDiasUteis: boolean;
  descricao?: string | null;
}

export async function listRegimesPrazo() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const regimes = await prisma.regimePrazo.findMany({
      where: {
        OR: [{ tenantId: user.tenantId }, { tenantId: null }],
      },
      orderBy: [{ tenantId: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      regimes,
    };
  } catch (error) {
    logger.error("Erro ao listar regimes de prazo:", error);

    return {
      success: false,
      error: "Erro ao carregar regimes de prazo",
    };
  }
}

export async function createRegimePrazo(payload: RegimePrazoPayload) {
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
      return { success: false, error: "Nome do regime é obrigatório" };
    }

    const regime = await prisma.regimePrazo.create({
      data: {
        tenantId: user.tenantId,
        nome: payload.nome.trim(),
        tipo: payload.tipo,
        contarDiasUteis: payload.contarDiasUteis,
        descricao: payload.descricao?.trim() || null,
      },
    });

    return {
      success: true,
      regime,
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "Já existe um regime com este nome",
      };
    }

    logger.error("Erro ao criar regime de prazo:", error);

    return {
      success: false,
      error: "Erro ao criar regime de prazo",
    };
  }
}

export async function updateRegimePrazo(
  regimeId: string,
  payload: Partial<RegimePrazoPayload>,
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

    const regime = await prisma.regimePrazo.findFirst({
      where: {
        id: regimeId,
        tenantId: user.tenantId,
      },
    });

    if (!regime) {
      return { success: false, error: "Regime de prazo não encontrado" };
    }

    const data: any = {};

    if (payload.nome !== undefined) {
      if (!payload.nome.trim()) {
        return { success: false, error: "Nome do regime é obrigatório" };
      }
      data.nome = payload.nome.trim();
    }

    if (payload.tipo !== undefined) {
      data.tipo = payload.tipo;
    }

    if (payload.contarDiasUteis !== undefined) {
      data.contarDiasUteis = payload.contarDiasUteis;
    }

    if (payload.descricao !== undefined) {
      data.descricao = payload.descricao?.trim() || null;
    }

    const updated = await prisma.regimePrazo.update({
      where: { id: regime.id },
      data,
    });

    return {
      success: true,
      regime: updated,
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "Já existe um regime com este nome",
      };
    }

    logger.error("Erro ao atualizar regime de prazo:", error);

    return {
      success: false,
      error: "Erro ao atualizar regime de prazo",
    };
  }
}

export async function deleteRegimePrazo(regimeId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const regime = await prisma.regimePrazo.findFirst({
      where: {
        id: regimeId,
        tenantId: user.tenantId,
      },
    });

    if (!regime) {
      return { success: false, error: "Regime não encontrado" };
    }

    const vinculados = await prisma.processoPrazo.count({
      where: { regimePrazoId: regime.id },
    });

    if (vinculados > 0) {
      return {
        success: false,
        error:
          "Não é possível remover o regime enquanto houver prazos vinculados. Atualize os registros primeiro.",
      };
    }

    await prisma.regimePrazo.delete({ where: { id: regime.id } });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar regime de prazo:", error);

    return {
      success: false,
      error: "Erro ao deletar regime de prazo",
    };
  }
}
