"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface TribunalCreatePayload {
  nome: string;
  sigla?: string | null;
  esfera?: string | null; // Federal, Estadual, Municipal
  uf?: string | null;
  siteUrl?: string | null;
}

export interface TribunalUpdatePayload {
  nome?: string;
  sigla?: string | null;
  esfera?: string | null;
  uf?: string | null;
  siteUrl?: string | null;
}

export async function listTribunais(params?: { uf?: string; esfera?: string }) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const where: any = {
      tenantId: user.tenantId,
    };

    if (params?.uf) {
      where.uf = params.uf;
    }

    if (params?.esfera) {
      where.esfera = params.esfera;
    }

    const tribunais = await prisma.tribunal.findMany({
      where,
      include: {
        _count: {
          select: {
            processos: {
              where: {
                deletedAt: null,
              },
            },
            juizes: true,
          },
        },
      },
      orderBy: [{ uf: "asc" }, { nome: "asc" }],
    });

    return { success: true, tribunais };
  } catch (error) {
    logger.error("Erro ao listar tribunais:", error);
    return { success: false, error: "Erro ao listar tribunais" };
  }
}

export async function getTribunal(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tribunal = await prisma.tribunal.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            processos: {
              where: {
                deletedAt: null,
              },
            },
            juizes: true,
          },
        },
      },
    });

    if (!tribunal) {
      return { success: false, error: "Tribunal não encontrado" };
    }

    return { success: true, tribunal };
  } catch (error) {
    logger.error("Erro ao buscar tribunal:", error);
    return { success: false, error: "Erro ao buscar tribunal" };
  }
}

export async function createTribunal(data: TribunalCreatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Validações
    if (!data.nome?.trim()) {
      return { success: false, error: "Nome é obrigatório" };
    }

    // Verificar se tribunal já existe (mesmo nome e UF)
    const tribunalExistente = await prisma.tribunal.findFirst({
      where: {
        nome: data.nome.trim(),
        uf: data.uf || null,
      },
    });

    if (tribunalExistente) {
      return {
        success: false,
        error: "Já existe um tribunal com este nome nesta UF",
      };
    }

    const tribunal = await prisma.tribunal.create({
      data: {
        nome: data.nome.trim(),
        sigla: data.sigla?.trim(),
        esfera: data.esfera?.trim(),
        uf: data.uf?.trim(),
        siteUrl: data.siteUrl?.trim(),
        tenantId: user.tenantId,
      },
    });

    logger.info(`Tribunal criado: ${tribunal.id} por usuário ${user.email}`);

    return { success: true, tribunal };
  } catch (error) {
    logger.error("Erro ao criar tribunal:", error);
    return { success: false, error: "Erro ao criar tribunal" };
  }
}

export async function updateTribunal(id: string, data: TribunalUpdatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se o tribunal existe e pertence ao tenant
    const tribunalExistente = await prisma.tribunal.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!tribunalExistente) {
      return { success: false, error: "Tribunal não encontrado" };
    }

    // Se mudando nome ou UF, verificar duplicidade
    if (data.nome || data.uf) {
      const nomeCheck = data.nome || tribunalExistente.nome;
      const ufCheck = data.uf !== undefined ? data.uf : tribunalExistente.uf;

      const duplicado = await prisma.tribunal.findFirst({
        where: {
          nome: nomeCheck,
          uf: ufCheck,
          id: {
            not: id,
          },
        },
      });

      if (duplicado) {
        return {
          success: false,
          error: "Já existe um tribunal com este nome nesta UF",
        };
      }
    }

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.sigla !== undefined) updateData.sigla = data.sigla?.trim();
    if (data.esfera !== undefined) updateData.esfera = data.esfera?.trim();
    if (data.uf !== undefined) updateData.uf = data.uf?.trim();
    if (data.siteUrl !== undefined) updateData.siteUrl = data.siteUrl?.trim();

    const tribunal = await prisma.tribunal.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Tribunal atualizado: ${id} por usuário ${user.email}`);

    return { success: true, tribunal };
  } catch (error) {
    logger.error("Erro ao atualizar tribunal:", error);
    return { success: false, error: "Erro ao atualizar tribunal" };
  }
}

export async function deleteTribunal(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se o tribunal existe e pertence ao tenant
    const tribunal = await prisma.tribunal.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            processos: {
              where: {
                deletedAt: null,
              },
            },
            juizes: true,
          },
        },
      },
    });

    if (!tribunal) {
      return { success: false, error: "Tribunal não encontrado" };
    }

    // Verificar se há processos ou juízes vinculados
    const totalVinculados = tribunal._count.processos + tribunal._count.juizes;

    if (totalVinculados > 0) {
      return {
        success: false,
        error: `Não é possível excluir. Existem ${tribunal._count.processos} processo(s) e ${tribunal._count.juizes} juiz(es) vinculado(s) a este tribunal.`,
      };
    }

    await prisma.tribunal.delete({
      where: { id },
    });

    logger.info(`Tribunal deletado: ${id} por usuário ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar tribunal:", error);
    return { success: false, error: "Erro ao deletar tribunal" };
  }
}
