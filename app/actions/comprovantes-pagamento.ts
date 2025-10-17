"use server";

import { writeFile, unlink } from "fs/promises";
import { join } from "path";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
// import { v4 as uuidv4 } from "uuid";
const uuidv4 = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface ComprovantePagamento {
  id: string;
  parcelaId: string;
  nome: string;
  url: string;
  tamanho: number;
  tipo: string;
  dataUpload: Date;
  status: "pendente" | "aprovado" | "rejeitado";
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Upload de comprovante de pagamento
 */
export async function uploadComprovantePagamento(
  parcelaId: string,
  file: File,
): Promise<{
  success: boolean;
  comprovante?: ComprovantePagamento;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Verificar se a parcela pertence ao tenant
    const parcela = await prisma.parcelaContrato.findFirst({
      where: {
        id: parcelaId,
        contrato: {
          tenantId,
        },
      },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Validar arquivo
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      return { success: false, error: "Arquivo muito grande. Máximo 10MB." };
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Tipo de arquivo não permitido." };
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadPath = join(process.cwd(), "public", "uploads", "comprovantes");
    const filePath = join(uploadPath, fileName);

    // Criar diretório se não existir
    const { mkdir } = await import("fs/promises");

    try {
      await mkdir(uploadPath, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // Salvar no banco
    const comprovante = await prisma.comprovantePagamento.create({
      data: {
        parcelaId,
        nome: file.name,
        url: `/uploads/comprovantes/${fileName}`,
        tamanho: file.size,
        tipo: file.type,
        status: "pendente",
      },
    });

    revalidatePath(`/parcelas`);

    return {
      success: true,
      comprovante: comprovante as ComprovantePagamento,
    };
  } catch (error) {
    console.error("Erro no upload do comprovante:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Buscar comprovantes de uma parcela
 */
export async function getComprovantesParcela(parcelaId: string): Promise<{
  success: boolean;
  comprovantes?: ComprovantePagamento[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Verificar se a parcela pertence ao tenant
    const parcela = await prisma.parcelaContrato.findFirst({
      where: {
        id: parcelaId,
        contrato: {
          tenantId,
        },
      },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Buscar comprovantes
    const comprovantes = await prisma.comprovantePagamento.findMany({
      where: { parcelaId },
      orderBy: { dataUpload: "desc" },
    });

    return {
      success: true,
      comprovantes: comprovantes as ComprovantePagamento[],
    };
  } catch (error) {
    console.error("Erro ao buscar comprovantes:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Deletar comprovante
 */
export async function deleteComprovantePagamento(
  comprovanteId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Buscar o comprovante e verificar se pertence ao tenant
    const comprovante = await prisma.comprovantePagamento.findFirst({
      where: {
        id: comprovanteId,
        parcelaContrato: {
          contrato: {
            tenantId,
          },
        },
      },
    });

    if (!comprovante) {
      return { success: false, error: "Comprovante não encontrado" };
    }

    // Remover arquivo físico
    try {
      const filePath = join(process.cwd(), "public", comprovante.url);

      await unlink(filePath);
    } catch (error) {
      console.warn("Erro ao remover arquivo físico:", error);
    }

    // Remover do banco
    await prisma.comprovantePagamento.delete({
      where: { id: comprovanteId },
    });

    revalidatePath(`/parcelas`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar comprovante:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Alterar status do comprovante
 */
export async function alterarStatusComprovante(
  comprovanteId: string,
  status: "pendente" | "aprovado" | "rejeitado",
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Buscar o comprovante e verificar se pertence ao tenant
    const comprovante = await prisma.comprovantePagamento.findFirst({
      where: {
        id: comprovanteId,
        parcelaContrato: {
          contrato: {
            tenantId,
          },
        },
      },
    });

    if (!comprovante) {
      return { success: false, error: "Comprovante não encontrado" };
    }

    // Atualizar status
    await prisma.comprovantePagamento.update({
      where: { id: comprovanteId },
      data: { status },
    });

    revalidatePath(`/parcelas`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status do comprovante:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
