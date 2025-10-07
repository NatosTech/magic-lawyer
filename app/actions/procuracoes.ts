"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ProcuracaoStatus, ProcuracaoEmitidaPor } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ProcuracaoCreateInput {
  numero?: string;
  arquivoUrl?: string;
  observacoes?: string;
  emitidaEm?: Date | string;
  validaAte?: Date | string;
  ativa?: boolean;
  status?: ProcuracaoStatus;
  emitidaPor?: ProcuracaoEmitidaPor;
  clienteId: string;
  processosIds?: string[]; // IDs dos processos a vincular
  outorgadosIds?: string[]; // IDs dos advogados outorgados
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
// ACTIONS - CRIAR PROCURAÇÃO
// ============================================

export async function createProcuracao(data: ProcuracaoCreateInput) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Validar cliente
    if (!data.clienteId) {
      return { success: false, error: "Cliente é obrigatório" };
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
    let advogadoLogadoId: string | null = null;
    if (user.role === "ADVOGADO") {
      advogadoLogadoId = await getAdvogadoIdFromSession(session);
      if (!advogadoLogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      const vinculo = await prisma.advogadoCliente.findFirst({
        where: {
          advogadoId: advogadoLogadoId,
          clienteId: cliente.id,
          tenantId: user.tenantId,
        },
      });

      if (!vinculo) {
        return { success: false, error: "Você não tem acesso a este cliente" };
      }
    }

    // Validar processos (se fornecidos)
    if (data.processosIds && data.processosIds.length > 0) {
      const processos = await prisma.processo.findMany({
        where: {
          id: { in: data.processosIds },
          clienteId: cliente.id,
          tenantId: user.tenantId,
          deletedAt: null,
        },
      });

      if (processos.length !== data.processosIds.length) {
        return { success: false, error: "Um ou mais processos inválidos" };
      }
    }

    // Validar outorgados (se fornecidos)
    if (data.outorgadosIds && data.outorgadosIds.length > 0) {
      const advogados = await prisma.advogado.findMany({
        where: {
          id: { in: data.outorgadosIds },
          tenantId: user.tenantId,
        },
      });

      if (advogados.length !== data.outorgadosIds.length) {
        return { success: false, error: "Um ou mais advogados inválidos" };
      }
    }

    // Criar procuração
    const procuracao = await prisma.procuracao.create({
      data: {
        tenantId: user.tenantId,
        clienteId: data.clienteId,
        numero: data.numero,
        arquivoUrl: data.arquivoUrl,
        observacoes: data.observacoes,
        emitidaEm: data.emitidaEm ? new Date(data.emitidaEm) : null,
        validaAte: data.validaAte ? new Date(data.validaAte) : null,
        ativa: data.ativa ?? true,
        status: data.status || ProcuracaoStatus.RASCUNHO,
        emitidaPor: data.emitidaPor || ProcuracaoEmitidaPor.ESCRITORIO,
        createdById: user.id,
        // Vincular processos
        processos:
          data.processosIds && data.processosIds.length > 0
            ? {
                create: data.processosIds.map((processoId) => ({
                  tenantId: user.tenantId,
                  processoId,
                })),
              }
            : undefined,
        // Vincular outorgados
        outorgados:
          data.outorgadosIds && data.outorgadosIds.length > 0
            ? {
                create: data.outorgadosIds.map((advogadoId) => ({
                  tenantId: user.tenantId,
                  advogadoId,
                })),
              }
            : undefined,
      },
      include: {
        cliente: true,
        processos: {
          include: {
            processo: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      procuracao,
    };
  } catch (error) {
    console.error("Erro ao criar procuração:", error);
    return {
      success: false,
      error: "Erro ao criar procuração",
    };
  }
}
