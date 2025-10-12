"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import {
  EspecialidadeJuridica,
  JuizStatus,
  JuizNivel,
  Juiz,
} from "@/app/generated/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

export interface JuizFilters {
  search?: string;
  status?: JuizStatus;
  especialidade?: EspecialidadeJuridica;
  nivel?: JuizNivel;
  isPublico?: boolean;
  isPremium?: boolean;
}

// Tipo serializado do Juiz (sem Decimal, com strings)
export interface JuizSerializado
  extends Omit<
    Juiz,
    | "precoAcesso"
    | "createdAt"
    | "updatedAt"
    | "dataNascimento"
    | "dataPosse"
    | "dataAposentadoria"
  > {
  precoAcesso: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  dataNascimento: string | null;
  dataPosse: string | null;
  dataAposentadoria: string | null;
  tribunal?: {
    id: string;
    nome: string;
    sigla: string | null;
  } | null;
  _count?: {
    processos?: number;
    julgamentos?: number;
    pacotes?: number;
  };
}

export interface GetJuizesResponse {
  success: boolean;
  data?: JuizSerializado[];
  error?: string;
}

export interface GetJuizResponse {
  success: boolean;
  data?: JuizSerializado;
  error?: string;
}

export interface JuizFormData {
  nome: string;
  nomeCompleto?: string;
  cpf?: string;
  oab?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cep?: string;
  vara: string;
  comarca?: string;
  cidade?: string;
  estado?: string;
  status: JuizStatus;
  nivel: JuizNivel;
  especialidades: EspecialidadeJuridica[];
  biografia?: string;
  formacao?: string;
  experiencia?: string;
  foto?: string;
  isPremium?: boolean;
  isPublico?: boolean;
}

export interface SaveJuizResponse {
  success: boolean;
  data?: JuizSerializado;
  error?: string;
}

// Buscar juízes com filtros - APENAS JUÍZES PÚBLICOS GLOBAIS
type JuizQueryOptions = {
  onlyPublicos?: boolean;
};

function buildJuizWhere(
  filters?: JuizFilters,
  options: JuizQueryOptions = { onlyPublicos: true },
) {
  const where: any = {};

  if (options.onlyPublicos !== false) {
    where.isPublico = true;
  }

  if (filters?.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: "insensitive" } },
      { nomeCompleto: { contains: filters.search, mode: "insensitive" } },
      { vara: { contains: filters.search, mode: "insensitive" } },
      { comarca: { contains: filters.search, mode: "insensitive" } },
      { biografia: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.especialidade) {
    where.especialidades = {
      has: filters.especialidade,
    };
  }

  if (filters?.nivel) {
    where.nivel = filters.nivel;
  }

  if (filters?.isPublico !== undefined) {
    where.isPublico = filters.isPublico;
  }

  if (filters?.isPremium !== undefined) {
    where.isPremium = filters.isPremium;
  }

  return where;
}

export async function getJuizes(
  filters?: JuizFilters,
): Promise<GetJuizesResponse> {
  try {
    const juizes = await prisma.juiz.findMany({
      where: buildJuizWhere(filters),
      orderBy: [{ isPublico: "desc" }, { nome: "asc" }],
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            pacotes: true,
          },
        },
      },
    });

    return {
      success: true,
      data: juizes.map(serializeJuiz),
    };
  } catch (error) {
    logger.error("Erro ao buscar juízes:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar juízes",
    };
  }
}

export async function getJuizesAdmin(
  filters?: JuizFilters,
): Promise<GetJuizesResponse> {
  try {
    await ensureSuperAdmin();

    const juizes = await prisma.juiz.findMany({
      where: buildJuizWhere(filters, { onlyPublicos: false }),
      orderBy: [{ isPublico: "desc" }, { isPremium: "desc" }, { nome: "asc" }],
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            pacotes: true,
          },
        },
      },
    });

    return {
      success: true,
      data: juizes.map(serializeJuiz),
    };
  } catch (error) {
    logger.error("Erro ao buscar juízes (admin):", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar juízes",
    };
  }
}

// Buscar juiz por ID - APENAS JUÍZES PÚBLICOS GLOBAIS
export async function getJuizById(id: string): Promise<GetJuizResponse> {
  try {
    const juiz = await prisma.juiz.findFirst({
      where: {
        id,
        // SEGURANÇA: Apenas juízes públicos (globais) são visíveis
        isPublico: true,
      },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    if (!juiz) {
      return {
        success: false,
        error: "Juiz não encontrado",
      };
    }

    // Serializar para enviar ao cliente
    const juizSerializado = {
      ...juiz,
      precoAcesso: juiz.precoAcesso ? Number(juiz.precoAcesso) : null,
      dataNascimento: juiz.dataNascimento
        ? juiz.dataNascimento.toISOString()
        : null,
      dataPosse: juiz.dataPosse ? juiz.dataPosse.toISOString() : null,
      dataAposentadoria: juiz.dataAposentadoria
        ? juiz.dataAposentadoria.toISOString()
        : null,
      createdAt: juiz.createdAt.toISOString(),
      updatedAt: juiz.updatedAt.toISOString(),
    };

    return {
      success: true,
      data: juizSerializado,
    };
  } catch (error) {
    logger.error("Erro ao buscar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar juiz",
    };
  }
}

// Criar novo juiz - APENAS PARA SUPER ADMIN
export async function createJuiz(data: any, superAdminId: string) {
  try {
    const juiz = await prisma.juiz.create({
      data: {
        ...data,
        isPublico: data.isPublico ?? true, // Juízes são públicos por padrão
        isPremium: data.isPremium ?? false,
        superAdminId, // Controlado pelo super admin
      },
    });

    return {
      success: true,
      data: juiz,
    };
  } catch (error) {
    logger.error("Erro ao criar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao criar juiz",
    };
  }
}

// Atualizar juiz - APENAS PARA SUPER ADMIN
export async function updateJuiz(id: string, data: any, superAdminId: string) {
  try {
    // Verificar se o juiz existe e se o super admin tem permissão
    const juizExistente = await prisma.juiz.findFirst({
      where: {
        id,
        superAdminId, // Apenas o super admin que criou pode editar
      },
    });

    if (!juizExistente) {
      return {
        success: false,
        error: "Juiz não encontrado ou sem permissão para editar",
      };
    }

    const juiz = await prisma.juiz.update({
      where: { id },
      data,
    });

    return {
      success: true,
      data: juiz,
    };
  } catch (error) {
    logger.error("Erro ao atualizar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao atualizar juiz",
    };
  }
}

// Deletar juiz - APENAS PARA SUPER ADMIN
export async function deleteJuiz(id: string, superAdminId: string) {
  try {
    // Verificar se o juiz existe e se o super admin tem permissão
    const juizExistente = await prisma.juiz.findFirst({
      where: {
        id,
        superAdminId, // Apenas o super admin que criou pode deletar
      },
    });

    if (!juizExistente) {
      return {
        success: false,
        error: "Juiz não encontrado ou sem permissão para deletar",
      };
    }

    await prisma.juiz.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao deletar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao deletar juiz",
    };
  }
}

// Buscar dados para formulário (estados, especialidades, etc.)
export async function getJuizFormData() {
  try {
    // Buscar especialidades disponíveis
    const especialidades = Object.values(EspecialidadeJuridica);

    // Buscar níveis disponíveis
    const niveis = Object.values(JuizNivel);

    // Buscar status disponíveis
    const status = Object.values(JuizStatus);

    return {
      success: true,
      data: {
        especialidades,
        niveis,
        status,
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar dados do formulário:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// ========== NOVAS SERVER ACTIONS MULTI-TENANT COM AUDITORIA ==========

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "SUPER_ADMIN") {
    throw new Error(
      "Acesso negado. Apenas Super Admins podem gerenciar juízes globais.",
    );
  }

  return session.user.id;
}

async function ensureSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  const userId = (session.user as any)?.id;
  const tenantId = (session.user as any)?.tenantId;
  const userRole = (session.user as any)?.role;

  if (!userId) {
    throw new Error("Não autenticado");
  }

  return { userId, tenantId, userRole, session };
}

async function createAuditLog(
  tenantId: string,
  usuarioId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  dados?: any,
  previousValues?: any,
  changedFields?: string[],
) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        usuarioId,
        acao,
        entidade,
        entidadeId,
        dados: dados || {},
        previousValues: previousValues || {},
        changedFields: changedFields || [],
      },
    });
  } catch (error) {
    logger.error("Erro ao criar log de auditoria:", error);
  }
}

// Serializar juiz para o cliente (converter Decimal para string)
function serializeJuiz(juiz: any): JuizSerializado {
  const precoAcesso =
    juiz.precoAcesso !== null && juiz.precoAcesso !== undefined
      ? Number(juiz.precoAcesso)
      : null;

  return {
    ...juiz,
    precoAcesso,
    dataNascimento: juiz.dataNascimento
      ? juiz.dataNascimento.toISOString()
      : null,
    dataPosse: juiz.dataPosse ? juiz.dataPosse.toISOString() : null,
    dataAposentadoria: juiz.dataAposentadoria
      ? juiz.dataAposentadoria.toISOString()
      : null,
    createdAt: juiz.createdAt ? juiz.createdAt.toISOString() : null,
    updatedAt: juiz.updatedAt ? juiz.updatedAt.toISOString() : null,
    tribunal: juiz.tribunal
      ? {
          id: juiz.tribunal.id,
          nome: juiz.tribunal.nome,
          sigla: juiz.tribunal.sigla ?? null,
        }
      : null,
    _count: juiz._count
      ? {
          processos: juiz._count.processos ?? 0,
          julgamentos: juiz._count.julgamentos ?? 0,
          pacotes: juiz._count.pacotes ?? 0,
        }
      : undefined,
  };
}

// Criar juiz - Multi-tenant com auditoria
export async function createJuizTenant(
  data: JuizFormData,
): Promise<SaveJuizResponse> {
  try {
    const { userId, tenantId } = await ensureSession();

    if (!tenantId) {
      return {
        success: false,
        error: "Tenant não identificado",
      };
    }

    // Preparar dados para o banco (converter strings vazias para null)
    const preparedData = {
      ...data,
      nomeCompleto: data.nomeCompleto || null,
      cpf: data.cpf || null,
      oab: data.oab || null,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      cep: data.cep || null,
      comarca: data.comarca || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      biografia: data.biografia || null,
      formacao: data.formacao || null,
      experiencia: data.experiencia || null,
      foto: data.foto || null,
      isPublico: data.isPublico ?? false, // Juízes do tenant são privados por padrão
      isPremium: data.isPremium ?? false,
      superAdminId: null, // Não usa superAdminId para juízes de tenant
    };

    const juiz = await prisma.juiz.create({
      data: preparedData,
    });

    // Criar log de auditoria
    await createAuditLog(
      tenantId,
      userId,
      "CREATE",
      "Juiz",
      juiz.id,
      { ...data, id: juiz.id },
      null,
      Object.keys(data),
    );

    return {
      success: true,
      data: serializeJuiz(juiz),
    };
  } catch (error) {
    logger.error("Erro ao criar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao criar juiz",
    };
  }
}

// Atualizar juiz - Multi-tenant com auditoria
export async function updateJuizTenant(
  id: string,
  data: Partial<JuizFormData>,
): Promise<SaveJuizResponse> {
  try {
    const { userId, tenantId } = await ensureSession();

    if (!tenantId) {
      return {
        success: false,
        error: "Tenant não identificado",
      };
    }

    // DEBUG: Verificar dados recebidos
    logger.info("🔍 [updateJuizTenant] ID:", id);
    logger.info("🔍 [updateJuizTenant] Data recebida:", data);
    logger.info("🔍 [updateJuizTenant] OAB:", data.oab);

    // Buscar juiz atual para log de auditoria
    const juizAtual = await prisma.juiz.findUnique({
      where: { id },
    });

    if (!juizAtual) {
      return {
        success: false,
        error: "Juiz não encontrado",
      };
    }

    logger.info("🔍 [updateJuizTenant] Juiz atual OAB:", juizAtual.oab);

    // Preparar dados para o banco (converter strings vazias para null)
    const preparedData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        acc[key] = value === "" || value === undefined ? null : value;

        return acc;
      },
      {} as Record<string, any>,
    );

    // Atualizar juiz
    const juiz = await prisma.juiz.update({
      where: { id },
      data: preparedData,
    });

    logger.info("✅ [updateJuizTenant] Juiz atualizado OAB:", juiz.oab);

    // Identificar campos alterados
    const changedFields = Object.keys(data).filter((key) => {
      const dataKey = key as keyof Partial<JuizFormData>;

      return juizAtual[key as keyof typeof juizAtual] !== data[dataKey];
    });

    // Criar log de auditoria
    await createAuditLog(
      tenantId,
      userId,
      "UPDATE",
      "Juiz",
      juiz.id,
      data,
      juizAtual,
      changedFields,
    );

    return {
      success: true,
      data: serializeJuiz(juiz),
    };
  } catch (error) {
    logger.error("Erro ao atualizar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao atualizar juiz",
    };
  }
}

// Deletar juiz - Multi-tenant com auditoria
export async function deleteJuizTenant(id: string) {
  try {
    const { userId, tenantId } = await ensureSession();

    if (!tenantId) {
      return {
        success: false,
        error: "Tenant não identificado",
      };
    }

    // Buscar juiz antes de deletar para auditoria
    const juiz = await prisma.juiz.findUnique({
      where: { id },
    });

    if (!juiz) {
      return {
        success: false,
        error: "Juiz não encontrado",
      };
    }

    // Deletar juiz
    await prisma.juiz.delete({
      where: { id },
    });

    // Criar log de auditoria
    await createAuditLog(
      tenantId,
      userId,
      "DELETE",
      "Juiz",
      id,
      null,
      juiz,
      [],
    );

    return {
      success: true,
      message: "Juiz deletado com sucesso",
    };
  } catch (error) {
    logger.error("Erro ao deletar juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao deletar juiz",
    };
  }
}

// ========== UPLOAD DE FOTO DO JUIZ (IGUAL AO AVATAR DO USUÁRIO) ==========

export async function uploadJuizFoto(
  formData: FormData,
  juizId: string,
  juizNome: string,
): Promise<{ success: boolean; fotoUrl?: string; error?: string }> {
  try {
    const { userId, tenantId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const file = formData.get("file") as File;
    const url = formData.get("url") as string;

    let fotoUrl: string;

    if (url) {
      // Se for uma URL, validar e usar diretamente
      try {
        new URL(url);
        if (!/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
          return {
            success: false,
            error: "URL deve apontar para uma imagem válida",
          };
        }
        fotoUrl = url;
      } catch {
        return { success: false, error: "URL inválida" };
      }
    } else if (file) {
      // Se for um arquivo, fazer upload para Cloudinary
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP.",
        };
      }

      const maxSize = 5 * 1024 * 1024; // 5MB

      if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Máximo 5MB." };
      }

      // Converter para buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Usar o serviço de upload (mesma lógica do avatar)
      const { UploadService } = await import("@/lib/upload-service");
      const uploadService = UploadService.getInstance();

      // Estrutura: magiclawyer/juizes/{nome-juiz}-{juiz-id}/foto_{timestamp}
      const result = await uploadService.uploadJuizFoto(
        buffer,
        juizId,
        juizNome,
        file.name,
      );

      if (!result.success || !result.url) {
        return {
          success: false,
          error: result.error || "Erro ao fazer upload",
        };
      }

      fotoUrl = result.url;
    } else {
      return { success: false, error: "Nenhum arquivo ou URL fornecido" };
    }

    // Atualizar foto do juiz no banco de dados
    await prisma.juiz.update({
      where: { id: juizId },
      data: {
        foto: fotoUrl,
        updatedAt: new Date(),
      },
    });

    // Criar log de auditoria
    await createAuditLog(
      tenantId,
      userId,
      "UPDATE",
      "Juiz",
      juizId,
      { foto: fotoUrl },
      null,
      ["foto"],
    );

    return {
      success: true,
      fotoUrl,
    };
  } catch (error) {
    logger.error("Erro ao fazer upload da foto do juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

export async function deleteJuizFoto(
  juizId: string,
  fotoUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, tenantId } = await ensureSession();

    if (!tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    // Usar o serviço de upload para deletar (mesma lógica do avatar)
    const { UploadService } = await import("@/lib/upload-service");
    const uploadService = UploadService.getInstance();
    const result = await uploadService.deleteAvatar(fotoUrl, juizId);

    if (result.success) {
      // Atualizar no banco de dados
      await prisma.juiz.update({
        where: { id: juizId },
        data: {
          foto: null,
          updatedAt: new Date(),
        },
      });

      // Criar log de auditoria
      await createAuditLog(
        tenantId,
        userId,
        "UPDATE",
        "Juiz",
        juizId,
        { foto: null },
        { foto: fotoUrl },
        ["foto"],
      );

      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || "Erro ao deletar foto",
      };
    }
  } catch (error) {
    logger.error("Erro ao deletar foto do juiz:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
