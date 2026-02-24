"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import { UserRole } from "@/generated/prisma";
import {
  getSelfEditPermissions,
  type SelfEditPermissions,
} from "@/lib/user-permissions";
import logger from "@/lib/logger";

// Interface para dados que o usuário pode editar de si mesmo
export interface UserSelfEditData {
  // Dados básicos do usuário
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;

  // Dados específicos por role
  advogadoData?: {
    telefone?: string;
    whatsapp?: string;
    bio?: string;
    especialidades?: string[];
  };

  clienteData?: {
    telefone?: string;
    celular?: string;
    dataNascimento?: Date;
    observacoes?: string;
  };
}

// Atualizar dados básicos do usuário (auto-edição)
export async function updateUserSelfData(data: UserSelfEditData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const permissions = getSelfEditPermissions(session.user.role as UserRole);

    // Validar permissões
    if (data.firstName && !permissions.canEditBasicInfo) {
      return { success: false, error: "Não tem permissão para alterar nome" };
    }

    if (data.lastName && !permissions.canEditBasicInfo) {
      return {
        success: false,
        error: "Não tem permissão para alterar sobrenome",
      };
    }

    if (data.phone && !permissions.canEditPhone) {
      return {
        success: false,
        error: "Não tem permissão para alterar telefone",
      };
    }

    if (data.avatarUrl && !permissions.canEditAvatar) {
      return { success: false, error: "Não tem permissão para alterar avatar" };
    }

    // Validar dados básicos
    if (data.firstName && data.firstName.trim().length < 2) {
      return { success: false, error: "Nome deve ter pelo menos 2 caracteres" };
    }

    if (data.lastName && data.lastName.trim().length < 2) {
      return {
        success: false,
        error: "Sobrenome deve ter pelo menos 2 caracteres",
      };
    }

    if (data.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone)) {
      return { success: false, error: "Formato de telefone inválido" };
    }

    // Atualizar dados básicos do usuário
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.phone) updateData.phone = data.phone.trim();
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl.trim();

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Atualizar dados específicos do role se permitido
    if (permissions.canEditRoleSpecificData && data.advogadoData) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
        },
      });

      if (advogado) {
        const advogadoUpdateData: any = {
          updatedAt: new Date(),
        };

        if (data.advogadoData.telefone) {
          advogadoUpdateData.telefone = data.advogadoData.telefone.trim();
        }
        if (data.advogadoData.whatsapp) {
          advogadoUpdateData.whatsapp = data.advogadoData.whatsapp.trim();
        }
        if (data.advogadoData.bio) {
          advogadoUpdateData.bio = data.advogadoData.bio.trim();
        }
        if (data.advogadoData.especialidades) {
          advogadoUpdateData.especialidades = data.advogadoData.especialidades;
        }

        await prisma.advogado.update({
          where: { id: advogado.id },
          data: advogadoUpdateData,
        });
      }
    }

    if (permissions.canEditRoleSpecificData && data.clienteData) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
        },
      });

      if (cliente) {
        const clienteUpdateData: any = {
          updatedAt: new Date(),
        };

        if (data.clienteData.telefone) {
          clienteUpdateData.telefone = data.clienteData.telefone.trim();
        }
        if (data.clienteData.celular) {
          clienteUpdateData.celular = data.clienteData.celular.trim();
        }
        if (data.clienteData.dataNascimento) {
          clienteUpdateData.dataNascimento = data.clienteData.dataNascimento;
        }
        if (data.clienteData.observacoes) {
          clienteUpdateData.observacoes = data.clienteData.observacoes.trim();
        }

        await prisma.cliente.update({
          where: { id: cliente.id },
          data: clienteUpdateData,
        });
      }
    }

    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar dados do usuário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Obter dados completos do usuário para auto-edição
export async function getUserSelfEditData(): Promise<{
  success: boolean;
  data?: {
    user: any;
    advogado?: any;
    cliente?: any;
    permissions: SelfEditPermissions;
  };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const permissions = getSelfEditPermissions(session.user.role as UserRole);

    // Buscar dados do usuário
    const user = await prisma.usuario.findUnique({
      where: {
        id: session.user.id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        active: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    let advogado = null;
    let cliente = null;

    // Buscar dados específicos do role
    if (session.user.role === "ADVOGADO") {
      advogado = await prisma.advogado.findFirst({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
        },
        select: {
          id: true,
          telefone: true,
          whatsapp: true,
          bio: true,
          especialidades: true,
          oabNumero: true,
          oabUf: true,
        },
      });
    }

    if (session.user.role === "CLIENTE") {
      cliente = await prisma.cliente.findFirst({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
        },
        select: {
          id: true,
          telefone: true,
          celular: true,
          dataNascimento: true,
          observacoes: true,
          tipoPessoa: true,
          nome: true,
          documento: true,
        },
      });
    }

    return {
      success: true,
      data: {
        user,
        advogado,
        cliente,
        permissions,
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar dados do usuário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
