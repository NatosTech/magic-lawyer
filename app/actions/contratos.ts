"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ContratoStatus } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ContratoCreateInput {
  titulo: string;
  descricao?: string;
  tipoContratoId?: string;
  modeloContratoId?: string;
  status?: ContratoStatus;
  valor?: number;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  clienteId: string;
  advogadoId?: string;
  processoId?: string;
  observacoes?: string;
}

// ============================================
// HELPERS
// ============================================

async function getSession() {
  return await auth();
}

async function getAdvogadoIdFromSession(session: any) {
  const user = session?.user;
  if (!user?.id) return null;

  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: user.id,
      tenantId: user.tenantId,
    },
  });

  return advogado?.id || null;
}

// ============================================
// ACTIONS - CRIAR CONTRATO
// ============================================

export async function createContrato(data: ContratoCreateInput) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Validar campos obrigatórios
    if (!data.titulo || !data.clienteId) {
      return { success: false, error: "Título e cliente são obrigatórios" };
    }

    // Validar acesso ao cliente
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: data.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Se for ADVOGADO, validar vínculo com o cliente
    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      const vinculo = await prisma.advogadoCliente.findFirst({
        where: {
          advogadoId,
          clienteId: cliente.id,
          tenantId: user.tenantId,
        },
      });

      if (!vinculo) {
        return { success: false, error: "Você não tem acesso a este cliente" };
      }

      // Se não informou advogado, usar o próprio
      if (!data.advogadoId) {
        data.advogadoId = advogadoId;
      }
    }

    // Criar contrato
    const contrato = await prisma.contrato.create({
      data: {
        tenantId: user.tenantId,
        titulo: data.titulo,
        descricao: data.descricao,
        tipoContratoId: data.tipoContratoId,
        modeloContratoId: data.modeloContratoId,
        status: data.status || ContratoStatus.RASCUNHO,
        valor: data.valor,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        clienteId: data.clienteId,
        advogadoId: data.advogadoId,
        processoId: data.processoId,
        observacoes: data.observacoes,
        createdById: user.id,
      },
      include: {
        cliente: true,
        tipo: true,
        modelo: true,
        advogado: {
          include: {
            usuario: true,
          },
        },
      },
    });

    return {
      success: true,
      contrato,
    };
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    return {
      success: false,
      error: "Erro ao criar contrato",
    };
  }
}
