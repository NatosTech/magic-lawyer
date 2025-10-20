"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

// ============================================
// Types
// ============================================

export interface FiltrosRecibos {
  dataInicio?: Date;
  dataFim?: Date;
  clienteId?: string;
  contratoId?: string;
  status?: "PAGA" | "PENDENTE" | "ATRASADA" | "CANCELADA";
  tipo?: "PARCELA" | "FATURA" | "TODOS";
  formaPagamento?: string;
  search?: string;
}

export interface ReciboParcela {
  id: string;
  tipo: "PARCELA";
  numero: string;
  titulo: string;
  descricao: string | null;
  valor: number;
  dataVencimento: Date;
  dataPagamento: Date | null;
  status: string;
  formaPagamento: string | null;
  asaasPaymentId: string | null;
  dadosPagamento: any;
  contrato: {
    id: string;
    numero: string;
    tipo: string;
    cliente: {
      id: string;
      nome: string;
      documento: string | null;
      email: string | null;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReciboFatura {
  id: string;
  tipo: "FATURA";
  numero: string;
  titulo: string;
  descricao: string | null;
  valor: number;
  dataVencimento: Date | null;
  dataPagamento: Date | null;
  status: string;
  contrato: {
    id: string;
    numero: string;
    tipo: string;
    cliente: {
      id: string;
      nome: string;
      documento: string | null;
      email: string | null;
    };
  } | null;
  subscription: {
    id: string;
    plano: {
      nome: string;
    };
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type Recibo = ReciboParcela | ReciboFatura;

export interface RecibosResponse {
  success: boolean;
  data?: {
    recibos: Recibo[];
    total: number;
    resumo: {
      totalValor: number;
      totalParcelas: number;
      totalFaturas: number;
      porStatus: Record<string, number>;
      porFormaPagamento: Record<string, number>;
    };
  };
  error?: string;
}

// ============================================
// Server Actions
// ============================================

export async function getRecibosPagos(filtros: FiltrosRecibos = {}): Promise<RecibosResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return { success: false, error: "Não autenticado" };
    }

    const { tenantId, role } = session.user;

    // Construir filtros base
    const whereBase = {
      tenantId,
      ...(filtros.dataInicio && filtros.dataFim && {
        dataPagamento: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
      }),
    };

    // Filtros específicos por role
    let whereParcelas = { ...whereBase };
    let whereFaturas = { ...whereBase };

    // CLIENTE vê apenas seus próprios recibos
    if (role === "CLIENTE") {
      whereParcelas = {
        ...whereParcelas,
        contrato: {
          cliente: {
            usuario: {
              some: {
                id: session.user.id,
              },
            },
          },
        },
      };
      whereFaturas = {
        ...whereFaturas,
        contrato: {
          cliente: {
            usuario: {
              some: {
                id: session.user.id,
              },
            },
          },
        },
      };
    }

    // ADVOGADO vê apenas recibos dos seus clientes
    if (role === "ADVOGADO") {
      whereParcelas = {
        ...whereParcelas,
        contrato: {
          advogadoClientes: {
            some: {
              advogado: {
                usuarioId: session.user.id,
              },
            },
          },
        },
      };
      whereFaturas = {
        ...whereFaturas,
        contrato: {
          advogadoClientes: {
            some: {
              advogado: {
                usuarioId: session.user.id,
              },
            },
          },
        },
      };
    }

    // Aplicar filtros adicionais
    if (filtros.clienteId) {
      whereParcelas = {
        ...whereParcelas,
        contrato: {
          ...whereParcelas.contrato,
          clienteId: filtros.clienteId,
        },
      };
      whereFaturas = {
        ...whereFaturas,
        contrato: {
          ...whereFaturas.contrato,
          clienteId: filtros.clienteId,
        },
      };
    }

    if (filtros.contratoId) {
      whereParcelas = {
        ...whereParcelas,
        contratoId: filtros.contratoId,
      };
      whereFaturas = {
        ...whereFaturas,
        contratoId: filtros.contratoId,
      };
    }

    if (filtros.status) {
      whereParcelas = {
        ...whereParcelas,
        status: filtros.status as any,
      };
      whereFaturas = {
        ...whereFaturas,
        status: filtros.status as any,
      };
    }

    if (filtros.formaPagamento) {
      whereParcelas = {
        ...whereParcelas,
        formaPagamento: filtros.formaPagamento,
      };
    }

    // Buscar parcelas pagas
    const parcelas = filtros.tipo !== "FATURA" ? await prisma.contratoParcela.findMany({
      where: {
        ...whereParcelas,
        status: "PAGA",
        dataPagamento: { not: null },
      },
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                documento: true,
                email: true,
              },
            },
            tipoContrato: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataPagamento: "desc",
      },
    }) : [];

    // Buscar faturas pagas
    const faturas = filtros.tipo !== "PARCELA" ? await prisma.fatura.findMany({
      where: {
        ...whereFaturas,
        status: "PAGA",
        pagoEm: { not: null },
      },
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                documento: true,
                email: true,
              },
            },
            tipoContrato: {
              select: {
                nome: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plano: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        pagoEm: "desc",
      },
    }) : [];

    // Converter para formato unificado
    const recibosParcelas: ReciboParcela[] = parcelas.map((parcela) => ({
      id: parcela.id,
      tipo: "PARCELA" as const,
      numero: `Parcela ${parcela.numeroParcela}`,
      titulo: parcela.titulo || `Parcela ${parcela.numeroParcela}`,
      descricao: parcela.descricao,
      valor: Number(parcela.valor),
      dataVencimento: parcela.dataVencimento,
      dataPagamento: parcela.dataPagamento,
      status: parcela.status,
      formaPagamento: parcela.formaPagamento,
      asaasPaymentId: parcela.asaasPaymentId,
      dadosPagamento: parcela.dadosPagamento,
      contrato: {
        id: parcela.contrato.id,
        numero: parcela.contrato.numero,
        tipo: parcela.contrato.tipoContrato?.nome || "Contrato",
        cliente: parcela.contrato.cliente,
      },
      createdAt: parcela.createdAt,
      updatedAt: parcela.updatedAt,
    }));

    const recibosFaturas: ReciboFatura[] = faturas.map((fatura) => ({
      id: fatura.id,
      tipo: "FATURA" as const,
      numero: fatura.numero || `FAT-${fatura.id.slice(-8)}`,
      titulo: fatura.descricao || "Fatura",
      descricao: fatura.descricao,
      valor: Number(fatura.valor),
      dataVencimento: fatura.vencimento,
      dataPagamento: fatura.pagoEm,
      status: fatura.status,
      contrato: fatura.contrato ? {
        id: fatura.contrato.id,
        numero: fatura.contrato.numero,
        tipo: fatura.contrato.tipoContrato?.nome || "Contrato",
        cliente: fatura.contrato.cliente,
      } : null,
      subscription: fatura.subscription ? {
        id: fatura.subscription.id,
        plano: fatura.subscription.plano,
      } : null,
      createdAt: fatura.createdAt,
      updatedAt: fatura.updatedAt,
    }));

    // Combinar e ordenar todos os recibos
    const todosRecibos: Recibo[] = [...recibosParcelas, ...recibosFaturas]
      .sort((a, b) => {
        const dataA = a.dataPagamento || a.createdAt;
        const dataB = b.dataPagamento || b.createdAt;
        return dataB.getTime() - dataA.getTime();
      });

    // Aplicar filtro de busca se fornecido
    const recibosFiltrados = filtros.search
      ? todosRecibos.filter((recibo) => {
          const searchLower = filtros.search!.toLowerCase();
          return (
            recibo.numero.toLowerCase().includes(searchLower) ||
            recibo.titulo.toLowerCase().includes(searchLower) ||
            recibo.contrato?.cliente.nome.toLowerCase().includes(searchLower) ||
            recibo.contrato?.numero.toLowerCase().includes(searchLower)
          );
        })
      : todosRecibos;

    // Calcular resumo
    const resumo = {
      totalValor: recibosFiltrados.reduce((sum, recibo) => sum + recibo.valor, 0),
      totalParcelas: recibosFiltrados.filter((r) => r.tipo === "PARCELA").length,
      totalFaturas: recibosFiltrados.filter((r) => r.tipo === "FATURA").length,
      porStatus: recibosFiltrados.reduce((acc, recibo) => {
        acc[recibo.status] = (acc[recibo.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porFormaPagamento: recibosFiltrados.reduce((acc, recibo) => {
        if (recibo.tipo === "PARCELA" && recibo.formaPagamento) {
          acc[recibo.formaPagamento] = (acc[recibo.formaPagamento] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      success: true,
      data: {
        recibos: recibosFiltrados,
        total: recibosFiltrados.length,
        resumo,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar recibos:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function getReciboDetalhes(reciboId: string, tipo: "PARCELA" | "FATURA"): Promise<{
  success: boolean;
  data?: Recibo;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return { success: false, error: "Não autenticado" };
    }

    const { tenantId, role } = session.user;

    if (tipo === "PARCELA") {
      const parcela = await prisma.contratoParcela.findFirst({
        where: {
          id: reciboId,
          tenantId,
          status: "PAGA",
          dataPagamento: { not: null },
        },
        include: {
          contrato: {
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  documento: true,
                  email: true,
                  telefone: true,
                  celular: true,
                },
              },
              tipoContrato: {
                select: {
                  nome: true,
                },
              },
            },
          },
          dadosBancarios: {
            include: {
              banco: {
                select: {
                  nome: true,
                  codigo: true,
                },
              },
            },
          },
        },
      });

      if (!parcela) {
        return { success: false, error: "Recibo não encontrado" };
      }

      // Verificar permissões
      if (role === "CLIENTE") {
        const isCliente = parcela.contrato.cliente.usuario?.some(
          (u) => u.id === session.user.id
        );
        if (!isCliente) {
          return { success: false, error: "Acesso negado" };
        }
      }

      if (role === "ADVOGADO") {
        const isAdvogado = await prisma.advogadoCliente.findFirst({
          where: {
            contratoId: parcela.contratoId,
            advogado: {
              usuarioId: session.user.id,
            },
          },
        });
        if (!isAdvogado) {
          return { success: false, error: "Acesso negado" };
        }
      }

      const recibo: ReciboParcela = {
        id: parcela.id,
        tipo: "PARCELA",
        numero: `Parcela ${parcela.numeroParcela}`,
        titulo: parcela.titulo || `Parcela ${parcela.numeroParcela}`,
        descricao: parcela.descricao,
        valor: Number(parcela.valor),
        dataVencimento: parcela.dataVencimento,
        dataPagamento: parcela.dataPagamento,
        status: parcela.status,
        formaPagamento: parcela.formaPagamento,
        asaasPaymentId: parcela.asaasPaymentId,
        dadosPagamento: parcela.dadosPagamento,
        contrato: {
          id: parcela.contrato.id,
          numero: parcela.contrato.numero,
          tipo: parcela.contrato.tipoContrato?.nome || "Contrato",
          cliente: parcela.contrato.cliente,
        },
        createdAt: parcela.createdAt,
        updatedAt: parcela.updatedAt,
      };

      return { success: true, data: recibo };
    } else {
      const fatura = await prisma.fatura.findFirst({
        where: {
          id: reciboId,
          tenantId,
          status: "PAGA",
          pagoEm: { not: null },
        },
        include: {
          contrato: {
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  documento: true,
                  email: true,
                  telefone: true,
                  celular: true,
                },
              },
              tipoContrato: {
                select: {
                  nome: true,
                },
              },
            },
          },
          subscription: {
            include: {
              plano: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      });

      if (!fatura) {
        return { success: false, error: "Recibo não encontrado" };
      }

      // Verificar permissões
      if (role === "CLIENTE" && fatura.contrato) {
        const isCliente = fatura.contrato.cliente.usuario?.some(
          (u) => u.id === session.user.id
        );
        if (!isCliente) {
          return { success: false, error: "Acesso negado" };
        }
      }

      if (role === "ADVOGADO" && fatura.contrato) {
        const isAdvogado = await prisma.advogadoCliente.findFirst({
          where: {
            contratoId: fatura.contratoId,
            advogado: {
              usuarioId: session.user.id,
            },
          },
        });
        if (!isAdvogado) {
          return { success: false, error: "Acesso negado" };
        }
      }

      const recibo: ReciboFatura = {
        id: fatura.id,
        tipo: "FATURA",
        numero: fatura.numero || `FAT-${fatura.id.slice(-8)}`,
        titulo: fatura.descricao || "Fatura",
        descricao: fatura.descricao,
        valor: Number(fatura.valor),
        dataVencimento: fatura.vencimento,
        dataPagamento: fatura.pagoEm,
        status: fatura.status,
        contrato: fatura.contrato ? {
          id: fatura.contrato.id,
          numero: fatura.contrato.numero,
          tipo: fatura.contrato.tipoContrato?.nome || "Contrato",
          cliente: fatura.contrato.cliente,
        } : null,
        subscription: fatura.subscription ? {
          id: fatura.subscription.id,
          plano: fatura.subscription.plano,
        } : null,
        createdAt: fatura.createdAt,
        updatedAt: fatura.updatedAt,
      };

      return { success: true, data: recibo };
    }
  } catch (error) {
    console.error("Erro ao buscar detalhes do recibo:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function gerarComprovantePDF(reciboId: string, tipo: "PARCELA" | "FATURA"): Promise<{
  success: boolean;
  data?: {
    pdfUrl: string;
    filename: string;
  };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return { success: false, error: "Não autenticado" };
    }

    // Buscar dados do recibo
    const reciboResult = await getReciboDetalhes(reciboId, tipo);
    
    if (!reciboResult.success || !reciboResult.data) {
      return { success: false, error: reciboResult.error || "Recibo não encontrado" };
    }

    const recibo = reciboResult.data;

    // TODO: Implementar geração de PDF
    // Por enquanto, retornar dados estruturados para o frontend gerar o PDF
    const filename = `comprovante-${recibo.numero.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    return {
      success: true,
      data: {
        pdfUrl: `/api/recibos/${reciboId}/pdf?tipo=${tipo}`,
        filename,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar comprovante PDF:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}
