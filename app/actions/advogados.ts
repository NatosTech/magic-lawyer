"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";
import { EspecialidadeJuridica } from "@/app/generated/prisma";
import { UploadService } from "@/lib/upload-service";

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
  isExterno: boolean; // Campo do schema para identificar advogados externos
  processosCount?: number; // Contador de processos onde aparece
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
  isExterno?: boolean;
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
      select: {
        id: true,
        usuarioId: true,
        oabNumero: true,
        oabUf: true,
        especialidades: true,
        bio: true,
        telefone: true,
        whatsapp: true,
        comissaoPadrao: true,
        comissaoAcaoGanha: true,
        comissaoHonorarios: true,
        isExterno: true,
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
      isExterno: adv.isExterno,
      processosCount: 0, // Será calculado se necessário
      usuario: adv.usuario,
    }));

    return { success: true, advogados: data } as any;
  } catch (error) {
    console.error("Erro ao buscar advogados:", error);

    return { success: false, error: "Erro ao buscar advogados" };
  }
}

export async function createAdvogado(input: CreateAdvogadoInput): Promise<ActionResponse<AdvogadoData>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o usuário tem permissão para criar advogados
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Apenas administradores podem criar advogados" };
    }

    // Verificar se o email já existe no tenant
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: input.email,
        tenantId: session.user.tenantId,
      },
    });

    if (existingUser) {
      return { success: false, error: "Já existe um usuário com este email no escritório" };
    }

    // Verificar se a OAB já existe no tenant (se fornecida)
    if (input.oabNumero && input.oabUf) {
      const existingOAB = await prisma.advogado.findFirst({
        where: {
          oabNumero: input.oabNumero,
          oabUf: input.oabUf,
          tenantId: session.user.tenantId,
        },
      });

      if (existingOAB) {
        return { success: false, error: "Já existe um advogado com esta OAB no escritório" };
      }
    }

    // Criar usuário primeiro
    const usuario = await prisma.usuario.create({
      data: {
        tenantId: session.user.tenantId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: "ADVOGADO",
        active: true,
        createdById: session.user.id,
      },
    });

    // Criar advogado
    const advogado = await prisma.advogado.create({
      data: {
        tenantId: session.user.tenantId,
        usuarioId: usuario.id,
        oabNumero: input.oabNumero,
        oabUf: input.oabUf,
        especialidades: input.especialidades || [],
        bio: input.bio,
        telefone: input.telefone,
        whatsapp: input.whatsapp,
        comissaoPadrao: input.comissaoPadrao || 0,
        comissaoAcaoGanha: input.comissaoAcaoGanha || 0,
        comissaoHonorarios: input.comissaoHonorarios || 0,
        isExterno: input.isExterno || false,
      },
      select: {
        id: true,
        usuarioId: true,
        oabNumero: true,
        oabUf: true,
        especialidades: true,
        bio: true,
        telefone: true,
        whatsapp: true,
        comissaoPadrao: true,
        comissaoAcaoGanha: true,
        comissaoHonorarios: true,
        isExterno: true,
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
      isExterno: advogado.isExterno,
      processosCount: 0,
      usuario: advogado.usuario,
    };

    return { success: true, advogado: data } as any;
  } catch (error) {
    console.error("Erro ao criar advogado:", error);
    return { success: false, error: "Erro ao criar advogado" };
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

export async function deleteAdvogado(advogadoId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o usuário tem permissão para deletar advogados
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Apenas administradores podem deletar advogados" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
      },
      include: {
        usuario: true,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Verificar se o advogado não é o próprio usuário logado
    if (advogado.usuarioId === session.user.id) {
      return { success: false, error: "Você não pode deletar seu próprio perfil" };
    }

    // Verificar se o advogado tem processos vinculados
    const processosCount = await prisma.processo.count({
      where: {
        advogadoResponsavelId: advogadoId,
        tenantId: session.user.tenantId,
      },
    });

    if (processosCount > 0) {
      return {
        success: false,
        error: `Não é possível deletar o advogado pois ele está vinculado a ${processosCount} processo(s). Desvincule os processos primeiro.`,
      };
    }

    // Verificar se o advogado tem contratos vinculados
    const contratosCount = await prisma.contrato.count({
      where: {
        advogadoId: advogadoId,
        tenantId: session.user.tenantId,
      },
    });

    if (contratosCount > 0) {
      return {
        success: false,
        error: `Não é possível deletar o advogado pois ele está vinculado a ${contratosCount} contrato(s). Desvincule os contratos primeiro.`,
      };
    }

    // Deletar o advogado (isso também deletará o usuário devido ao onDelete: Cascade)
    await prisma.advogado.delete({
      where: { id: advogadoId },
    });

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar advogado:", error);
    return { success: false, error: "Erro ao deletar advogado" };
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

// =============================================
// ADVOGADOS EXTERNOS IDENTIFICADOS
// =============================================

export interface AdvogadoExternoIdentificado {
  id: string;
  nome: string;
  oabNumero: string | null;
  oabUf: string | null;
  email: string | null;
  telefone: string | null;
  processosCount: number;
  primeiroProcesso: Date | null;
  ultimoProcesso: Date | null;
  processos: {
    id: string;
    numero: string;
    cliente: string;
    dataIdentificacao: Date;
  }[];
}

export async function getAdvogadosExternosIdentificados(): Promise<ActionResponse<AdvogadoExternoIdentificado[]>> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Buscar advogados que aparecem em ProcessoParte mas não são do escritório atual
    const advogadosExternos = await prisma.processoParte.findMany({
      where: {
        tenantId: session.user.tenantId,
        advogadoId: {
          not: null,
        },
        advogado: {
          tenantId: {
            not: session.user.tenantId, // Advogados de outros tenants
          },
        },
      },
      include: {
        advogado: {
          include: {
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            cliente: {
              select: {
                nome: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Agrupar por advogado e contar processos
    const agrupados = new Map<
      string,
      {
        advogado: any;
        processos: any[];
        processosCount: number;
        primeiroProcesso: Date | null;
        ultimoProcesso: Date | null;
      }
    >();

    for (const parte of advogadosExternos) {
      const advogadoId = parte.advogadoId!;

      if (!agrupados.has(advogadoId)) {
        agrupados.set(advogadoId, {
          advogado: parte.advogado,
          processos: [],
          processosCount: 0,
          primeiroProcesso: null,
          ultimoProcesso: null,
        });
      }

      const grupo = agrupados.get(advogadoId)!;
      grupo.processos.push({
        id: parte.processo.id,
        numero: parte.processo.numero,
        cliente: parte.processo.cliente.nome,
        dataIdentificacao: parte.createdAt,
      });
      grupo.processosCount++;

      if (!grupo.primeiroProcesso || parte.createdAt < grupo.primeiroProcesso) {
        grupo.primeiroProcesso = parte.createdAt;
      }
      if (!grupo.ultimoProcesso || parte.createdAt > grupo.ultimoProcesso) {
        grupo.ultimoProcesso = parte.createdAt;
      }
    }

    // Converter para formato final
    const resultado: AdvogadoExternoIdentificado[] = Array.from(agrupados.values()).map((grupo) => ({
      id: grupo.advogado.id,
      nome: `${grupo.advogado.usuario?.firstName || ""} ${grupo.advogado.usuario?.lastName || ""}`.trim() || "Nome não informado",
      oabNumero: grupo.advogado.oabNumero,
      oabUf: grupo.advogado.oabUf,
      email: grupo.advogado.usuario?.email || null,
      telefone: grupo.advogado.usuario?.phone || null,
      processosCount: grupo.processosCount,
      primeiroProcesso: grupo.primeiroProcesso,
      ultimoProcesso: grupo.ultimoProcesso,
      processos: grupo.processos,
    }));

    return { success: true, data: resultado };
  } catch (error) {
    console.error("Erro ao buscar advogados externos identificados:", error);
    return { success: false, error: "Erro ao buscar advogados externos identificados" };
  }
}

// =============================================
// FUNÇÃO COMBINADA PARA BUSCAR TODOS OS ADVOGADOS
// =============================================

export async function getAllAdvogadosComExternos(): Promise<ActionResponse<AdvogadoData[]>> {
  try {
    // Agora que o campo isExterno está no schema, podemos usar apenas getAdvogados
    return await getAdvogados();
  } catch (error) {
    console.error("Erro ao buscar todos os advogados:", error);
    return { success: false, error: "Erro ao buscar todos os advogados" };
  }
}

export async function uploadAvatarAdvogado(advogadoId: string, file: File): Promise<ActionResponse<{ url: string }>> {
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
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Verificar se o usuário tem permissão para alterar o avatar
    if (session.user.role !== "ADMIN" && advogado.usuarioId !== session.user.id) {
      return { success: false, error: "Você não tem permissão para alterar este avatar" };
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Apenas arquivos de imagem são permitidos" };
    }

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Arquivo muito grande. Máximo permitido: 5MB" };
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Obter tenant slug
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    });

    if (!tenant) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Deletar avatar anterior se existir
    if (advogado.usuario.avatarUrl) {
      const uploadService = UploadService.getInstance();
      await uploadService.deleteAvatar(advogado.usuario.avatarUrl, advogado.usuario.id);
    }

    // Fazer upload do novo avatar
    const uploadService = UploadService.getInstance();
    const uploadResult = await uploadService.uploadAvatar(buffer, advogado.usuario.id, file.name, tenant.slug, `${advogado.usuario.firstName} ${advogado.usuario.lastName}`.trim());

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || "Erro ao fazer upload do avatar" };
    }

    // Atualizar URL do avatar no banco
    await prisma.usuario.update({
      where: { id: advogado.usuario.id },
      data: { avatarUrl: uploadResult.url },
    });

    revalidatePath("/advogados");
    revalidatePath("/usuario/perfil/editar");

    return { success: true, url: uploadResult.url } as any;
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error);
    return { success: false, error: "Erro ao fazer upload do avatar" };
  }
}

export async function deleteAvatarAdvogado(advogadoId: string): Promise<ActionResponse> {
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
            id: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Verificar se o usuário tem permissão para deletar o avatar
    if (session.user.role !== "ADMIN" && advogado.usuarioId !== session.user.id) {
      return { success: false, error: "Você não tem permissão para deletar este avatar" };
    }

    if (!advogado.usuario.avatarUrl) {
      return { success: false, error: "Avatar não encontrado" };
    }

    // Deletar avatar do Cloudinary
    const uploadService = UploadService.getInstance();
    const deleteResult = await uploadService.deleteAvatar(advogado.usuario.avatarUrl, advogado.usuario.id);

    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error || "Erro ao deletar avatar" };
    }

    // Remover URL do avatar do banco
    await prisma.usuario.update({
      where: { id: advogado.usuario.id },
      data: { avatarUrl: null },
    });

    revalidatePath("/advogados");
    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar avatar:", error);
    return { success: false, error: "Erro ao deletar avatar" };
  }
}

export async function convertAdvogadoExternoToInterno(advogadoId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session?.user?.tenantId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se o usuário tem permissão para converter advogados
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Apenas administradores podem converter advogados externos em internos" };
    }

    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: session.user.tenantId,
        isExterno: true, // Apenas advogados externos podem ser convertidos
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado externo não encontrado" };
    }

    // Converter para interno
    await prisma.advogado.update({
      where: { id: advogadoId },
      data: { isExterno: false },
    });

    revalidatePath("/advogados");

    return { success: true };
  } catch (error) {
    console.error("Erro ao converter advogado externo em interno:", error);
    return { success: false, error: "Erro ao converter advogado" };
  }
}

// Alias para compatibilidade
export const getAdvogadosDoTenant = getAllAdvogadosComExternos;
export type Advogado = AdvogadoData;
