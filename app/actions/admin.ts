"use server";

import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";

// =============================================
// TENANT MANAGEMENT
// =============================================

export interface CreateTenantData {
  name: string;
  slug: string;
  domain?: string;
  email: string;
  telefone?: string;
  documento?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  tipoPessoa: "FISICA" | "JURIDICA";
  timezone?: string;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface TenantResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Criar novo tenant
export async function createTenant(
  data: CreateTenantData,
  superAdminId: string,
): Promise<TenantResponse> {
  try {
    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existingTenant) {
      return {
        success: false,
        error: "Slug já existe. Escolha outro slug.",
      };
    }

    // Hash da senha do admin
    const passwordHash = await bcrypt.hash(data.adminUser.password, 12);

    // Criar tenant e admin em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          domain: data.domain,
          email: data.email,
          telefone: data.telefone,
          documento: data.documento,
          razaoSocial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia,
          tipoPessoa: data.tipoPessoa,
          timezone: data.timezone || "America/Sao_Paulo",
          status: "ACTIVE",
          superAdminId, // Vinculado ao super admin
        },
      });

      // Criar usuário admin do tenant
      const adminUser = await tx.usuario.create({
        data: {
          tenantId: tenant.id,
          email: data.adminUser.email,
          passwordHash,
          firstName: data.adminUser.firstName,
          lastName: data.adminUser.lastName,
          role: "ADMIN",
          active: true,
        },
      });

      // Criar branding padrão
      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          primaryColor: "#2563eb",
          secondaryColor: "#1d4ed8",
          accentColor: "#3b82f6",
        },
      });

      return { tenant, adminUser };
    });

    // Log de auditoria
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        acao: "CREATE_TENANT",
        entidade: "TENANT",
        entidadeId: result.tenant.id,
        dadosNovos: {
          tenantName: result.tenant.name,
          tenantSlug: result.tenant.slug,
          adminEmail: data.adminUser.email,
        },
      },
    });

    return {
      success: true,
      data: {
        tenant: result.tenant,
        adminUser: {
          id: result.adminUser.id,
          email: result.adminUser.email,
          name: `${result.adminUser.firstName} ${result.adminUser.lastName}`,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao criar tenant:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao criar tenant",
    };
  }
}

// Listar todos os tenants
export async function getAllTenants(): Promise<TenantResponse> {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        superAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branding: true,
        subscription: {
          include: {
            plano: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            processos: true,
            clientes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: tenants,
    };
  } catch (error) {
    console.error("Erro ao buscar tenants:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar tenants",
    };
  }
}

// Atualizar status do tenant
export async function updateTenantStatus(
  tenantId: string,
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED",
  superAdminId: string,
): Promise<TenantResponse> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return {
        success: false,
        error: "Tenant não encontrado",
      };
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    // Log de auditoria
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        acao: "UPDATE_TENANT_STATUS",
        entidade: "TENANT",
        entidadeId: tenantId,
        dadosAntigos: { status: tenant.status },
        dadosNovos: { status },
      },
    });

    return {
      success: true,
      data: updatedTenant,
    };
  } catch (error) {
    console.error("Erro ao atualizar status do tenant:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao atualizar tenant",
    };
  }
}

// =============================================
// JUIZ MANAGEMENT
// =============================================

export interface CreateJuizData {
  nome: string;
  nomeCompleto?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  dataNascimento?: Date;
  dataPosse?: Date;
  status: "ATIVO" | "INATIVO" | "APOSENTADO";
  nivel:
    | "JUIZ_SUBSTITUTO"
    | "JUIZ_TITULAR"
    | "DESEMBARGADOR"
    | "MINISTRO"
    | "OUTROS";
  especialidades: string[];
  vara?: string;
  comarca?: string;
  biografia?: string;
  formacao?: string;
  experiencia?: string;
  premios?: string;
  publicacoes?: string;
  foto?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  observacoes?: string;
  isPublico: boolean;
  isPremium: boolean;
  precoAcesso?: number;
  tribunalId?: string;
}

// Criar novo juiz global
export async function createJuizGlobal(
  data: CreateJuizData,
  superAdminId: string,
): Promise<TenantResponse> {
  try {
    const juiz = await prisma.juiz.create({
      data: {
        ...data,
        superAdminId, // Controlado pelo super admin
        tribunalId: data.tribunalId || null,
      },
    });

    // Log de auditoria
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        acao: "CREATE_JUIZ",
        entidade: "JUIZ",
        entidadeId: juiz.id,
        dadosNovos: {
          nome: juiz.nome,
          isPublico: juiz.isPublico,
          isPremium: juiz.isPremium,
        },
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

// Listar todos os juízes (globais e privados)
export async function getAllJuizes(): Promise<TenantResponse> {
  try {
    const juizes = await prisma.juiz.findMany({
      include: {
        superAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tribunal: {
          select: {
            nome: true,
            sigla: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
          },
        },
      },
      orderBy: [{ isPublico: "desc" }, { createdAt: "desc" }],
    });

    return {
      success: true,
      data: juizes,
    };
  } catch (error) {
    console.error("Erro ao buscar juízes:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar juízes",
    };
  }
}

// Atualizar juiz
export async function updateJuizGlobal(
  juizId: string,
  data: Partial<CreateJuizData>,
  superAdminId: string,
): Promise<TenantResponse> {
  try {
    // Verificar se o juiz existe e se o super admin tem permissão
    const juizExistente = await prisma.juiz.findFirst({
      where: {
        id: juizId,
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
      where: { id: juizId },
      data,
    });

    // Log de auditoria
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        acao: "UPDATE_JUIZ",
        entidade: "JUIZ",
        entidadeId: juizId,
        dadosAntigos: juizExistente,
        dadosNovos: juiz,
      },
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

// =============================================
// AUDIT LOGS
// =============================================

// Buscar logs de auditoria
export async function getAuditLogs(
  superAdminId: string,
  limit: number = 50,
): Promise<TenantResponse> {
  try {
    const logs = await prisma.superAdminAuditLog.findMany({
      where: { superAdminId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);

    return {
      success: false,
      error: "Erro interno do servidor ao buscar logs",
    };
  }
}
