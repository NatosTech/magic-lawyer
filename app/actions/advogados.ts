"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";
import { EspecialidadeJuridica } from "@/app/generated/prisma";

// =============================================
// TYPES
// =============================================

export interface AdvogadoSelectItem {
  id: string;
  value: string;
  label: string;
  oab: string | null;
  oabNumero: string | null;
  oabUf: string | null;
  usuario: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface AdvogadoData {
  id: string;
  usuarioId: string;
  oabNumero: string | null;
  oabUf: string | null;
  especialidades: EspecialidadeJuridica[];
  bio: string | null;
  telefone: string | null;
  whatsapp: string | null;
  comissaoPadrao: number;
  comissaoAcaoGanha: number;
  comissaoHonorarios: number;
  usuario: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    active: boolean;
    role: string;
  };
}

export interface CreateAdvogadoInput {
  // Dados do usuário
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // Dados do advogado
  oabNumero?: string;
  oabUf?: string;
  especialidades?: EspecialidadeJuridica[];
  bio?: string;
  telefone?: string;
  whatsapp?: string;
  comissaoPadrao?: number;
  comissaoAcaoGanha?: number;
  comissaoHonorarios?: number;
}

export interface UpdateAdvogadoInput {
  // Dados do usuário
  firstName?: string;
  lastName?: string;
  phone?: string;
  // Dados do advogado
  oabNumero?: string;
  oabUf?: string;
  especialidades?: EspecialidadeJuridica[];
  bio?: string;
  telefone?: string;
  whatsapp?: string;
  comissaoPadrao?: number;
  comissaoAcaoGanha?: number;
  comissaoHonorarios?: number;
}

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  advogados?: T;
}

// =============================================
// ACTIONS
// =============================================

export async function getAdvogados(): Promise<ActionResponse<AdvogadoData[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogados = await prisma.advogado.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            active: true,
            role: true,
          },
        },
      },
      orderBy: {
        usuario: {
          firstName: "asc",
        },
      },
    });

    const data = advogados.map((adv) => ({
      id: adv.id,
      usuarioId: adv.usuarioId,
      oabNumero: adv.oabNumero,
      oabUf: adv.oabUf,
      especialidades: adv.especialidades as EspecialidadeJuridica[],
      bio: adv.bio,
      telefone: adv.telefone,
      whatsapp: adv.whatsapp,
      comissaoPadrao: parseFloat(adv.comissaoPadrao.toString()),
      comissaoAcaoGanha: parseFloat(adv.comissaoAcaoGanha.toString()),
      comissaoHonorarios: parseFloat(adv.comissaoHonorarios.toString()),
      usuario: adv.usuario,
    }));

    return { success: true, advogados: data } as any;
  } catch (error) {
    console.error("Erro ao buscar advogados:", error);

    return { success: false, error: "Erro ao buscar advogados" };
  }
}

export async function getAdvogado(advogadoId: string): Promise<ActionResponse<AdvogadoData>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            active: true,
            role: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    const data: AdvogadoData = {
      id: advogado.id,
      usuarioId: advogado.usuarioId,
      oabNumero: advogado.oabNumero,
      oabUf: advogado.oabUf,
      especialidades: advogado.especialidades as EspecialidadeJuridica[],
      bio: advogado.bio,
      telefone: advogado.telefone,
      whatsapp: advogado.whatsapp,
      comissaoPadrao: parseFloat(advogado.comissaoPadrao.toString()),
      comissaoAcaoGanha: parseFloat(advogado.comissaoAcaoGanha.toString()),
      comissaoHonorarios: parseFloat(advogado.comissaoHonorarios.toString()),
      usuario: advogado.usuario,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar advogado:", error);

    return { success: false, error: "Erro ao buscar advogado" };
  }
}

export async function getCurrentUserAdvogado(): Promise<ActionResponse<AdvogadoData>> {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        usuarioId: session.user.id,
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            active: true,
            role: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Dados de advogado não encontrados" };
    }

    const data: AdvogadoData = {
      id: advogado.id,
      usuarioId: advogado.usuarioId,
      oabNumero: advogado.oabNumero,
      oabUf: advogado.oabUf,
      especialidades: advogado.especialidades as EspecialidadeJuridica[],
      bio: advogado.bio,
      telefone: advogado.telefone,
      whatsapp: advogado.whatsapp,
      comissaoPadrao: parseFloat(advogado.comissaoPadrao.toString()),
      comissaoAcaoGanha: parseFloat(advogado.comissaoAcaoGanha.toString()),
      comissaoHonorarios: parseFloat(advogado.comissaoHonorarios.toString()),
      usuario: advogado.usuario,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar dados do advogado:", error);

    return { success: false, error: "Erro ao buscar dados do advogado" };
  }
}

export async function updateAdvogado(advogadoId: string, input: UpdateAdvogadoInput): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Atualizar dados do usuário se fornecido
    const usuarioUpdate: any = {};

    if (input.firstName !== undefined) usuarioUpdate.firstName = input.firstName;
    if (input.lastName !== undefined) usuarioUpdate.lastName = input.lastName;
    if (input.phone !== undefined) usuarioUpdate.phone = input.phone;

    if (Object.keys(usuarioUpdate).length > 0) {
      await prisma.usuario.update({
        where: { id: advogado.usuarioId },
        data: usuarioUpdate,
      });
    }

    // Atualizar dados do advogado
    const advogadoUpdate: any = {};

    if (input.oabNumero !== undefined) advogadoUpdate.oabNumero = input.oabNumero;
    if (input.oabUf !== undefined) advogadoUpdate.oabUf = input.oabUf;
    if (input.especialidades !== undefined) advogadoUpdate.especialidades = input.especialidades;
    if (input.bio !== undefined) advogadoUpdate.bio = input.bio;
    if (input.telefone !== undefined) advogadoUpdate.telefone = input.telefone;
    if (input.whatsapp !== undefined) advogadoUpdate.whatsapp = input.whatsapp;
    if (input.comissaoPadrao !== undefined) advogadoUpdate.comissaoPadrao = input.comissaoPadrao;
    if (input.comissaoAcaoGanha !== undefined) advogadoUpdate.comissaoAcaoGanha = input.comissaoAcaoGanha;
    if (input.comissaoHonorarios !== undefined) advogadoUpdate.comissaoHonorarios = input.comissaoHonorarios;

    if (Object.keys(advogadoUpdate).length > 0) {
      await prisma.advogado.update({
        where: { id: advogadoId },
        data: advogadoUpdate,
      });
    }

    revalidatePath("/advogados");
    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar advogado:", error);

    return { success: false, error: "Erro ao atualizar advogado" };
  }
}

export async function updateCurrentUserAdvogado(input: UpdateAdvogadoInput): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        usuarioId: session.user.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!advogado) {
      return { success: false, error: "Dados de advogado não encontrados" };
    }

    return updateAdvogado(advogado.id, input);
  } catch (error) {
    console.error("Erro ao atualizar dados do advogado:", error);

    return { success: false, error: "Erro ao atualizar dados do advogado" };
  }
}

export async function getAdvogadosDisponiveis(): Promise<ActionResponse<AdvogadoSelectItem[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const advogados = await prisma.advogado.findMany({
      where: {
        tenantId: session.user.tenantId,
        usuario: {
          active: true,
        },
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
      orderBy: {
        usuario: {
          firstName: "asc",
        },
      },
    });

    const data: AdvogadoSelectItem[] = advogados.map((adv) => ({
      id: adv.id,
      value: adv.id,
      label: `${adv.usuario.firstName || ""} ${adv.usuario.lastName || ""}`.trim() || "Sem nome",
      oab: adv.oabNumero && adv.oabUf ? `${adv.oabUf} ${adv.oabNumero}` : null,
      oabNumero: adv.oabNumero,
      oabUf: adv.oabUf,
      usuario: {
        firstName: adv.usuario.firstName,
        lastName: adv.usuario.lastName,
        email: adv.usuario.email,
      },
    }));

    return { success: true, advogados: data } as any;
  } catch (error) {
    console.error("Erro ao buscar advogados disponíveis:", error);

    return { success: false, error: "Erro ao buscar advogados disponíveis" };
  }
}

// Alias para compatibilidade
export const getAdvogadosDoTenant = getAdvogados;
export type Advogado = AdvogadoData;
