"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

async function getTenantId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    throw new Error("Tenant ID não encontrado na sessão");
  }
  return session.user.tenantId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("User ID não encontrado na sessão");
  }
  return session.user.id;
}

// ============================================
// LISTAR PARCELAS DE CONTRATO
// ============================================

export async function listParcelasContrato(filters?: { contratoId?: string; status?: "PENDENTE" | "PAGA" | "ATRASADA" | "CANCELADA"; dataVencimentoInicio?: Date; dataVencimentoFim?: Date }) {
  try {
    const tenantId = await getTenantId();

    const where: any = {
      tenantId,
    };

    if (filters?.contratoId) {
      where.contratoId = filters.contratoId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dataVencimentoInicio || filters?.dataVencimentoFim) {
      where.dataVencimento = {};
      if (filters.dataVencimentoInicio) {
        where.dataVencimento.gte = filters.dataVencimentoInicio;
      }
      if (filters.dataVencimentoFim) {
        where.dataVencimento.lte = filters.dataVencimentoFim;
      }
    }

    const parcelas = await prisma.contratoParcela.findMany({
      where,
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
                telefone: true,
              },
            },
            advogado: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
        responsavelUsuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      orderBy: [{ dataVencimento: "asc" }, { numeroParcela: "asc" }],
    });

    return {
      success: true,
      data: parcelas,
    };
  } catch (error) {
    console.error("Erro ao listar parcelas de contrato:", error);
    return {
      success: false,
      error: "Erro ao listar parcelas de contrato",
      data: [],
    };
  }
}

// ============================================
// OBTER PARCELA POR ID
// ============================================

export async function getParcelaContrato(id: string) {
  try {
    const tenantId = await getTenantId();

    const parcela = await prisma.contratoParcela.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
            advogado: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        responsavelUsuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        comprovanteDocumento: {
          select: {
            id: true,
            nome: true,
            url: true,
            tipo: true,
          },
        },
      },
    });

    if (!parcela) {
      return {
        success: false,
        error: "Parcela não encontrada",
      };
    }

    return {
      success: true,
      data: parcela,
    };
  } catch (error) {
    console.error("Erro ao buscar parcela:", error);
    return {
      success: false,
      error: "Erro ao buscar parcela",
    };
  }
}

// ============================================
// CRIAR PARCELA DE CONTRATO
// ============================================

export async function createParcelaContrato(data: {
  contratoId: string;
  numeroParcela: number;
  titulo?: string;
  descricao?: string;
  valor: number;
  dataVencimento: Date;
  responsavelUsuarioId?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    // Verificar se o contrato existe e pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: data.contratoId,
        tenantId,
      },
    });

    if (!contrato) {
      return {
        success: false,
        error: "Contrato não encontrado",
      };
    }

    // Verificar se já existe uma parcela com o mesmo número para este contrato
    const parcelaExistente = await prisma.contratoParcela.findUnique({
      where: {
        contratoId_numeroParcela: {
          contratoId: data.contratoId,
          numeroParcela: data.numeroParcela,
        },
      },
    });

    if (parcelaExistente) {
      return {
        success: false,
        error: "Já existe uma parcela com este número para este contrato",
      };
    }

    const parcela = await prisma.contratoParcela.create({
      data: {
        tenantId,
        contratoId: data.contratoId,
        numeroParcela: data.numeroParcela,
        titulo: data.titulo,
        descricao: data.descricao,
        valor: Number(data.valor),
        dataVencimento: data.dataVencimento,
        responsavelUsuarioId: data.responsavelUsuarioId,
        status: "PENDENTE",
      },
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
              },
            },
            advogado: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/contratos");
    revalidatePath("/parcelas");

    return {
      success: true,
      data: parcela,
      message: "Parcela criada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar parcela:", error);
    return {
      success: false,
      error: "Erro ao criar parcela",
    };
  }
}

// ============================================
// ATUALIZAR PARCELA DE CONTRATO
// ============================================

export async function updateParcelaContrato(
  id: string,
  data: {
    titulo?: string;
    descricao?: string;
    valor?: number;
    dataVencimento?: Date;
    status?: "PENDENTE" | "PAGA" | "ATRASADA" | "CANCELADA";
    dataPagamento?: Date;
    formaPagamento?: string;
    responsavelUsuarioId?: string;
  }
) {
  try {
    const tenantId = await getTenantId();

    // Verificar se a parcela existe e pertence ao tenant
    const parcelaExistente = await prisma.contratoParcela.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!parcelaExistente) {
      return {
        success: false,
        error: "Parcela não encontrada",
      };
    }

    // Se está marcando como paga, definir data de pagamento
    const updateData: any = {
      titulo: data.titulo,
      descricao: data.descricao,
      valor: data.valor ? Number(data.valor) : undefined,
      dataVencimento: data.dataVencimento,
      status: data.status,
      formaPagamento: data.formaPagamento,
      responsavelUsuarioId: data.responsavelUsuarioId,
    };

    if (data.status === "PAGA" && !parcelaExistente.dataPagamento) {
      updateData.dataPagamento = data.dataPagamento || new Date();
    } else if (data.status !== "PAGA") {
      updateData.dataPagamento = null;
    }

    const parcela = await prisma.contratoParcela.update({
      where: { id },
      data: updateData,
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
              },
            },
            advogado: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/contratos");
    revalidatePath("/parcelas");

    return {
      success: true,
      data: parcela,
      message: "Parcela atualizada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar parcela:", error);
    return {
      success: false,
      error: "Erro ao atualizar parcela",
    };
  }
}

// ============================================
// DELETAR PARCELA DE CONTRATO
// ============================================

export async function deleteParcelaContrato(id: string) {
  try {
    const tenantId = await getTenantId();

    // Verificar se a parcela existe e pertence ao tenant
    const parcela = await prisma.contratoParcela.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!parcela) {
      return {
        success: false,
        error: "Parcela não encontrada",
      };
    }

    await prisma.contratoParcela.delete({
      where: { id },
    });

    revalidatePath("/contratos");
    revalidatePath("/parcelas");

    return {
      success: true,
      message: "Parcela removida com sucesso",
    };
  } catch (error) {
    console.error("Erro ao deletar parcela:", error);
    return {
      success: false,
      error: "Erro ao deletar parcela",
    };
  }
}

// ============================================
// GERAR PARCELAS AUTOMATICAMENTE
// ============================================

export async function gerarParcelasAutomaticamente(
  contratoId: string,
  configuracao: {
    valorTotal: number;
    numeroParcelas: number;
    dataPrimeiroVencimento: Date;
    intervaloDias?: number; // Padrão: 30 dias
    tituloBase?: string;
  }
) {
  try {
    const tenantId = await getTenantId();

    // Verificar se o contrato existe
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
      },
    });

    if (!contrato) {
      return {
        success: false,
        error: "Contrato não encontrado",
      };
    }

    // Verificar se já existem parcelas para este contrato
    const parcelasExistentes = await prisma.contratoParcela.count({
      where: {
        contratoId,
        tenantId,
      },
    });

    if (parcelasExistentes > 0) {
      return {
        success: false,
        error: "Este contrato já possui parcelas cadastradas",
      };
    }

    const valorParcela = configuracao.valorTotal / configuracao.numeroParcelas;
    const intervalo = configuracao.intervaloDias || 30;
    const parcelas = [];

    for (let i = 1; i <= configuracao.numeroParcelas; i++) {
      const dataVencimento = new Date(configuracao.dataPrimeiroVencimento);
      dataVencimento.setDate(dataVencimento.getDate() + (i - 1) * intervalo);

      const parcela = await prisma.contratoParcela.create({
        data: {
          tenantId,
          contratoId,
          numeroParcela: i,
          titulo: configuracao.tituloBase ? `${configuracao.tituloBase} ${i}/${configuracao.numeroParcelas}` : `Parcela ${i}/${configuracao.numeroParcelas}`,
          valor: valorParcela,
          dataVencimento,
          status: "PENDENTE",
        },
      });

      parcelas.push(parcela);
    }

    revalidatePath("/contratos");
    revalidatePath("/parcelas");

    return {
      success: true,
      data: parcelas,
      message: `${configuracao.numeroParcelas} parcelas criadas com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao gerar parcelas:", error);
    return {
      success: false,
      error: "Erro ao gerar parcelas automaticamente",
    };
  }
}

// ============================================
// OBTER DASHBOARD DE PARCELAS
// ============================================

export async function getDashboardParcelas() {
  try {
    const tenantId = await getTenantId();

    const [totalParcelas, parcelasPendentes, parcelasPagas, parcelasAtrasadas, valorTotalPendente, valorTotalPago, parcelasVencendo] = await Promise.all([
      // Total de parcelas
      prisma.contratoParcela.count({
        where: { tenantId },
      }),
      // Parcelas pendentes
      prisma.contratoParcela.count({
        where: { tenantId, status: "PENDENTE" },
      }),
      // Parcelas pagas
      prisma.contratoParcela.count({
        where: { tenantId, status: "PAGA" },
      }),
      // Parcelas atrasadas
      prisma.contratoParcela.count({
        where: {
          tenantId,
          status: "PENDENTE",
          dataVencimento: { lt: new Date() },
        },
      }),
      // Valor total pendente
      prisma.contratoParcela.aggregate({
        where: { tenantId, status: "PENDENTE" },
        _sum: { valor: true },
      }),
      // Valor total pago
      prisma.contratoParcela.aggregate({
        where: { tenantId, status: "PAGA" },
        _sum: { valor: true },
      }),
      // Parcelas vencendo nos próximos 7 dias
      prisma.contratoParcela.count({
        where: {
          tenantId,
          status: "PENDENTE",
          dataVencimento: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalParcelas,
        parcelasPendentes,
        parcelasPagas,
        parcelasAtrasadas,
        valorTotalPendente: Number(valorTotalPendente._sum.valor || 0),
        valorTotalPago: Number(valorTotalPago._sum.valor || 0),
        parcelasVencendo,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dashboard de parcelas:", error);
    return {
      success: false,
      error: "Erro ao buscar dashboard de parcelas",
    };
  }
}

// ============================================
// OBTER STATUS DISPONÍVEIS
// ============================================

export async function getStatusParcelas() {
  return {
    success: true,
    data: [
      {
        value: "PENDENTE",
        label: "Pendente",
        color: "warning",
        icon: "⏳",
      },
      {
        value: "PAGA",
        label: "Paga",
        color: "success",
        icon: "✅",
      },
      {
        value: "ATRASADA",
        label: "Atrasada",
        color: "danger",
        icon: "⚠️",
      },
      {
        value: "CANCELADA",
        label: "Cancelada",
        color: "default",
        icon: "❌",
      },
    ],
  };
}
