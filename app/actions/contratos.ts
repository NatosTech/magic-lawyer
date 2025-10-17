"use server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
import { ContratoStatus } from "@/app/generated/prisma";
import logger from "@/lib/logger";

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
  dadosBancariosId?: string;
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
    logger.error("Erro ao buscar procurações:", error);
    throw new Error("Erro ao buscar procurações disponíveis");
  }
}

/**
 * Vincula uma procuração a um contrato através do processo
 *
 * Lógica:
 * - Se o contrato JÁ tem um processo: valida se a procuração está vinculada a esse processo
 * - Se o contrato NÃO tem processo: vincula o contrato ao primeiro processo da procuração
 * - Se a procuração não tem processos: retorna erro
 */
export async function vincularContratoProcuracao(
  contratoId: string,
  procuracaoId: string,
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
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
        processo: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
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
            processo: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        },
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada ou inativa" };
    }

    // Caso 1: Contrato JÁ tem um processo vinculado
    if (contrato.processoId) {
      const processoVinculado = procuracao.processos.find(
        (pp) => pp.processoId === contrato.processoId,
      );

      if (!processoVinculado) {
        return {
          success: false,
          error: `Este contrato está vinculado ao processo ${contrato.processo?.numero}, mas a procuração selecionada não está vinculada a este processo. Primeiro vincule a procuração ao processo.`,
        };
      }

      // Processo já está vinculado e procuração também está nesse processo
      return {
        success: true,
        message: `Vinculação confirmada! O contrato e a procuração já estão conectados através do processo ${contrato.processo?.numero}`,
      };
    }

    // Caso 2: Contrato NÃO tem processo - vamos vincular ao primeiro processo da procuração
    if (procuracao.processos.length === 0) {
      return {
        success: false,
        error:
          "Esta procuração não está vinculada a nenhum processo. Primeiro vincule a procuração a um processo.",
      };
    }

    // Vincular o contrato ao primeiro processo da procuração
    const processoParaVincular = procuracao.processos[0];

    await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        processoId: processoParaVincular.processoId,
      },
    });

    return {
      success: true,
      message: `Contrato vinculado com sucesso ao processo ${processoParaVincular.processo.numero}! Agora o contrato e a procuração estão conectados.`,
    };
  } catch (error) {
    logger.error("Erro ao vincular contrato à procuração:", error);

    return {
      success: false,
      error: "Erro ao processar vinculação",
    };
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

    // Validar dados bancários se fornecidos
    if (data.dadosBancariosId) {
      const dadosBancarios = await prisma.dadosBancarios.findFirst({
        where: {
          id: data.dadosBancariosId,
          tenantId: user.tenantId,
          ativo: true,
          deletedAt: null,
        },
      });

      if (!dadosBancarios) {
        return {
          success: false,
          error: "Dados bancários não encontrados ou inativos",
        };
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
        processoId: data.processoId,
        dadosBancariosId: data.dadosBancariosId,
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
        dadosBancarios: true,
      },
    });

    // Converter Decimals para number antes de retornar
    const contratoSerializado = {
      ...contrato,
      valor: Number(contrato.valor),
      comissaoAdvogado: Number(contrato.comissaoAdvogado),
      percentualAcaoGanha: Number(contrato.percentualAcaoGanha),
      valorAcaoGanha: Number(contrato.valorAcaoGanha),
      advogadoResponsavel: contrato.advogadoResponsavel
        ? {
            ...contrato.advogadoResponsavel,
            comissaoPadrao: Number(contrato.advogadoResponsavel.comissaoPadrao),
            comissaoAcaoGanha: Number(
              contrato.advogadoResponsavel.comissaoAcaoGanha,
            ),
            comissaoHonorarios: Number(
              contrato.advogadoResponsavel.comissaoHonorarios,
            ),
          }
        : null,
    };

    return {
      success: true,
      contrato: contratoSerializado,
    };
  } catch (error) {
    logger.error("Erro ao criar contrato:", error);

    return {
      success: false,
      error: "Erro ao criar contrato",
    };
  }
}

// ============================================
// ACTIONS - LISTAR CONTRATOS
// ============================================

/**
 * Busca todos os contratos do tenant
 */
export async function getAllContratos(): Promise<{
  success: boolean;
  contratos?: any[];
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

    // Se for ADVOGADO, buscar apenas contratos onde ele é responsável
    let whereClause: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (advogadoId) {
        whereClause.advogadoResponsavelId = advogadoId;
      }
    }

    const contratos = await prisma.contrato.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            nome: true,
          },
        },
        advogadoResponsavel: {
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
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            procuracoesVinculadas: {
              select: {
                procuracao: {
                  select: {
                    id: true,
                    numero: true,
                    ativa: true,
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

    // Converter Decimal para number
    const contratosFormatted = contratos.map((c: any) => ({
      ...c,
      valor: Number(c.valor),
      comissaoAdvogado: Number(c.comissaoAdvogado),
      percentualAcaoGanha: Number(c.percentualAcaoGanha),
      valorAcaoGanha: Number(c.valorAcaoGanha),
    }));

    return {
      success: true,
      contratos: contratosFormatted,
    };
  } catch (error) {
    logger.error("Erro ao buscar contratos:", error);

    return {
      success: false,
      error: "Erro ao buscar contratos",
    };
  }
}

/**
 * Busca um contrato específico por ID
 */
export async function getContratoById(contratoId: string): Promise<{
  success: boolean;
  contrato?: any;
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

    // Se for ADVOGADO, buscar apenas contratos onde ele é responsável
    let whereClause: any = {
      id: contratoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (advogadoId) {
        whereClause.advogadoResponsavelId = advogadoId;
      }
    }

    const contrato = await prisma.contrato.findFirst({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
            email: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            id: true,
            nome: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            status: true,
            procuracoesVinculadas: {
              select: {
                procuracao: {
                  select: {
                    id: true,
                    numero: true,
                    ativa: true,
                  },
                },
              },
            },
          },
        },
        faturas: {
          select: {
            id: true,
            numero: true,
            valor: true,
            vencimento: true,
            status: true,
          },
        },
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Converter Decimal para number
    const contratoFormatted = {
      ...contrato,
      valor: Number(contrato.valor),
      comissaoAdvogado: Number(contrato.comissaoAdvogado),
      percentualAcaoGanha: Number(contrato.percentualAcaoGanha),
      valorAcaoGanha: Number(contrato.valorAcaoGanha),
      faturas: contrato.faturas.map((f: any) => ({
        ...f,
        valor: Number(f.valor),
      })),
    };

    return {
      success: true,
      contrato: contratoFormatted,
    };
  } catch (error) {
    logger.error("Erro ao buscar contrato:", error);

    return {
      success: false,
      error: "Erro ao buscar contrato",
    };
  }
}

// ============================================
// ACTIONS - ATUALIZAR CONTRATO
// ============================================

export interface ContratoUpdateInput extends Partial<ContratoCreateInput> {
  id: string;
}

/**
 * Atualiza um contrato existente
 */
export async function updateContrato(
  contratoId: string,
  data: Partial<ContratoCreateInput>,
): Promise<{
  success: boolean;
  contrato?: any;
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

    // Verificar se o contrato existe e o usuário tem permissão
    const contratoExistente = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!contratoExistente) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Validar dados bancários se fornecidos
    if (data.dadosBancariosId !== undefined && data.dadosBancariosId) {
      const dadosBancarios = await prisma.dadosBancarios.findFirst({
        where: {
          id: data.dadosBancariosId,
          tenantId: user.tenantId,
          ativo: true,
          deletedAt: null,
        },
      });

      if (!dadosBancarios) {
        return {
          success: false,
          error: "Dados bancários não encontrados ou inativos",
        };
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.resumo !== undefined) updateData.resumo = data.resumo;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.valor !== undefined) updateData.valor = data.valor;
    if (data.dataInicio !== undefined) {
      updateData.dataInicio =
        data.dataInicio instanceof Date
          ? data.dataInicio
          : new Date(data.dataInicio);
    }
    if (data.dataFim !== undefined) {
      updateData.dataFim =
        data.dataFim instanceof Date ? data.dataFim : new Date(data.dataFim);
    }
    if (data.observacoes !== undefined)
      updateData.observacoes = data.observacoes;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.advogadoId !== undefined)
      updateData.advogadoResponsavelId = data.advogadoId;
    if (data.processoId !== undefined) updateData.processoId = data.processoId;
    if (data.tipoContratoId !== undefined)
      updateData.tipoId = data.tipoContratoId;
    if (data.dadosBancariosId !== undefined)
      updateData.dadosBancariosId = data.dadosBancariosId;

    // Atualizar contrato
    const contratoAtualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            nome: true,
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
      },
    });

    // Converter Decimal para number
    const contratoSerializado = {
      ...contratoAtualizado,
      valor: Number(contratoAtualizado.valor),
      comissaoAdvogado: Number(contratoAtualizado.comissaoAdvogado),
      percentualAcaoGanha: Number(contratoAtualizado.percentualAcaoGanha),
      valorAcaoGanha: Number(contratoAtualizado.valorAcaoGanha),
    };

    return {
      success: true,
      contrato: contratoSerializado,
    };
  } catch (error) {
    logger.error("Erro ao atualizar contrato:", error);

    return {
      success: false,
      error: "Erro ao atualizar contrato",
    };
  }
}

// ============================================
// ACTIONS - CONTRATOS COM PARCELAS
// ============================================

export async function getContratosComParcelas(): Promise<{
  success: boolean;
  contratos?: any[];
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

    // Se for ADVOGADO, buscar apenas contratos onde ele é responsável
    let whereClause: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (advogadoId) {
        whereClause.advogadoResponsavelId = advogadoId;
      }
    }

    const contratos = await prisma.contrato.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
          },
        },
        tipo: {
          select: {
            nome: true,
          },
        },
        parcelas: {
          select: {
            id: true,
            valor: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number e calcular informações de parcelas
    const convertedData = contratos.map((contrato) =>
      convertAllDecimalFields(contrato),
    );
    const contratosComParcelas = convertedData.map((contrato) => {
      const valorTotalContrato = Number(contrato.valor) || 0;
      const parcelasExistentes = contrato.parcelas || [];

      const valorTotalParcelas = parcelasExistentes.reduce(
        (total, parcela) => total + Number(parcela.valor),
        0,
      );

      // Calcular valor já comprometido (pendentes + em andamento)
      const parcelasComprometidas = parcelasExistentes.filter(
        (p) => p.status === "PENDENTE" || p.status === "ATRASADA",
      );

      const valorComprometido = parcelasComprometidas.reduce(
        (total, parcela) => total + Number(parcela.valor),
        0,
      );

      // Valor disponível = valor total - valor comprometido (não pago)
      const valorDisponivel = valorTotalContrato - valorComprometido;
      const parcelasPendentes = parcelasExistentes.filter(
        (p) => p.status === "PENDENTE",
      ).length;

      const parcelasPagas = parcelasExistentes.filter(
        (p) => p.status === "PAGA",
      ).length;

      return {
        ...contrato,
        valor: valorTotalContrato,
        valorTotalParcelas,
        valorComprometido,
        valorDisponivel,
        parcelasPendentes,
        parcelasPagas,
        totalParcelas: parcelasExistentes.length,
      };
    });

    // Serializar para garantir que não há objetos não serializáveis
    const serialized = JSON.parse(JSON.stringify(contratosComParcelas));

    return {
      success: true,
      contratos: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar contratos com parcelas:", error);

    return {
      success: false,
      error: "Erro ao buscar contratos",
    };
  }
}
