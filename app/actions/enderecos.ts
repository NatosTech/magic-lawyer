"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { TipoEndereco } from "@/app/generated/prisma";

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

export interface EnderecoWithId extends EnderecoData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Buscar endereços do usuário atual
export async function getEnderecosUsuario(): Promise<{
  success: boolean;
  enderecos?: EnderecoWithId[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const enderecos = await prisma.endereco.findMany({
      where: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
      },
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
    console.error("Erro ao buscar endereços:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Criar novo endereço
export async function criarEndereco(data: EnderecoData): Promise<{
  success: boolean;
  endereco?: EnderecoWithId;
  error?: string;
}> {
  try {
    console.log("🔍 [criarEndereco] Iniciando criação de endereço");
    const session = await getServerSession(authOptions);
    console.log("👤 [criarEndereco] Sessão:", {
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      email: session?.user?.email,
    });

    if (!session?.user?.id) {
      console.error("❌ [criarEndereco] Usuário não autorizado");
      return { success: false, error: "Não autorizado" };
    }

    if (!session?.user?.tenantId) {
      console.error("❌ [criarEndereco] TenantId não encontrado na sessão");
      return { success: false, error: "TenantId não encontrado" };
    }

    // Validar dados obrigatórios
    if (!data.apelido?.trim()) {
      return { success: false, error: "Apelido é obrigatório" };
    }

    if (!data.logradouro?.trim()) {
      return { success: false, error: "Logradouro é obrigatório" };
    }

    if (!data.cidade?.trim()) {
      return { success: false, error: "Cidade é obrigatória" };
    }

    if (!data.estado?.trim()) {
      return { success: false, error: "Estado é obrigatório" };
    }

    // Se for endereço principal, desmarcar outros como principais
    if (data.principal) {
      await prisma.endereco.updateMany({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
          principal: true,
        },
        data: {
          principal: false,
        },
      });
    }

    // Verificar se já existe endereço com mesmo apelido
    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
        apelido: data.apelido.trim(),
      },
    });

    if (enderecoExistente) {
      return { success: false, error: "Já existe um endereço com este apelido" };
    }

    console.log("💾 [criarEndereco] Criando endereço no banco:", {
      tenantId: session.user.tenantId,
      usuarioId: session.user.id,
      apelido: data.apelido.trim(),
      tipo: data.tipo,
      principal: data.principal,
      logradouro: data.logradouro.trim(),
      cidade: data.cidade.trim(),
      estado: data.estado.trim(),
    });

    const endereco = await prisma.endereco.create({
      data: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
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

    console.log("✅ [criarEndereco] Endereço criado com sucesso:", endereco.id);

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
    console.error("💥 [criarEndereco] Erro ao criar endereço:", error);
    console.error("💥 [criarEndereco] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Atualizar endereço
export async function atualizarEndereco(
  enderecoId: string,
  data: EnderecoData
): Promise<{
  success: boolean;
  endereco?: EnderecoWithId;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Verificar se o endereço pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
      },
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Validar dados obrigatórios
    if (!data.apelido?.trim()) {
      return { success: false, error: "Apelido é obrigatório" };
    }

    if (!data.logradouro?.trim()) {
      return { success: false, error: "Logradouro é obrigatório" };
    }

    if (!data.cidade?.trim()) {
      return { success: false, error: "Cidade é obrigatória" };
    }

    if (!data.estado?.trim()) {
      return { success: false, error: "Estado é obrigatório" };
    }

    // Se for endereço principal, desmarcar outros como principais
    if (data.principal && !enderecoExistente.principal) {
      await prisma.endereco.updateMany({
        where: {
          tenantId: session.user.tenantId,
          usuarioId: session.user.id,
          principal: true,
        },
        data: {
          principal: false,
        },
      });
    }

    // Verificar se já existe outro endereço com mesmo apelido
    const apelidoExistente = await prisma.endereco.findFirst({
      where: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
        apelido: data.apelido.trim(),
        id: { not: enderecoId },
      },
    });

    if (apelidoExistente) {
      return { success: false, error: "Já existe um endereço com este apelido" };
    }

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
        updatedAt: new Date(),
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
    console.error("Erro ao atualizar endereço:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Deletar endereço
export async function deletarEndereco(enderecoId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Verificar se o endereço pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
      },
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Não permitir deletar se for o único endereço
    const totalEnderecos = await prisma.endereco.count({
      where: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
      },
    });

    if (totalEnderecos <= 1) {
      return { success: false, error: "Não é possível deletar o único endereço" };
    }

    await prisma.endereco.delete({
      where: { id: enderecoId },
    });

    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar endereço:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Definir endereço como principal
export async function definirEnderecoPrincipal(enderecoId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    // Verificar se o endereço pertence ao usuário
    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
      },
    });

    if (!enderecoExistente) {
      return { success: false, error: "Endereço não encontrado" };
    }

    // Desmarcar todos os outros como principais
    await prisma.endereco.updateMany({
      where: {
        tenantId: session.user.tenantId,
        usuarioId: session.user.id,
        principal: true,
      },
      data: {
        principal: false,
      },
    });

    // Marcar o selecionado como principal
    await prisma.endereco.update({
      where: { id: enderecoId },
      data: {
        principal: true,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/usuario/perfil/editar");

    return { success: true };
  } catch (error) {
    console.error("Erro ao definir endereço principal:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
