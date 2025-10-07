"use server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma, { toNumber } from "@/app/lib/prisma";
import { ContratoStatus } from "@/app/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ContratoCreateInput {
  titulo: string;
  resumo?: string;
  tipoContratoId?: string;
  modeloContratoId?: string;
  status?: ContratoStatus;
  valor?: number;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  clienteId: string;
  advogadoId?: string;
  processoId?: string;
  procuracaoId?: string; // Nova opção para vincular diretamente a uma procuração
  observacoes?: string;
}

// ============================================
// HELPERS
// ============================================

async function getSession() {
  return await getServerSession(authOptions);
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
// ACTIONS - BUSCAR PROCURAÇÕES
// ============================================

export async function getProcuracoesDisponiveis(clienteId: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const user = session.user;
  const tenantId = user.tenantId;

  try {
    // Buscar procurações ativas do cliente
    const procuracoes = await prisma.procuracao.findMany({
      where: {
        tenantId,
        clienteId,
        ativa: true,
      },
      include: {
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
        outorgados: {
          include: {
            advogado: {
              select: {
                id: true,
                oabNumero: true,
                oabUf: true,
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return procuracoes;
  } catch (error) {
    console.error("Erro ao buscar procurações:", error);
    throw new Error("Erro ao buscar procurações disponíveis");
  }
}

export async function vincularContratoProcuracao(contratoId: string, procuracaoId: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const user = session.user;
  const tenantId = user.tenantId;

  try {
    // Verificar se o contrato existe e pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
        deletedAt: null,
      },
      include: {
        processo: true,
      },
    });

    if (!contrato) {
      throw new Error("Contrato não encontrado");
    }

    // Verificar se a procuração existe e está ativa
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId,
        ativa: true,
      },
      include: {
        processos: {
          include: {
            processo: true,
          },
        },
      },
    });

    if (!procuracao) {
      throw new Error("Procuração não encontrada ou inativa");
    }

    // Se o contrato já tem um processo vinculado, verificar se é compatível
    if (contrato.processoId) {
      const processoVinculado = procuracao.processos.find((pp) => pp.processoId === contrato.processoId);

      if (!processoVinculado) {
        throw new Error("A procuração não está vinculada ao processo do contrato");
      }
    } else {
      // Se o contrato não tem processo, vincular ao primeiro processo da procuração
      if (procuracao.processos.length > 0) {
        await prisma.contrato.update({
          where: { id: contratoId },
          data: {
            processoId: procuracao.processos[0].processoId,
          },
        });
      }
    }

    return {
      success: true,
      message: "Contrato vinculado à procuração com sucesso",
    };
  } catch (error) {
    console.error("Erro ao vincular contrato à procuração:", error);
    throw error;
  }
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

    // Se foi especificada uma procuração, buscar o processo vinculado
    let processoId = data.processoId;

    if (data.procuracaoId && !processoId) {
      const procuracao = await prisma.procuracao.findFirst({
        where: {
          id: data.procuracaoId,
          tenantId: user.tenantId,
          ativa: true,
        },
        include: {
          processos: {
            take: 1, // Pegar o primeiro processo
          },
        },
      });

      if (procuracao?.processos && procuracao.processos.length > 0) {
        processoId = procuracao.processos[0].processoId;
      }
    }

    // Criar contrato
    const contrato = await prisma.contrato.create({
      data: {
        tenantId: user.tenantId,
        titulo: data.titulo,
        resumo: data.resumo,
        tipoId: data.tipoContratoId,
        modeloId: data.modeloContratoId,
        status: data.status || ContratoStatus.RASCUNHO,
        valor: data.valor,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        clienteId: data.clienteId,
        advogadoResponsavelId: data.advogadoId,
        processoId,
        observacoes: data.observacoes,
        criadoPorId: user.id,
      },
      include: {
        cliente: true,
        tipo: true,
        modelo: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
      },
    });

    // Converter Decimals para number antes de retornar
    const contratoSerializado = {
      ...contrato,
      valor: toNumber(contrato.valor),
      comissaoAdvogado: toNumber(contrato.comissaoAdvogado),
      percentualAcaoGanha: toNumber(contrato.percentualAcaoGanha),
      valorAcaoGanha: toNumber(contrato.valorAcaoGanha),
      advogadoResponsavel: contrato.advogadoResponsavel
        ? {
            ...contrato.advogadoResponsavel,
            comissaoPadrao: toNumber(contrato.advogadoResponsavel.comissaoPadrao),
            comissaoAcaoGanha: toNumber(contrato.advogadoResponsavel.comissaoAcaoGanha),
            comissaoHonorarios: toNumber(contrato.advogadoResponsavel.comissaoHonorarios),
          }
        : null,
    };

    return {
      success: true,
      contrato: contratoSerializado,
    };
  } catch (error) {
    console.error("Erro ao criar contrato:", error);

    return {
      success: false,
      error: "Erro ao criar contrato",
    };
  }
}
