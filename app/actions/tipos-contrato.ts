"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface TipoContratoCreatePayload {
  nome: string;
  slug: string;
  descricao?: string | null;
  ordem?: number;
}

export interface TipoContratoUpdatePayload {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  ordem?: number;
  ativo?: boolean;
}

export async function listTiposContrato(params?: { ativo?: boolean }) {
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
      OR: [{ tenantId: user.tenantId }, { tenantId: "GLOBAL" }],
    };

    if (params?.ativo !== undefined) {
      where.ativo = params.ativo;
    }

    const tipos = await prisma.tipoContrato.findMany({
      where,
      include: {
        _count: {
          select: {
            contratos: {
              where: {
                deletedAt: null,
              },
            },
            modelos: true,
          },
        },
      },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });

    return { success: true, tipos };
  } catch (error) {
    logger.error("Erro ao listar tipos de contrato:", error);

    return { success: false, error: "Erro ao listar tipos de contrato" };
  }
}

export async function getTipoContrato(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tipo = await prisma.tipoContrato.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            contratos: {
              where: {
                deletedAt: null,
              },
            },
            modelos: true,
          },
        },
      },
    });

    if (!tipo) {
      return { success: false, error: "Tipo não encontrado" };
    }

    return { success: true, tipo };
  } catch (error) {
    logger.error("Erro ao buscar tipo de contrato:", error);

    return { success: false, error: "Erro ao buscar tipo de contrato" };
  }
}

export async function createTipoContrato(data: TipoContratoCreatePayload) {
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
    const slugExistente = await prisma.tipoContrato.findFirst({
      where: {
        tenantId: user.tenantId,
        slug: data.slug.trim(),
      },
    });

    if (slugExistente) {
      return { success: false, error: "Slug já existe" };
    }

    const tipo = await prisma.tipoContrato.create({
      data: {
        nome: data.nome.trim(),
        slug: data.slug.trim(),
        descricao: data.descricao?.trim(),
        ordem: data.ordem,
        ativo: true,
        tenantId: user.tenantId,
      },
    });

    logger.info(
      `Tipo de contrato criado: ${tipo.id} por usuário ${user.email}`,
    );

    return { success: true, tipo };
  } catch (error) {
    logger.error("Erro ao criar tipo de contrato:", error);

    return { success: false, error: "Erro ao criar tipo de contrato" };
  }
}

export async function updateTipoContrato(
  id: string,
  data: TipoContratoUpdatePayload,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se o tipo existe e pertence ao tenant
    const tipoExistente = await prisma.tipoContrato.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!tipoExistente) {
      return { success: false, error: "Tipo não encontrado" };
    }

    // Se mudando o slug, verificar se novo slug já existe
    if (data.slug && data.slug !== tipoExistente.slug) {
      const slugExistente = await prisma.tipoContrato.findFirst({
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
    if (data.descricao !== undefined)
      updateData.descricao = data.descricao?.trim();
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const tipo = await prisma.tipoContrato.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Tipo de contrato atualizado: ${id} por usuário ${user.email}`);

    return { success: true, tipo };
  } catch (error) {
    logger.error("Erro ao atualizar tipo de contrato:", error);

    return { success: false, error: "Erro ao atualizar tipo de contrato" };
  }
}

export async function deleteTipoContrato(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se o tipo existe e pertence ao tenant
    const tipo = await prisma.tipoContrato.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            contratos: {
              where: {
                deletedAt: null,
              },
            },
            modelos: true,
          },
        },
      },
    });

    if (!tipo) {
      return { success: false, error: "Tipo não encontrado" };
    }

    // Verificar se há contratos ou modelos vinculados
    const totalVinculados = tipo._count.contratos + tipo._count.modelos;

    if (totalVinculados > 0) {
      return {
        success: false,
        error: `Não é possível excluir. Existem ${tipo._count.contratos} contrato(s) e ${tipo._count.modelos} modelo(s) vinculado(s) a este tipo.`,
      };
    }

    await prisma.tipoContrato.delete({
      where: { id },
    });

    logger.info(`Tipo de contrato deletado: ${id} por usuário ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar tipo de contrato:", error);

    return { success: false, error: "Erro ao deletar tipo de contrato" };
  }
}
