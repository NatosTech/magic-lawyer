"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface DadosBancariosContrato {
  id: string;
  banco: {
    codigo: string;
    nome: string;
  };
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoContaBancaria: "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
  chavePix?: string;
  tipoChavePix?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  titularNome: string;
  titularDocumento: string;
  titularEmail?: string;
  titularTelefone?: string;
  principal: boolean;
  ativo: boolean;
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Busca os dados bancários de um contrato específico
 */
export async function getDadosBancariosContrato(contratoId: string): Promise<{
  success: boolean;
  dadosBancarios?: DadosBancariosContrato;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Buscar o contrato e verificar se pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
      },
      include: {
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Se não há dados bancários vinculados, buscar a conta principal do tenant
    let dadosBancarios = contrato.dadosBancarios;

    if (!dadosBancarios) {
      dadosBancarios = await prisma.dadosBancarios.findFirst({
        where: {
          tenantId,
          principal: true,
          ativo: true,
        },
        include: {
          banco: true,
        },
      });
    }

    return {
      success: true,
      dadosBancarios: dadosBancarios as DadosBancariosContrato,
    };
  } catch (error) {
    console.error("Erro ao buscar dados bancários do contrato:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Busca todas as contas bancárias disponíveis para um contrato
 */
export async function getContasDisponiveisContrato(
  contratoId: string,
): Promise<{
  success: boolean;
  contas?: DadosBancariosContrato[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;

    // Verificar se o contrato pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Buscar todas as contas bancárias ativas do tenant
    const contas = await prisma.dadosBancarios.findMany({
      where: {
        tenantId,
        ativo: true,
      },
      include: {
        banco: true,
      },
      orderBy: [
        { principal: "desc" }, // Conta principal primeiro
        { titularNome: "asc" },
      ],
    });

    return {
      success: true,
      contas: contas as DadosBancariosContrato[],
    };
  } catch (error) {
    console.error("Erro ao buscar contas disponíveis:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Vincula uma conta bancária a um contrato
 */
export async function vincularContaContrato(
  contratoId: string,
  dadosBancariosId: string,
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

    // Verificar se o contrato pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Verificar se a conta bancária pertence ao tenant
    const dadosBancarios = await prisma.dadosBancarios.findFirst({
      where: {
        id: dadosBancariosId,
        tenantId,
        ativo: true,
      },
    });

    if (!dadosBancarios) {
      return { success: false, error: "Conta bancária não encontrada" };
    }

    // Atualizar o contrato com a conta bancária
    await prisma.contrato.update({
      where: { id: contratoId },
      data: { dadosBancariosId },
    });

    revalidatePath(`/contratos`);
    revalidatePath(`/parcelas`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao vincular conta ao contrato:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
