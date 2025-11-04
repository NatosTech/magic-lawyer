"use server";

import { revalidatePath } from "next/cache";

import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
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
// LISTAR HONORÁRIOS CONTRATUAIS
// ============================================

export async function listHonorariosContratuais(filters?: {
  contratoId?: string;
  tipo?: "FIXO" | "SUCESSO" | "HIBRIDO";
  ativo?: boolean;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const session = await getSession();
    const userRole = session?.user?.role;

    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    const where: any = {
      tenantId,
    };

    if (filters?.contratoId) {
      where.contratoId = filters.contratoId;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    // FILTRO DE PRIVACIDADE E ACESSO:
    // Staff vinculado ou ADVOGADO só veem:
    // 1. Honorários PÚBLICOS de qualquer contrato
    // 2. Honorários PRIVADOS onde ele é o advogado vinculado (ou vinculado ao advogado)
    // 3. Honorários sem advogado específico (gerais do contrato)
    if (!isAdmin && userRole !== "CLIENTE" && session) {
      const { getAccessibleAdvogadoIds } = await import(
        "@/app/lib/advogado-access"
      );
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros adicionais)
      // Se há vínculos, aplicar filtro de privacidade
      if (accessibleAdvogados.length > 0) {
        where.OR = [
          { visibilidade: "PUBLICO" },
          {
            advogadoId: {
              in: accessibleAdvogados,
            },
          },
          { advogadoId: null },
        ];
      }
    }

    const honorarios = await prisma.contratoHonorario.findMany({
      where,
      include: {
        contrato: {
          include: {
            cliente: true,
            advogadoResponsavel: {
              include: {
                usuario: true,
              },
            },
            dadosBancarios: {
              include: {
                banco: true,
              },
            },
          },
        },
        advogado: {
          include: {
            usuario: true,
          },
        },
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { tipo: "asc" }],
    });

    // Converter Decimal para number e serializar
    const convertedData = honorarios.map((item) =>
      convertAllDecimalFields(item),
    );
    const serialized = JSON.parse(JSON.stringify(convertedData));

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Erro ao listar honorários contratuais:", error);

    return {
      success: false,
      error: "Erro ao listar honorários contratuais",
      data: [],
    };
  }
}

// ============================================
// OBTER HONORÁRIO CONTRATUAL POR ID
// ============================================

export async function getHonorarioContratual(id: string) {
  try {
    const tenantId = await getTenantId();

    const honorario = await prisma.contratoHonorario.findFirst({
      where: {
        id,
        tenantId,
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
            dadosBancarios: {
              include: {
                banco: true,
              },
            },
          },
        },
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
    });

    if (!honorario) {
      return {
        success: false,
        error: "Honorário contratual não encontrado",
      };
    }

    // Converter Decimal para number e serializar
    const convertedData = convertAllDecimalFields(honorario);
    const serialized = JSON.parse(JSON.stringify(convertedData));

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Erro ao buscar honorário contratual:", error);

    return {
      success: false,
      error: "Erro ao buscar honorário contratual",
    };
  }
}

// ============================================
// CRIAR HONORÁRIO CONTRATUAL
// ============================================

export async function createHonorarioContratual(data: {
  contratoId: string;
  advogadoId?: string;
  dadosBancariosId?: string;
  tipo: "FIXO" | "SUCESSO" | "HIBRIDO";
  valorFixo?: number;
  percentualSucesso?: number;
  valorMinimoSucesso?: number;
  baseCalculo?: string;
  observacoes?: string;
  visibilidade?: "PRIVADO" | "PUBLICO";
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
      include: {
        dadosBancarios: true,
      },
    });

    if (!contrato) {
      return {
        success: false,
        error: "Contrato não encontrado",
      };
    }

    // Se não especificou conta bancária, usar a do contrato
    const dadosBancariosId = data.dadosBancariosId || contrato.dadosBancariosId;

    // Validar conta bancária se especificada
    if (dadosBancariosId) {
      const contaBancaria = await prisma.dadosBancarios.findFirst({
        where: {
          id: dadosBancariosId,
          tenantId,
          ativo: true,
        },
      });

      if (!contaBancaria) {
        return {
          success: false,
          error: "Conta bancária não encontrada ou inativa",
        };
      }
    }

    // Validar campos baseado no tipo
    if (data.tipo === "FIXO" && !data.valorFixo) {
      return {
        success: false,
        error: "Valor fixo é obrigatório para honorários fixos",
      };
    }

    if (
      data.tipo === "SUCESSO" &&
      (!data.percentualSucesso || !data.valorMinimoSucesso)
    ) {
      return {
        success: false,
        error:
          "Percentual de sucesso e valor mínimo são obrigatórios para honorários por sucesso",
      };
    }

    if (
      data.tipo === "HIBRIDO" &&
      (!data.valorFixo || !data.percentualSucesso)
    ) {
      return {
        success: false,
        error:
          "Valor fixo e percentual de sucesso são obrigatórios para honorários híbridos",
      };
    }

    const honorario = await prisma.contratoHonorario.create({
      data: {
        tenantId,
        contratoId: data.contratoId,
        advogadoId: data.advogadoId,
        dadosBancariosId,
        tipo: data.tipo,
        valorFixo: data.valorFixo ? Number(data.valorFixo) : null,
        percentualSucesso: data.percentualSucesso
          ? Number(data.percentualSucesso)
          : null,
        valorMinimoSucesso: data.valorMinimoSucesso
          ? Number(data.valorMinimoSucesso)
          : null,
        baseCalculo: data.baseCalculo,
        observacoes: data.observacoes,
        visibilidade: data.visibilidade || "PRIVADO",
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
            advogadoResponsavel: {
              include: {
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            dadosBancarios: {
              include: {
                banco: true,
              },
            },
          },
        },
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
    });

    revalidatePath("/contratos");
    revalidatePath("/honorarios");

    // Converter Decimal para number e serializar
    const convertedData = convertAllDecimalFields(honorario);
    const serialized = JSON.parse(JSON.stringify(convertedData));

    return {
      success: true,
      data: serialized,
      message: "Honorário contratual criado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar honorário contratual:", error);

    return {
      success: false,
      error: "Erro ao criar honorário contratual",
    };
  }
}

// ============================================
// ATUALIZAR HONORÁRIO CONTRATUAL
// ============================================

export async function updateHonorarioContratual(
  id: string,
  data: {
    dadosBancariosId?: string;
    tipo?: "FIXO" | "SUCESSO" | "HIBRIDO";
    valorFixo?: number;
    percentualSucesso?: number;
    valorMinimoSucesso?: number;
    baseCalculo?: string;
    observacoes?: string;
  },
) {
  try {
    const tenantId = await getTenantId();

    // Verificar se o honorário existe e pertence ao tenant
    const honorarioExistente = await prisma.contratoHonorario.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        contrato: {
          include: {
            dadosBancarios: true,
          },
        },
      },
    });

    if (!honorarioExistente) {
      return {
        success: false,
        error: "Honorário contratual não encontrado",
      };
    }

    // Se não especificou conta bancária, usar a do contrato
    const dadosBancariosId =
      data.dadosBancariosId || honorarioExistente.contrato.dadosBancariosId;

    // Validar conta bancária se especificada
    if (dadosBancariosId) {
      const contaBancaria = await prisma.dadosBancarios.findFirst({
        where: {
          id: dadosBancariosId,
          tenantId,
          ativo: true,
        },
      });

      if (!contaBancaria) {
        return {
          success: false,
          error: "Conta bancária não encontrada ou inativa",
        };
      }
    }

    const tipo = data.tipo || honorarioExistente.tipo;

    // Validar campos baseado no tipo
    if (tipo === "FIXO" && !data.valorFixo && !honorarioExistente.valorFixo) {
      return {
        success: false,
        error: "Valor fixo é obrigatório para honorários fixos",
      };
    }

    if (
      (tipo === "SUCESSO" &&
        !data.percentualSucesso &&
        !honorarioExistente.percentualSucesso) ||
      (!data.valorMinimoSucesso && !honorarioExistente.valorMinimoSucesso)
    ) {
      return {
        success: false,
        error:
          "Percentual de sucesso e valor mínimo são obrigatórios para honorários por sucesso",
      };
    }

    if (
      tipo === "HIBRIDO" &&
      ((!data.valorFixo && !honorarioExistente.valorFixo) ||
        (!data.percentualSucesso && !honorarioExistente.percentualSucesso))
    ) {
      return {
        success: false,
        error:
          "Valor fixo e percentual de sucesso são obrigatórios para honorários híbridos",
      };
    }

    const honorario = await prisma.contratoHonorario.update({
      where: { id },
      data: {
        dadosBancariosId,
        tipo,
        valorFixo:
          data.valorFixo !== undefined
            ? Number(data.valorFixo)
            : honorarioExistente.valorFixo,
        percentualSucesso:
          data.percentualSucesso !== undefined
            ? Number(data.percentualSucesso)
            : honorarioExistente.percentualSucesso,
        valorMinimoSucesso:
          data.valorMinimoSucesso !== undefined
            ? Number(data.valorMinimoSucesso)
            : honorarioExistente.valorMinimoSucesso,
        baseCalculo: data.baseCalculo,
        observacoes: data.observacoes,
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
            advogadoResponsavel: {
              include: {
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            dadosBancarios: {
              include: {
                banco: true,
              },
            },
          },
        },
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
    });

    revalidatePath("/contratos");
    revalidatePath("/honorarios");

    // Converter Decimal para number e serializar
    const convertedData = convertAllDecimalFields(honorario);
    const serialized = JSON.parse(JSON.stringify(convertedData));

    return {
      success: true,
      data: serialized,
      message: "Honorário contratual atualizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar honorário contratual:", error);

    return {
      success: false,
      error: "Erro ao atualizar honorário contratual",
    };
  }
}

// ============================================
// DELETAR HONORÁRIO CONTRATUAL (SOFT DELETE)
// ============================================

export async function deleteHonorarioContratual(id: string) {
  try {
    const tenantId = await getTenantId();

    // Verificar se o honorário existe e pertence ao tenant
    const honorario = await prisma.contratoHonorario.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!honorario) {
      return {
        success: false,
        error: "Honorário contratual não encontrado",
      };
    }

    // Soft delete
    await prisma.contratoHonorario.update({
      where: { id },
      data: {},
    });

    revalidatePath("/contratos");
    revalidatePath("/honorarios");

    return {
      success: true,
      message: "Honorário contratual removido com sucesso",
    };
  } catch (error) {
    console.error("Erro ao deletar honorário contratual:", error);

    return {
      success: false,
      error: "Erro ao deletar honorário contratual",
    };
  }
}

// ============================================
// OBTER TIPOS DE HONORÁRIO
// ============================================

export async function getTiposHonorario() {
  return {
    success: true,
    data: [
      {
        value: "FIXO",
        label: "Honorário Fixo",
        description: "Valor fixo independente do resultado",
        icon: "💰",
      },
      {
        value: "SUCESSO",
        label: "Honorário por Sucesso",
        description: "Percentual sobre o valor obtido",
        icon: "🎯",
      },
      {
        value: "HIBRIDO",
        label: "Honorário Híbrido",
        description: "Valor fixo + percentual de sucesso",
        icon: "🔄",
      },
    ],
  };
}

// ============================================
// CALCULAR VALOR DO HONORÁRIO
// ============================================

export async function calcularValorHonorario(
  honorarioId: string,
  valorBase?: number,
) {
  try {
    const tenantId = await getTenantId();

    const honorario = await prisma.contratoHonorario.findFirst({
      where: {
        id: honorarioId,
        tenantId,
      },
    });

    if (!honorario) {
      return {
        success: false,
        error: "Honorário não encontrado",
      };
    }

    let valorCalculado = 0;
    let detalhes = "";

    switch (honorario.tipo) {
      case "FIXO":
        valorCalculado = Number(honorario.valorFixo || 0);
        detalhes = `Valor fixo: R$ ${valorCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        break;

      case "SUCESSO":
        if (!valorBase) {
          return {
            success: false,
            error:
              "Valor base é necessário para calcular honorário por sucesso",
          };
        }
        const percentual = Number(honorario.percentualSucesso || 0);
        const valorMinimo = Number(honorario.valorMinimoSucesso || 0);
        const valorPorSucesso = (valorBase * percentual) / 100;

        valorCalculado = Math.max(valorPorSucesso, valorMinimo);
        detalhes = `${percentual}% de R$ ${valorBase.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} = R$ ${valorPorSucesso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

        if (valorMinimo > valorPorSucesso) {
          detalhes += ` (aplicado valor mínimo: R$ ${valorMinimo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
        }
        break;

      case "HIBRIDO":
        if (!valorBase) {
          return {
            success: false,
            error: "Valor base é necessário para calcular honorário híbrido",
          };
        }
        const valorFixoHibrido = Number(honorario.valorFixo || 0);
        const percentualHibrido = Number(honorario.percentualSucesso || 0);
        const valorPorSucessoHibrido = (valorBase * percentualHibrido) / 100;

        valorCalculado = valorFixoHibrido + valorPorSucessoHibrido;
        detalhes = `R$ ${valorFixoHibrido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (fixo) + R$ ${valorPorSucessoHibrido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${percentualHibrido}% de sucesso)`;
        break;
    }

    return {
      success: true,
      data: {
        valorCalculado,
        detalhes,
        tipo: honorario.tipo,
        valorBase,
      },
    };
  } catch (error) {
    console.error("Erro ao calcular valor do honorário:", error);

    return {
      success: false,
      error: "Erro ao calcular valor do honorário",
    };
  }
}

// ============================================
// OBTER DADOS DE PAGAMENTO DO HONORÁRIO
// ============================================

export async function getDadosPagamentoHonorario(honorarioId: string) {
  try {
    const tenantId = await getTenantId();

    const honorario = await prisma.contratoHonorario.findFirst({
      where: {
        id: honorarioId,
        tenantId,
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            dadosBancarios: {
              include: {
                banco: true,
              },
            },
          },
        },
        dadosBancarios: {
          include: {
            banco: true,
          },
        },
      },
    });

    if (!honorario) {
      return {
        success: false,
        error: "Honorário não encontrado",
      };
    }

    // Usar conta específica do honorário ou herdar do contrato
    const contaBancaria =
      honorario.dadosBancarios || honorario.contrato.dadosBancarios;

    if (!contaBancaria) {
      return {
        success: false,
        error: "Nenhuma conta bancária configurada para este honorário",
      };
    }

    // Calcular valor do honorário
    const valorCalculado = await calcularValorHonorario(honorarioId);

    if (!valorCalculado.success) {
      return valorCalculado;
    }

    const dadosPagamento = {
      honorario: {
        id: honorario.id,
        tipo: honorario.tipo,
        valorCalculado: valorCalculado.data?.valorCalculado || 0,
        detalhes: valorCalculado.data?.detalhes || "",
      },
      contaBancaria: {
        id: contaBancaria.id,
        banco: contaBancaria.banco?.nome || "Banco não informado",
        agencia: contaBancaria.agencia,
        conta: contaBancaria.conta,
        tipoConta: contaBancaria.tipoConta,
        tipoContaBancaria: contaBancaria.tipoContaBancaria,
        chavePix: contaBancaria.chavePix,
        tipoChavePix: contaBancaria.tipoChavePix,
        titular: contaBancaria.titularNome,
        documento: contaBancaria.titularDocumento,
      },
      cliente: {
        nome: honorario.contrato.cliente.nome,
        email: honorario.contrato.cliente.email,
        telefone: honorario.contrato.cliente.telefone,
      },
      contrato: {
        id: honorario.contrato.id,
        titulo: honorario.contrato.titulo,
        valor: Number(honorario.contrato.valor),
      },
    };

    return {
      success: true,
      data: dadosPagamento,
    };
  } catch (error) {
    console.error("Erro ao obter dados de pagamento do honorário:", error);

    return {
      success: false,
      error: "Erro ao obter dados de pagamento",
    };
  }
}
