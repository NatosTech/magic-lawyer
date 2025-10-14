"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface AreaProcessoCreatePayload {
  nome: string;
  slug: string;
  descricao?: string | null;
  ordem?: number;
}

export interface AreaProcessoUpdatePayload {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  ordem?: number;
  ativo?: boolean;
}

export async function listAreasProcesso(params?: { ativo?: boolean }) {
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

    if (params?.ativo !== undefined) {
      where.ativo = params.ativo;
    }

    const areas = await prisma.areaProcesso.findMany({
      where,
      include: {
        _count: {
          select: {
            processos: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });

    return { success: true, areas };
  } catch (error) {
    logger.error("Erro ao listar áreas de processo:", error);
    return { success: false, error: "Erro ao listar áreas de processo" };
  }
}

export async function getAreaProcesso(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const area = await prisma.areaProcesso.findFirst({
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
          },
        },
      },
    });

    if (!area) {
      return { success: false, error: "Área não encontrada" };
    }

    return { success: true, area };
  } catch (error) {
    logger.error("Erro ao buscar área de processo:", error);
    return { success: false, error: "Erro ao buscar área de processo" };
  }
}

export async function createAreaProcesso(data: AreaProcessoCreatePayload) {
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

    if (!data.slug?.trim()) {
      return { success: false, error: "Slug é obrigatório" };
    }

    // Verificar se slug já existe
    const slugExistente = await prisma.areaProcesso.findFirst({
      where: {
        tenantId: user.tenantId,
        slug: data.slug.trim(),
      },
    });

    if (slugExistente) {
      return { success: false, error: "Slug já existe" };
    }

    const area = await prisma.areaProcesso.create({
      data: {
        nome: data.nome.trim(),
        slug: data.slug.trim(),
        descricao: data.descricao?.trim(),
        ordem: data.ordem,
        ativo: true,
        tenantId: user.tenantId,
      },
    });

    logger.info(`Área de processo criada: ${area.id} por usuário ${user.email}`);

    return { success: true, area };
  } catch (error) {
    logger.error("Erro ao criar área de processo:", error);
    return { success: false, error: "Erro ao criar área de processo" };
  }
}

export async function updateAreaProcesso(id: string, data: AreaProcessoUpdatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se a área existe e pertence ao tenant
    const areaExistente = await prisma.areaProcesso.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!areaExistente) {
      return { success: false, error: "Área não encontrada" };
    }

    // Se mudando o slug, verificar se novo slug já existe
    if (data.slug && data.slug !== areaExistente.slug) {
      const slugExistente = await prisma.areaProcesso.findFirst({
        where: {
          tenantId: user.tenantId,
          slug: data.slug.trim(),
          id: {
            not: id,
          },
        },
      });

      if (slugExistente) {
        return { success: false, error: "Slug já existe" };
      }
    }

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim();
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const area = await prisma.areaProcesso.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Área de processo atualizada: ${id} por usuário ${user.email}`);

    return { success: true, area };
  } catch (error) {
    logger.error("Erro ao atualizar área de processo:", error);
    return { success: false, error: "Erro ao atualizar área de processo" };
  }
}

export async function deleteAreaProcesso(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se a área existe e pertence ao tenant
    const area = await prisma.areaProcesso.findFirst({
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
          },
        },
      },
    });

    if (!area) {
      return { success: false, error: "Área não encontrada" };
    }

    // Verificar se há processos vinculados
    if (area._count.processos > 0) {
      return {
        success: false,
        error: `Não é possível excluir. Existem ${area._count.processos} processo(s) vinculado(s) a esta área.`,
      };
    }

    await prisma.areaProcesso.delete({
      where: { id },
    });

    logger.info(`Área de processo deletada: ${id} por usuário ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar área de processo:", error);
    return { success: false, error: "Erro ao deletar área de processo" };
  }
}
