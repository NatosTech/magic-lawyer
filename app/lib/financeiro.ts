import prisma from "./prisma";
import { sendEmail, emailTemplates } from "./email";

// Interface para resumo financeiro do cliente
export interface ResumoFinanceiroCliente {
  clienteId: string;
  clienteNome: string;
  totalDevido: number;
  totalPago: number;
  totalPendente: number;
  proximoVencimento?: Date;
  faturasVencidas: number;
  faturasPendentes: number;
  faturasPagas: number;
  ultimoPagamento?: Date;
  contratosAtivos: number;
}

// Interface para resumo financeiro do advogado
export interface ResumoFinanceiroAdvogado {
  advogadoId: string;
  advogadoNome: string;
  totalAReceber: number;
  totalRecebido: number;
  totalPendente: number;
  clientesAtivos: number;
  processosAtivos: number;
  contratosAtivos: number;
  proximoRecebimento?: Date;
  faturasPendentes: number;
  faturasPagas: number;
}

// Interface para resumo financeiro do escritório
export interface ResumoFinanceiroEscritorio {
  tenantId: string;
  receitaTotal: number;
  receitaPendente: number;
  receitaRecebida: number;
  despesasTotal: number;
  lucroBruto: number;
  clientesAtivos: number;
  advogadosAtivos: number;
  processosAtivos: number;
  contratosAtivos: number;
  faturasVencidas: number;
  faturasPendentes: number;
  faturasPagas: number;
  ticketMedio: number;
  crescimentoMensal: number;
}

// Função para obter resumo financeiro do cliente
export const getResumoFinanceiroCliente = async (
  clienteId: string
): Promise<{
  success: boolean;
  data?: ResumoFinanceiroCliente;
  error?: string;
}> => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        contratos: {
          include: {
            faturas: {
              include: {
                pagamentos: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Calcular totais das faturas
    let totalDevido = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let faturasVencidas = 0;
    let faturasPendentes = 0;
    let faturasPagas = 0;
    let ultimoPagamento: Date | undefined;
    let proximoVencimento: Date | undefined;

    for (const contrato of cliente.contratos) {
      for (const fatura of contrato.faturas) {
        totalDevido += Number(fatura.valor);

        const totalPagoFatura = fatura.pagamentos.reduce((sum, pagamento) => {
          if (pagamento.status === "PAGO") {
            return sum + Number(pagamento.valor);
          }

          return sum;
        }, 0);

        totalPago += totalPagoFatura;

        if (fatura.status === "PAGA") {
          faturasPagas++;
        } else if (fatura.status === "VENCIDA") {
          faturasVencidas++;
          totalPendente += Number(fatura.valor) - totalPagoFatura;
        } else if (fatura.status === "ABERTA") {
          faturasPendentes++;
          totalPendente += Number(fatura.valor) - totalPagoFatura;
        }

        // Encontrar último pagamento
        for (const pagamento of fatura.pagamentos) {
          if (pagamento.status === "PAGO" && pagamento.confirmadoEm) {
            if (!ultimoPagamento || pagamento.confirmadoEm > ultimoPagamento) {
              ultimoPagamento = pagamento.confirmadoEm;
            }
          }
        }

        // Encontrar próximo vencimento
        if (fatura.status === "ABERTA" && fatura.vencimento) {
          if (!proximoVencimento || fatura.vencimento < proximoVencimento) {
            proximoVencimento = fatura.vencimento;
          }
        }
      }
    }

    const contratosAtivos = cliente.contratos.filter((c) => c.status === "ATIVO").length;

    const resumo: ResumoFinanceiroCliente = {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      totalDevido,
      totalPago,
      totalPendente,
      proximoVencimento,
      faturasVencidas,
      faturasPendentes,
      faturasPagas,
      ultimoPagamento,
      contratosAtivos,
    };

    return { success: true, data: resumo };
  } catch (error) {
    console.error("Erro ao obter resumo financeiro do cliente:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para obter resumo financeiro do advogado
export const getResumoFinanceiroAdvogado = async (
  advogadoId: string
): Promise<{
  success: boolean;
  data?: ResumoFinanceiroAdvogado;
  error?: string;
}> => {
  try {
    const advogado = await prisma.advogado.findUnique({
      where: { id: advogadoId },
      include: {
        usuario: true,
        contratos: {
          include: {
            faturas: {
              include: {
                pagamentos: true,
              },
            },
          },
        },
        clientes: {
          include: {
            cliente: true,
          },
        },
        processos: true,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Calcular totais dos contratos do advogado
    let totalAReceber = 0;
    let totalRecebido = 0;
    let totalPendente = 0;
    let faturasPendentes = 0;
    let faturasPagas = 0;
    let proximoRecebimento: Date | undefined;

    for (const contrato of advogado.contratos) {
      for (const fatura of contrato.faturas) {
        totalAReceber += Number(fatura.valor);

        const totalPagoFatura = fatura.pagamentos.reduce((sum, pagamento) => {
          if (pagamento.status === "PAGO") {
            return sum + Number(pagamento.valor);
          }

          return sum;
        }, 0);

        totalRecebido += totalPagoFatura;

        if (fatura.status === "PAGA") {
          faturasPagas++;
        } else if (fatura.status === "ABERTA" || fatura.status === "VENCIDA") {
          faturasPendentes++;
          totalPendente += Number(fatura.valor) - totalPagoFatura;

          // Encontrar próximo recebimento
          if (fatura.vencimento && fatura.status === "ABERTA") {
            if (!proximoRecebimento || fatura.vencimento < proximoRecebimento) {
              proximoRecebimento = fatura.vencimento;
            }
          }
        }
      }
    }

    const clientesAtivos = advogado.clientes.length;
    const processosAtivos = advogado.processos.filter((p) => p.status === "EM_ANDAMENTO").length;
    const contratosAtivos = advogado.contratos.filter((c) => c.status === "ATIVO").length;

    const resumo: ResumoFinanceiroAdvogado = {
      advogadoId: advogado.id,
      advogadoNome: advogado.usuario.firstName + " " + advogado.usuario.lastName,
      totalAReceber,
      totalRecebido,
      totalPendente,
      clientesAtivos,
      processosAtivos,
      contratosAtivos,
      proximoRecebimento,
      faturasPendentes,
      faturasPagas,
    };

    return { success: true, data: resumo };
  } catch (error) {
    console.error("Erro ao obter resumo financeiro do advogado:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para obter resumo financeiro do escritório
export const getResumoFinanceiroEscritorio = async (
  tenantId: string
): Promise<{
  success: boolean;
  data?: ResumoFinanceiroEscritorio;
  error?: string;
}> => {
  try {
    // Buscar todas as faturas do tenant
    const faturas = await prisma.fatura.findMany({
      where: { tenantId },
      include: {
        pagamentos: true,
        contrato: {
          include: {
            cliente: true,
          },
        },
      },
    });

    // Buscar estatísticas gerais
    const [clientes, advogados, processos, contratos] = await Promise.all([
      prisma.cliente.count({ where: { tenantId } }),
      prisma.advogado.count({ where: { tenantId } }),
      prisma.processo.count({ where: { tenantId, status: "EM_ANDAMENTO" } }),
      prisma.contrato.count({ where: { tenantId, status: "ATIVO" } }),
    ]);

    // Calcular totais financeiros
    let receitaTotal = 0;
    let receitaPendente = 0;
    let receitaRecebida = 0;
    let faturasVencidas = 0;
    let faturasPendentes = 0;
    let faturasPagas = 0;

    for (const fatura of faturas) {
      receitaTotal += Number(fatura.valor);

      const totalPagoFatura = fatura.pagamentos.reduce((sum, pagamento) => {
        if (pagamento.status === "PAGO") {
          return sum + Number(pagamento.valor);
        }

        return sum;
      }, 0);

      receitaRecebida += totalPagoFatura;

      if (fatura.status === "PAGA") {
        faturasPagas++;
      } else if (fatura.status === "VENCIDA") {
        faturasVencidas++;
        receitaPendente += Number(fatura.valor) - totalPagoFatura;
      } else if (fatura.status === "ABERTA") {
        faturasPendentes++;
        receitaPendente += Number(fatura.valor) - totalPagoFatura;
      }
    }

    // Calcular ticket médio
    const ticketMedio = clientes > 0 ? receitaTotal / clientes : 0;

    // Calcular crescimento mensal (comparar com mês anterior)
    const agora = new Date();
    const mesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

    const [receitaMesAtual, receitaMesAnterior] = await Promise.all([
      prisma.fatura.aggregate({
        where: {
          tenantId,
          createdAt: { gte: mesAtual },
        },
        _sum: { valor: true },
      }),
      prisma.fatura.aggregate({
        where: {
          tenantId,
          createdAt: { gte: mesAnterior, lt: mesAtual },
        },
        _sum: { valor: true },
      }),
    ]);

    const receitaAtual = Number(receitaMesAtual._sum.valor || 0);
    const receitaAnterior = Number(receitaMesAnterior._sum.valor || 0);
    const crescimentoMensal = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : 0;

    const resumo: ResumoFinanceiroEscritorio = {
      tenantId,
      receitaTotal,
      receitaPendente,
      receitaRecebida,
      despesasTotal: 0, // TODO: Implementar controle de despesas
      lucroBruto: receitaRecebida, // TODO: Subtrair despesas
      clientesAtivos: clientes,
      advogadosAtivos: advogados,
      processosAtivos: processos,
      contratosAtivos: contratos,
      faturasVencidas,
      faturasPendentes,
      faturasPagas,
      ticketMedio,
      crescimentoMensal,
    };

    return { success: true, data: resumo };
  } catch (error) {
    console.error("Erro ao obter resumo financeiro do escritório:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para listar faturas por período
export const listFaturasPorPeriodo = async (
  tenantId: string,
  dataInicio: Date,
  dataFim: Date,
  filtros?: {
    clienteId?: string;
    advogadoId?: string;
    status?: string;
  }
) => {
  try {
    const faturas = await prisma.fatura.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
        ...(filtros?.clienteId && {
          contrato: {
            clienteId: filtros.clienteId,
          },
        }),
        ...(filtros?.advogadoId && {
          contrato: {
            advogadoResponsavelId: filtros.advogadoId,
          },
        }),
        ...(filtros?.status && { status: filtros.status }),
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            advogadoResponsavel: {
              include: {
                usuario: true,
              },
            },
          },
        },
        pagamentos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: faturas };
  } catch (error) {
    console.error("Erro ao listar faturas por período:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para enviar lembretes de vencimento
export const enviarLembretesVencimento = async () => {
  try {
    const hoje = new Date();
    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Buscar faturas que vencem nos próximos 7 dias
    const faturas = await prisma.fatura.findMany({
      where: {
        status: "ABERTA",
        vencimento: {
          gte: hoje,
          lte: proximos7Dias,
        },
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            advogadoResponsavel: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    const lembretesEnviados = [];

    for (const fatura of faturas) {
      if (fatura.contrato.cliente.email) {
        try {
          const diasParaVencimento = Math.ceil((fatura.vencimento!.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

          const template = emailTemplates.notificacaoFinanceira({
            tipo: "vencimento",
            titulo: `Fatura vence em ${diasParaVencimento} dias`,
            valor: `R$ ${Number(fatura.valor).toFixed(2)}`,
            dataVencimento: fatura.vencimento!.toLocaleDateString("pt-BR"),
            descricao: `Fatura ${fatura.numero || fatura.id} do contrato ${fatura.contrato.titulo}`,
          });

          await sendEmail({
            to: fatura.contrato.cliente.email,
            subject: template.subject,
            html: template.html,
          });

          lembretesEnviados.push(fatura.id);
        } catch (error) {
          console.error(`Erro ao enviar lembrete para fatura ${fatura.id}:`, error);
        }
      }
    }

    return {
      success: true,
      data: {
        faturasProcessadas: faturas.length,
        lembretesEnviados: lembretesEnviados.length,
      },
    };
  } catch (error) {
    console.error("Erro ao enviar lembretes de vencimento:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para marcar fatura como paga
export const marcarFaturaComoPaga = async (faturaId: string, valorPago: number, metodoPagamento?: string) => {
  try {
    const fatura = await prisma.fatura.findUnique({
      where: { id: faturaId },
    });

    if (!fatura) {
      return { success: false, error: "Fatura não encontrada" };
    }

    if (fatura.status === "PAGA") {
      return { success: false, error: "Fatura já está marcada como paga" };
    }

    // Criar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        tenantId: fatura.tenantId,
        faturaId: fatura.id,
        valor: valorPago,
        status: "PAGO",
        metodo: metodoPagamento,
        confirmadoEm: new Date(),
      },
    });

    // Atualizar status da fatura se o valor pago for igual ou maior ao valor da fatura
    if (valorPago >= Number(fatura.valor)) {
      await prisma.fatura.update({
        where: { id: faturaId },
        data: {
          status: "PAGA",
          pagoEm: new Date(),
        },
      });
    }

    return { success: true, data: pagamento };
  } catch (error) {
    console.error("Erro ao marcar fatura como paga:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para gerar relatório financeiro
export const gerarRelatorioFinanceiro = async (tenantId: string, dataInicio: Date, dataFim: Date, tipo: "cliente" | "advogado" | "escritorio") => {
  try {
    let relatorio: any = {};

    switch (tipo) {
      case "cliente":
        // Relatório por cliente
        const clientes = await prisma.cliente.findMany({
          where: { tenantId },
          include: {
            contratos: {
              include: {
                faturas: {
                  where: {
                    createdAt: {
                      gte: dataInicio,
                      lte: dataFim,
                    },
                  },
                  include: {
                    pagamentos: true,
                  },
                },
              },
            },
          },
        });

        relatorio = clientes.map((cliente) => {
          let totalFaturado = 0;
          let totalPago = 0;
          let totalPendente = 0;

          for (const contrato of cliente.contratos) {
            for (const fatura of contrato.faturas) {
              totalFaturado += Number(fatura.valor);
              const pago = fatura.pagamentos.reduce((sum, p) => (p.status === "PAGO" ? sum + Number(p.valor) : sum), 0);

              totalPago += pago;
              totalPendente += Number(fatura.valor) - pago;
            }
          }

          return {
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            totalFaturado,
            totalPago,
            totalPendente,
            contratos: cliente.contratos.length,
          };
        });
        break;

      case "advogado":
        // Relatório por advogado
        const advogados = await prisma.advogado.findMany({
          where: { tenantId },
          include: {
            usuario: true,
            contratos: {
              include: {
                faturas: {
                  where: {
                    createdAt: {
                      gte: dataInicio,
                      lte: dataFim,
                    },
                  },
                  include: {
                    pagamentos: true,
                  },
                },
              },
            },
          },
        });

        relatorio = advogados.map((advogado) => {
          let totalFaturado = 0;
          let totalPago = 0;
          let totalPendente = 0;

          for (const contrato of advogado.contratos) {
            for (const fatura of contrato.faturas) {
              totalFaturado += Number(fatura.valor);
              const pago = fatura.pagamentos.reduce((sum, p) => (p.status === "PAGO" ? sum + Number(p.valor) : sum), 0);

              totalPago += pago;
              totalPendente += Number(fatura.valor) - pago;
            }
          }

          return {
            advogadoId: advogado.id,
            advogadoNome: `${advogado.usuario.firstName} ${advogado.usuario.lastName}`,
            totalFaturado,
            totalPago,
            totalPendente,
            contratos: advogado.contratos.length,
          };
        });
        break;

      case "escritorio":
        // Relatório geral do escritório
        const faturas = await prisma.fatura.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
          include: {
            pagamentos: true,
            contrato: {
              include: {
                cliente: true,
                advogadoResponsavel: {
                  include: {
                    usuario: true,
                  },
                },
              },
            },
          },
        });

        let totalFaturado = 0;
        let totalPago = 0;
        let totalPendente = 0;
        const faturasPorStatus = {
          PAGA: 0,
          ABERTA: 0,
          VENCIDA: 0,
          CANCELADA: 0,
        };

        for (const fatura of faturas) {
          totalFaturado += Number(fatura.valor);
          const pago = fatura.pagamentos.reduce((sum, p) => (p.status === "PAGO" ? sum + Number(p.valor) : sum), 0);

          totalPago += pago;
          totalPendente += Number(fatura.valor) - pago;
          faturasPorStatus[fatura.status as keyof typeof faturasPorStatus]++;
        }

        relatorio = {
          periodo: { dataInicio, dataFim },
          totalFaturado,
          totalPago,
          totalPendente,
          faturasPorStatus,
          totalFaturas: faturas.length,
        };
        break;
    }

    return { success: true, data: relatorio };
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
