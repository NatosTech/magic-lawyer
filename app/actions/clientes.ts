"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { TipoPessoa, Prisma } from "@/app/generated/prisma";
import bcrypt from "bcryptjs";

// ============================================
// TYPES
// ============================================

export interface Cliente {
  id: string;
  tenantId: string;
  tipoPessoa: TipoPessoa;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  dataNascimento: Date | null;
  inscricaoEstadual: string | null;
  responsavelNome: string | null;
  responsavelEmail: string | null;
  responsavelTelefone: string | null;
  observacoes: string | null;
  usuarioId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    processos: number;
    contratos: number;
    documentos: number;
  };
}

export interface ClienteComProcessos extends Cliente {
  processos: {
    id: string;
    numero: string;
    titulo: string | null;
    status: string;
    areaId: string | null;
    valorCausa: number | null;
    dataDistribuicao: Date | null;
    prazoPrincipal: Date | null;
    createdAt: Date;
    area: {
      nome: string;
      slug: string;
    } | null;
    advogadoResponsavel: {
      id: string;
      usuario: {
        firstName: string | null;
        lastName: string | null;
      };
    } | null;
    _count: {
      documentos: number;
      eventos: number;
      movimentacoes: number;
      procuracoesVinculadas: number;
    };
  }[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getAdvogadoIdFromSession(session: any): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  // Buscar advogado vinculado ao usuário
  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: { id: true },
  });

  return advogado?.id || null;
}

async function getClienteIdFromSession(session: any): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  // Buscar cliente vinculado ao usuário
  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return cliente?.id || null;
}

// ============================================
// ACTIONS - LISTAGEM
// ============================================

/**
 * Busca clientes vinculados ao advogado logado
 */
export async function getClientesAdvogado(): Promise<{
  success: boolean;
  clientes?: Cliente[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Buscar ID do advogado
    const advogadoId = await getAdvogadoIdFromSession(session);
    if (!advogadoId) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Buscar clientes vinculados ao advogado
    const clientesRaw = await prisma.cliente.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        advogadoClientes: {
          some: {
            advogadoId: advogadoId,
          },
        },
      },
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return {
      success: true,
      clientes: clientesRaw,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes do advogado:", error);
    return {
      success: false,
      error: "Erro ao buscar clientes",
    };
  }
}

/**
 * Busca todos os clientes do tenant (para ADMIN)
 */
export async function getAllClientesTenant(): Promise<{
  success: boolean;
  clientes?: Cliente[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se é ADMIN
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado. Apenas administradores." };
    }

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const clientesRaw = await prisma.cliente.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return {
      success: true,
      clientes: clientesRaw,
    };
  } catch (error) {
    console.error("Erro ao buscar todos os clientes:", error);
    return {
      success: false,
      error: "Erro ao buscar clientes",
    };
  }
}

// ============================================
// ACTIONS - DETALHES
// ============================================

/**
 * Busca detalhes de um cliente específico com seus processos
 */
export async function getClienteComProcessos(clienteId: string): Promise<{
  success: boolean;
  cliente?: ClienteComProcessos;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Se não for ADMIN, verificar se é advogado vinculado ao cliente
    let whereClause: any = {
      id: clienteId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      whereClause.advogadoClientes = {
        some: {
          advogadoId: advogadoId,
        },
      };
    }

    const clienteRaw = await prisma.cliente.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
        processos: {
          where: {
            deletedAt: null,
          },
          include: {
            area: {
              select: {
                nome: true,
                slug: true,
              },
            },
            advogadoResponsavel: {
              select: {
                id: true,
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            _count: {
              select: {
                documentos: { where: { deletedAt: null } },
                eventos: true,
                movimentacoes: true,
                procuracoesVinculadas: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!clienteRaw) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Converter Decimal para number
    const cliente: ClienteComProcessos = {
      ...clienteRaw,
      processos: clienteRaw.processos.map((p) => ({
        ...p,
        valorCausa: p.valorCausa ? Number(p.valorCausa) : null,
      })),
    };

    return {
      success: true,
      cliente,
    };
  } catch (error) {
    console.error("Erro ao buscar cliente com processos:", error);
    return {
      success: false,
      error: "Erro ao buscar cliente",
    };
  }
}

/**
 * Busca cliente básico por ID (sem processos)
 */
export async function getClienteById(clienteId: string): Promise<{
  success: boolean;
  cliente?: Cliente;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    let whereClause: any = {
      id: clienteId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se não for ADMIN, verificar se é advogado vinculado
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      whereClause.advogadoClientes = {
        some: {
          advogadoId: advogadoId,
        },
      };
    }

    const cliente = await prisma.cliente.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    return {
      success: true,
      cliente,
    };
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return {
      success: false,
      error: "Erro ao buscar cliente",
    };
  }
}

// ============================================
// ACTIONS - CRIAR/EDITAR/DELETAR
// ============================================

export interface ClienteCreateInput {
  tipoPessoa: TipoPessoa;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  dataNascimento?: Date;
  inscricaoEstadual?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  responsavelTelefone?: string;
  observacoes?: string;
  advogadosIds?: string[]; // IDs dos advogados a vincular
  criarUsuario?: boolean; // Se deve criar usuário de acesso
}

/**
 * Gera uma senha aleatória segura
 */
function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * Criar novo cliente
 */
export async function createCliente(data: ClienteCreateInput): Promise<{
  success: boolean;
  cliente?: Cliente;
  usuario?: {
    email: string;
    senha: string;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se usuário tem permissão para criar clientes
    if (user.role !== "ADMIN" && user.role !== "ADVOGADO" && user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Sem permissão para criar clientes" };
    }

    const { advogadosIds, criarUsuario, ...clienteData } = data;

    // Validar email se for criar usuário
    if (criarUsuario && !clienteData.email) {
      return { success: false, error: "Email é obrigatório para criar usuário de acesso" };
    }

    let usuarioData = null;
    let usuarioId = null;
    let senhaGerada = null;

    // Criar usuário se solicitado
    if (criarUsuario && clienteData.email) {
      // Verificar se já existe usuário com esse email no tenant
      const usuarioExistente = await prisma.usuario.findFirst({
        where: {
          email: clienteData.email,
          tenantId: user.tenantId,
        },
      });

      if (usuarioExistente) {
        return { success: false, error: "Já existe um usuário com este email no sistema" };
      }

      // Gerar senha aleatória
      senhaGerada = generatePassword(12);
      const passwordHash = await bcrypt.hash(senhaGerada, 10);

      // Separar nome em firstName e lastName
      const nomePartes = clienteData.nome.trim().split(" ");
      const firstName = nomePartes[0];
      const lastName = nomePartes.slice(1).join(" ") || "";

      // Criar usuário
      const novoUsuario = await prisma.usuario.create({
        data: {
          email: clienteData.email,
          passwordHash,
          role: "CLIENTE",
          firstName,
          lastName,
          phone: clienteData.telefone || clienteData.celular,
          tenantId: user.tenantId,
          active: true,
          createdById: user.id,
        },
      });

      usuarioId = novoUsuario.id;
      usuarioData = {
        email: clienteData.email,
        senha: senhaGerada,
      };
    }

    // Criar cliente com relacionamentos
    const cliente = await prisma.cliente.create({
      data: {
        ...clienteData,
        tenantId: user.tenantId,
        usuarioId,
        advogadoClientes: advogadosIds
          ? {
              create: advogadosIds.map((advId) => ({
                advogadoId: advId,
                tenantId: user.tenantId,
              })),
            }
          : undefined,
      },
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      success: true,
      cliente,
      usuario: usuarioData || undefined,
    };
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return {
      success: false,
      error: "Erro ao criar cliente",
    };
  }
}

export interface ClienteUpdateInput {
  tipoPessoa?: TipoPessoa;
  nome?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  dataNascimento?: Date;
  inscricaoEstadual?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  responsavelTelefone?: string;
  observacoes?: string;
  advogadosIds?: string[]; // Se fornecido, substitui todos os vínculos
}

/**
 * Atualizar cliente existente
 */
export async function updateCliente(
  clienteId: string,
  data: ClienteUpdateInput
): Promise<{
  success: boolean;
  cliente?: Cliente;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se cliente existe e pertence ao tenant
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!existingCliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const { advogadosIds, ...clienteData } = data;

    // Atualizar cliente
    const updateData: any = { ...clienteData };

    // Se advogadosIds foi fornecido, atualizar relacionamentos
    if (advogadosIds !== undefined) {
      updateData.advogadoClientes = {
        deleteMany: {}, // Remove todos os vínculos atuais
        create: advogadosIds.map((advId) => ({
          advogadoId: advId,
          tenantId: user.tenantId,
        })),
      };
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: updateData,
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      success: true,
      cliente,
    };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return {
      success: false,
      error: "Erro ao atualizar cliente",
    };
  }
}

/**
 * Soft delete de cliente
 */
export async function deleteCliente(clienteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Apenas ADMIN pode deletar
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Sem permissão para deletar clientes" };
    }

    // Verificar se cliente existe
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!existingCliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Soft delete
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return {
      success: false,
      error: "Erro ao deletar cliente",
    };
  }
}

// ============================================
// ACTIONS - BUSCA E FILTROS
// ============================================

export interface ClientesFiltros {
  busca?: string;
  tipoPessoa?: TipoPessoa;
  temProcessos?: boolean;
}

/**
 * Busca clientes com filtros
 */
export async function searchClientes(filtros: ClientesFiltros = {}): Promise<{
  success: boolean;
  clientes?: Cliente[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const whereClause: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se não for ADMIN, filtrar apenas clientes do advogado
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Acesso negado" };
      }

      whereClause.advogadoClientes = {
        some: {
          advogadoId: advogadoId,
        },
      };
    }

    // Aplicar filtros
    if (filtros.busca) {
      whereClause.OR = [
        { nome: { contains: filtros.busca, mode: "insensitive" } },
        { email: { contains: filtros.busca, mode: "insensitive" } },
        { documento: { contains: filtros.busca, mode: "insensitive" } },
      ];
    }

    if (filtros.tipoPessoa) {
      whereClause.tipoPessoa = filtros.tipoPessoa;
    }

    if (filtros.temProcessos !== undefined) {
      if (filtros.temProcessos) {
        whereClause.processos = {
          some: {
            deletedAt: null,
          },
        };
      } else {
        whereClause.processos = {
          none: {},
        };
      }
    }

    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            processos: { where: { deletedAt: null } },
            contratos: true,
            documentos: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return {
      success: true,
      clientes,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes com filtros:", error);
    return {
      success: false,
      error: "Erro ao buscar clientes",
    };
  }
}
