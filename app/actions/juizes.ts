"use server";

import { prisma } from "@/app/lib/prisma";
import { EspecialidadeJuridica, JuizStatus, JuizNivel } from "@/app/generated/prisma";

export interface JuizFilters {
  search?: string;
  status?: JuizStatus;
  especialidade?: EspecialidadeJuridica;
  nivel?: JuizNivel;
  isPublico?: boolean;
  isPremium?: boolean;
}

export interface GetJuizesResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface GetJuizResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Buscar juízes com filtros - APENAS JUÍZES PÚBLICOS GLOBAIS
export async function getJuizes(filters?: JuizFilters): Promise<GetJuizesResponse> {
  try {
    const where: any = {
      // SEGURANÇA: Apenas juízes públicos (globais) são visíveis
      isPublico: true,
    };

    // Filtro por busca textual
    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: "insensitive" } },
        { nomeCompleto: { contains: filters.search, mode: "insensitive" } },
        { vara: { contains: filters.search, mode: "insensitive" } },
        { comarca: { contains: filters.search, mode: "insensitive" } },
        { biografia: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtro por especialidade
    if (filters?.especialidade) {
      where.especialidades = {
        has: filters.especialidade,
      };
    }

    // Filtro por nível
    if (filters?.nivel) {
      where.nivel = filters.nivel;
    }

    // Filtro por premium (mantém isPublico = true sempre)
    if (filters?.isPremium !== undefined) {
      where.isPremium = filters.isPremium;
    }

    const juizes = await prisma.juiz.findMany({
      where,
      orderBy: [
        { isPublico: "desc" }, // Públicos primeiro
        { nome: "asc" },
      ],
      select: {
        id: true,
        nome: true,
        nomeCompleto: true,
        cpf: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        dataNascimento: true,
        dataPosse: true,
        dataAposentadoria: true,
        status: true,
        nivel: true,
        especialidades: true,
        vara: true,
        comarca: true,
        biografia: true,
        formacao: true,
        experiencia: true,
        premios: true,
        publicacoes: true,
        foto: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        observacoes: true,
        isPublico: true,
        isPremium: true,
        precoAcesso: true,
        createdAt: true,
        updatedAt: true,
        superAdminId: true,
        tribunalId: true,
      },
    });

    // Converter Decimal para number para serialização
    const juizesSerializados = juizes.map((juiz) => ({
      ...juiz,
      precoAcesso: juiz.precoAcesso ? Number(juiz.precoAcesso) : null,
    }));

    return {
      success: true,
      data: juizesSerializados,
    };
  } catch (error) {
    console.error("Erro ao buscar juízes:", error);
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
      select: {
        id: true,
        nome: true,
        nomeCompleto: true,
        cpf: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        dataNascimento: true,
        dataPosse: true,
        dataAposentadoria: true,
        status: true,
        nivel: true,
        especialidades: true,
        vara: true,
        comarca: true,
        biografia: true,
        formacao: true,
        experiencia: true,
        premios: true,
        publicacoes: true,
        foto: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        observacoes: true,
        isPublico: true,
        isPremium: true,
        precoAcesso: true,
        createdAt: true,
        updatedAt: true,
        superAdminId: true,
        tribunalId: true,
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

    // Converter Decimal para number para serialização
    const juizSerializado = {
      ...juiz,
      precoAcesso: juiz.precoAcesso ? Number(juiz.precoAcesso) : null,
    };

    return {
      success: true,
      data: juizSerializado,
    };
  } catch (error) {
    console.error("Erro ao buscar juiz:", error);
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
    console.error("Erro ao criar juiz:", error);
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
    console.error("Erro ao atualizar juiz:", error);
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
    console.error("Erro ao deletar juiz:", error);
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
    console.error("Erro ao buscar dados do formulário:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
