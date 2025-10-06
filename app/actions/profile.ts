"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { UserRole } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  advogado?: {
    id: string;
    oabNumero: string | null;
    oabUf: string | null;
    especialidades: string[];
    bio: string | null;
    telefone: string | null;
    whatsapp: string | null;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  newPassword: string;
  confirmPassword: string;
}

// Buscar perfil do usuário atual
export async function getCurrentUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = await prisma.usuario.findUnique({
      where: {
        id: session.user.id,
        tenantId: session.user.tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        advogado: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            especialidades: true,
            bio: true,
            telefone: true,
            whatsapp: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    return {
      success: true,
      profile: user as UserProfile,
    };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Atualizar dados básicos do perfil
export async function updateUserProfile(data: UpdateProfileData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Validar dados
    if (data.firstName && data.firstName.trim().length < 2) {
      return { success: false, error: "Nome deve ter pelo menos 2 caracteres" };
    }

    if (data.lastName && data.lastName.trim().length < 2) {
      return { success: false, error: "Sobrenome deve ter pelo menos 2 caracteres" };
    }

    if (data.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone)) {
      return { success: false, error: "Formato de telefone inválido" };
    }

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName?.trim() || null,
        lastName: data.lastName?.trim() || null,
        phone: data.phone?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/usuario/perfil/editar");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Alterar senha
export async function changePassword(data: ChangePasswordData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Validar dados
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: "Nova senha e confirmação não coincidem" };
    }

    if (data.newPassword.length < 8) {
      return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres" };
    }

    // Verificar se o usuário existe
    const user = await prisma.usuario.findUnique({
      where: {
        id: session.user.id,
        tenantId: session.user.tenantId,
      },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

    // Atualizar senha
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/usuario/perfil/editar");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Upload de avatar via Server Action
export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean;
  avatarUrl?: string;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const file = formData.get("file") as File;
    const url = formData.get("url") as string;

    let avatarUrl: string;

    if (url) {
      // Se for uma URL, validar e usar diretamente
      try {
        new URL(url);
        // Verificar se é uma URL de imagem válida
        if (!/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
          return { success: false, error: "URL deve apontar para uma imagem válida" };
        }
        avatarUrl = url;
      } catch {
        return { success: false, error: "URL inválida" };
      }
    } else if (file) {
      // Se for um arquivo, fazer upload
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." };
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Máximo 5MB." };
      }

      // Converter para buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Usar o serviço de upload
      const { UploadService } = await import("@/lib/upload-service");
      const uploadService = UploadService.getInstance();
      const userName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || session.user.email;
      const result = await uploadService.uploadAvatar(buffer, session.user.id, file.name, session.user.tenantSlug, userName);

      if (!result.success || !result.url) {
        return {
          success: false,
          error: result.error || "Erro no upload",
        };
      }

      avatarUrl = result.url;
    } else {
      return { success: false, error: "Nenhum arquivo ou URL fornecido" };
    }

    // Atualizar no banco de dados
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        avatarUrl,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/usuario/perfil/editar");
    revalidatePath("/"); // Revalidar página principal também
    revalidatePath("/dashboard"); // Revalidar dashboard também

    return {
      success: true,
      avatarUrl,
      sessionUpdated: true, // Flag para indicar que a sessão precisa ser atualizada
    };
  } catch (error) {
    console.error("Erro no upload do avatar:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Deletar avatar via Server Action
export async function deleteAvatar(avatarUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Usar o serviço de upload para deletar
    const { UploadService } = await import("@/lib/upload-service");
    const uploadService = UploadService.getInstance();
    const result = await uploadService.deleteAvatar(avatarUrl, session.user.id);

    if (result.success) {
      // Atualizar no banco de dados
      await prisma.usuario.update({
        where: { id: session.user.id },
        data: {
          avatarUrl: null,
          updatedAt: new Date(),
        },
      });

      revalidatePath("/usuario/perfil/editar");
      revalidatePath("/"); // Revalidar página principal também
      return {
        success: true,
        sessionUpdated: true, // Flag para indicar que a sessão precisa ser atualizada
      };
    } else {
      return {
        success: false,
        error: result.error || "Erro ao deletar avatar",
      };
    }
  } catch (error) {
    console.error("Erro ao deletar avatar:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Buscar avatar do usuário atual
export async function getCurrentUserAvatar(): Promise<{
  success: boolean;
  avatarUrl?: string | null;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = await prisma.usuario.findUnique({
      where: {
        id: session.user.id,
        tenantId: session.user.tenantId,
      },
      select: {
        avatarUrl: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    return {
      success: true,
      avatarUrl: user.avatarUrl,
    };
  } catch (error) {
    console.error("Erro ao buscar avatar:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Buscar estatísticas do usuário
export async function getUserStats(): Promise<{
  success: boolean;
  stats?: {
    totalProcessos: number;
    totalDocumentos: number;
    totalEventos: number;
    totalTarefas: number;
  };
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId;

    // Buscar estatísticas baseadas no role
    const [processos, documentos, eventos, tarefas] = await Promise.all([
      prisma.processo.count({
        where: {
          tenantId,
          OR: [{ advogadoResponsavel: { usuarioId: userId } }, { cliente: { usuarioId: userId } }],
        },
      }),
      prisma.documento.count({
        where: {
          tenantId,
          OR: [{ uploadedById: userId }, { cliente: { usuarioId: userId } }],
        },
      }),
      prisma.evento.count({
        where: {
          tenantId,
          OR: [{ criadoPorId: userId }, { cliente: { usuarioId: userId } }],
        },
      }),
      prisma.tarefa.count({
        where: {
          tenantId,
          OR: [{ criadoPorId: userId }, { responsavelId: userId }, { cliente: { usuarioId: userId } }],
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalProcessos: processos,
        totalDocumentos: documentos,
        totalEventos: eventos,
        totalTarefas: tarefas,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
