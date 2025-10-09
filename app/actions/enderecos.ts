"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import { authOptions } from "../../auth";
import prisma from "../lib/prisma";
import { TipoEndereco } from "../generated/prisma";

import logger from "@/lib/logger";

// Tipos simples
export interface EnderecoData {
  apelido: string;
  tipo: TipoEndereco;
  principal: boolean;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  pais?: string;
  telefone?: string;
  observacoes?: string;
}

export interface EnderecoWithId {
  id: string;
  apelido: string;
  tipo: TipoEndereco;
  principal: boolean;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  cep: string | null;
  pais: string | null;
  telefone: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Função auxiliar para obter o ID correto (clienteId ou usuarioId)
async function getCorrectId(user: any) {
  const isCliente = user.role === "CLIENTE";

  if (isCliente) {
    // Para clientes, buscar o clienteId na tabela Cliente
    const cliente = await prisma.cliente.findFirst({
      where: {
        usuarioId: user.id,
        tenantId: user.tenantId,
      },
    });

    return { isCliente: true, id: cliente?.id };
  } else {
    // Para usuários normais, usar o usuarioId diretamente
    return { isCliente: false, id: user.id };
  }
}

// Buscar endereços do usuário
export async function getEnderecosUsuario() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id || !user?.tenantId) {
      return { success: false, error: "Não autorizado", enderecos: [] };
    }

    const { isCliente, id } = await getCorrectId(user);

    if (!id) {
      return { success: false, error: "Usuário não encontrado", enderecos: [] };
    }

    const whereClause = {
      tenantId: user.tenantId,
      ...(isCliente ? { clienteId: id } : { usuarioId: id }),
    };

    const enderecos = await prisma.endereco.findMany({
      where: whereClause,
      orderBy: [{ principal: "desc" }, { createdAt: "desc" }],
    });

    return {
      success: true,
      enderecos: enderecos.map((endereco) => ({
        id: endereco.id,
        apelido: endereco.apelido,
        tipo: endereco.tipo,
        principal: endereco.principal,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        pais: endereco.pais,
        telefone: endereco.telefone,
        observacoes: endereco.observacoes,
        createdAt: endereco.createdAt,
        updatedAt: endereco.updatedAt,
      })),
    };
  } catch (error) {
    logger.error("Erro ao buscar endereços:", error);

    return { success: false, error: "Erro interno do servidor", enderecos: [] };
  }
}

// Criar novo endereço
export async function criarEndereco(data: EnderecoData) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id || !user?.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    // Validar dados obrigatórios
    if (
      !data.apelido?.trim() ||
      !data.logradouro?.trim() ||
      !data.cidade?.trim() ||
      !data.estado?.trim()
    ) {
      return { success: false, error: "Dados obrigatórios não preenchidos" };
    }

    const { isCliente, id } = await getCorrectId(user);

    if (!id) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Verificar se já existe endereço com mesmo apelido
    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        tenantId: user.tenantId,
        apelido: data.apelido.trim(),
        ...(isCliente ? { clienteId: id } : { usuarioId: id }),
      },
    });

    if (enderecoExistente) {
      return {
        success: false,
        error: "Já existe um endereço com este apelido",
      };
    }

    // Se for principal, desmarcar outros
    if (data.principal) {
      await prisma.endereco.updateMany({
        where: {
          tenantId: user.tenantId,
          principal: true,
          ...(isCliente ? { clienteId: id } : { usuarioId: id }),
        },
        data: { principal: false },
      });
    }

    // Criar endereço
    const endereco = await prisma.endereco.create({
      data: {
        tenantId: user.tenantId,
        apelido: data.apelido.trim(),
        tipo: data.tipo,
        principal: data.principal,
        logradouro: data.logradouro.trim(),
        numero: data.numero?.trim() || null,
        complemento: data.complemento?.trim() || null,
        bairro: data.bairro?.trim() || null,
        cidade: data.cidade.trim(),
        estado: data.estado.trim(),
        cep: data.cep?.trim() || null,
        pais: data.pais?.trim() || "Brasil",
        telefone: data.telefone?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
        ...(isCliente ? { clienteId: id } : { usuarioId: id }),
      },
    });

    revalidatePath("/usuario/perfil/editar");

    return {
      success: true,
      endereco: {
        id: endereco.id,
        apelido: endereco.apelido,
        tipo: endereco.tipo,
        principal: endereco.principal,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        pais: endereco.pais,
        telefone: endereco.telefone,
        observacoes: endereco.observacoes,
        createdAt: endereco.createdAt,
        updatedAt: endereco.updatedAt,
      },
    };
  } catch (error) {
    logger.error("Erro ao criar endereço:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}

// Atualizar endereço
export async function atualizarEndereco(
  enderecoId: string,
  data: EnderecoData,
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id || !user?.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const { isCliente, id } = await getCorrectId(user);

    if (!id) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const whereClause = {
      id: enderecoId,
      tenantId: user.tenantId,
      ...(isCliente ? { clienteId: id } : { usuarioId: id }),
    };

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: whereClause,
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Validar dados obrigatórios
    if (
      !data.apelido?.trim() ||
      !data.logradouro?.trim() ||
      !data.cidade?.trim() ||
      !data.estado?.trim()
    ) {
      return { success: false, error: "Dados obrigatórios não preenchidos" };
    }

    // Verificar se já existe outro endereço com mesmo apelido
    const apelidoExistente = await prisma.endereco.findFirst({
      where: {
        tenantId: user.tenantId,
        apelido: data.apelido.trim(),
        id: { not: enderecoId },
        ...(isCliente ? { clienteId: id } : { usuarioId: id }),
      },
    });

    if (apelidoExistente) {
      return {
        success: false,
        error: "Já existe um endereço com este apelido",
      };
    }

    // Se for principal, desmarcar outros
    if (data.principal && !enderecoExistente.principal) {
      await prisma.endereco.updateMany({
        where: {
          tenantId: user.tenantId,
          principal: true,
          ...(isCliente ? { clienteId: id } : { usuarioId: id }),
        },
        data: { principal: false },
      });
    }

    // Atualizar endereço
    const endereco = await prisma.endereco.update({
      where: { id: enderecoId },
      data: {
        apelido: data.apelido.trim(),
        tipo: data.tipo,
        principal: data.principal,
        logradouro: data.logradouro.trim(),
        numero: data.numero?.trim() || null,
        complemento: data.complemento?.trim() || null,
        bairro: data.bairro?.trim() || null,
        cidade: data.cidade.trim(),
        estado: data.estado.trim(),
        cep: data.cep?.trim() || null,
        pais: data.pais?.trim() || "Brasil",
        telefone: data.telefone?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
      },
    });

    revalidatePath("/usuario/perfil/editar");

    return {
      success: true,
      endereco: {
        id: endereco.id,
        apelido: endereco.apelido,
        tipo: endereco.tipo,
        principal: endereco.principal,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        pais: endereco.pais,
        telefone: endereco.telefone,
        observacoes: endereco.observacoes,
        createdAt: endereco.createdAt,
        updatedAt: endereco.updatedAt,
      },
    };
  } catch (error) {
    logger.error("Erro ao atualizar endereço:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}

// Deletar endereço
export async function deletarEndereco(enderecoId: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id || !user?.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const { isCliente, id } = await getCorrectId(user);

    if (!id) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const whereClause = {
      id: enderecoId,
      tenantId: user.tenantId,
      ...(isCliente ? { clienteId: id } : { usuarioId: id }),
    };

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: whereClause,
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Verificar se é o único endereço
    const totalEnderecos = await prisma.endereco.count({
      where: {
        tenantId: user.tenantId,
        ...(isCliente ? { clienteId: id } : { usuarioId: id }),
      },
    });

    if (totalEnderecos <= 1) {
      return {
        success: false,
        error: "Não é possível deletar o único endereço",
      };
    }

    // Deletar endereço
    await prisma.endereco.delete({
      where: { id: enderecoId },
    });

    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar endereço:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}

// Definir endereço como principal
export async function definirEnderecoPrincipal(enderecoId: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id || !user?.tenantId) {
      return { success: false, error: "Não autorizado" };
    }

    const { isCliente, id } = await getCorrectId(user);

    if (!id) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const whereClause = {
      id: enderecoId,
      tenantId: user.tenantId,
      ...(isCliente ? { clienteId: id } : { usuarioId: id }),
    };

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: whereClause,
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Desmarcar todos os outros como principais
    await prisma.endereco.updateMany({
      where: {
        tenantId: user.tenantId,
        principal: true,
        ...(isCliente ? { clienteId: id } : { usuarioId: id }),
      },
      data: { principal: false },
    });

    // Marcar o selecionado como principal
    await prisma.endereco.update({
      where: { id: enderecoId },
      data: { principal: true },
    });

    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao definir endereço principal:", error);

    return { success: false, error: "Erro interno do servidor" };
  }
}
