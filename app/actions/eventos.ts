"use server";

import { prisma } from "@/app/lib/prisma";
import { getTenantWithBranding } from "@/app/lib/tenant";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";
// Usar tipos do Prisma - sempre sincronizado com o banco!
import type { Evento, EventoTipo, EventoStatus } from "@/app/generated/prisma";

// Tipo para criação de evento (sem campos auto-gerados)
export type EventoFormData = Omit<Evento, "id" | "tenantId" | "criadoPorId" | "createdAt" | "updatedAt"> & {
  dataInicio: string; // String para o formulário, será convertido para Date
  dataFim: string; // String para o formulário, será convertido para Date
};

// Função de validação simples usando tipos do Prisma
function validateEvento(data: EventoFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validações básicas
  if (!data.titulo?.trim()) {
    errors.push("Título é obrigatório");
  }

  if (!data.tipo) {
    errors.push("Tipo de evento é obrigatório");
  }

  if (!data.dataInicio) {
    errors.push("Data de início é obrigatória");
  }

  if (!data.dataFim) {
    errors.push("Data de fim é obrigatória");
  }

  // Validação de datas
  if (data.dataInicio && data.dataFim) {
    const inicio = new Date(data.dataInicio);
    const fim = new Date(data.dataFim);
    if (fim <= inicio) {
      errors.push("Data de fim deve ser posterior à data de início");
    }
  }

  // Validação de emails dos participantes
  if (data.participantes) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of data.participantes) {
      if (!emailRegex.test(email)) {
        errors.push(`Email inválido: ${email}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Função auxiliar para buscar o tenant do usuário atual
async function getCurrentTenant(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });

  if (!usuario) {
    return null;
  }

  return await getTenantWithBranding(usuario.tenantId);
}

// Buscar eventos do tenant atual
export async function getEventos(filters?: { dataInicio?: Date; dataFim?: Date; status?: string; tipo?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    const where: any = {
      tenantId: tenant.id,
    };

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataInicio = {};
      if (filters.dataInicio) {
        where.dataInicio.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.dataInicio.lte = filters.dataFim;
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    const eventos = await prisma.evento.findMany({
      where,
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    return { success: true, data: eventos };
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Buscar evento por ID
export async function getEventoById(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    const evento = await prisma.evento.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!evento) {
      throw new Error("Evento não encontrado");
    }

    return { success: true, data: evento };
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Criar novo evento
export async function createEvento(formData: EventoFormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    // Validar dados
    const validation = validateEvento(formData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(". "),
      };
    }

    // Verificar se processo e cliente pertencem ao tenant
    if (formData.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: formData.processoId,
          tenantId: tenant.id,
        },
        select: { id: true, numero: true, titulo: true },
      });
      if (!processo) {
        return {
          success: false,
          error: "Processo selecionado não foi encontrado. Verifique se o processo existe e pertence ao seu escritório.",
        };
      }
    }

    if (formData.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: formData.clienteId,
          tenantId: tenant.id,
        },
        select: { id: true, nome: true },
      });
      if (!cliente) {
        return {
          success: false,
          error: "Cliente selecionado não foi encontrado. Verifique se o cliente existe e pertence ao seu escritório.",
        };
      }
    }

    if (formData.advogadoResponsavelId) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          id: formData.advogadoResponsavelId,
          tenantId: tenant.id,
        },
        select: {
          id: true,
          usuario: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });
      if (!advogado) {
        return {
          success: false,
          error: "Advogado selecionado não foi encontrado. Verifique se o advogado existe e pertence ao seu escritório.",
        };
      }
    }

    const evento = await prisma.evento.create({
      data: {
        ...formData,
        tenantId: tenant.id,
        criadoPorId: session.user.id,
        dataInicio: new Date(formData.dataInicio),
        dataFim: new Date(formData.dataFim),
      },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/agenda");
    return { success: true, data: evento };
  } catch (error) {
    console.error("Erro ao criar evento:", error);

    // Tratar erros específicos do Prisma
    if (error instanceof Error) {
      if (error.message.includes("P2003")) {
        return {
          success: false,
          error: "Erro de referência: um dos itens selecionados (processo, cliente ou advogado) não existe mais. Por favor, recarregue a página e tente novamente.",
        };
      }
      if (error.message.includes("P2002")) {
        return {
          success: false,
          error: "Já existe um evento com essas características. Verifique os dados e tente novamente.",
        };
      }
      if (error.message.includes("ZodError") || error.message.includes("Validation")) {
        return {
          success: false,
          error: "Dados inválidos. Verifique se todos os campos obrigatórios estão preenchidos corretamente.",
        };
      }
    }

    return {
      success: false,
      error: "Erro interno do servidor. Tente novamente em alguns instantes.",
    };
  }
}

// Atualizar evento
export async function updateEvento(id: string, formData: Partial<EventoFormData>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    // Verificar se o evento existe e pertence ao tenant
    const eventoExistente = await prisma.evento.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!eventoExistente) {
      throw new Error("Evento não encontrado");
    }

    // Validar dados se fornecidos
    if (formData) {
      const validation = validateEvento(formData as EventoFormData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(". "),
        };
      }
    }

    // Verificar relacionamentos se fornecidos
    if (formData?.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: formData.processoId,
          tenantId: tenant.id,
        },
      });
      if (!processo) {
        return {
          success: false,
          error: "Processo selecionado não foi encontrado. Verifique se o processo existe e pertence ao seu escritório.",
        };
      }
    }

    if (formData?.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: formData.clienteId,
          tenantId: tenant.id,
        },
      });
      if (!cliente) {
        return {
          success: false,
          error: "Cliente selecionado não foi encontrado. Verifique se o cliente existe e pertence ao seu escritório.",
        };
      }
    }

    if (formData?.advogadoResponsavelId) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          id: formData.advogadoResponsavelId,
          tenantId: tenant.id,
        },
      });
      if (!advogado) {
        return {
          success: false,
          error: "Advogado selecionado não foi encontrado. Verifique se o advogado existe e pertence ao seu escritório.",
        };
      }
    }

    const updateData: any = { ...formData };

    if (formData?.dataInicio) {
      updateData.dataInicio = new Date(formData.dataInicio);
    }
    if (formData?.dataFim) {
      updateData.dataFim = new Date(formData.dataFim);
    }

    const evento = await prisma.evento.update({
      where: { id },
      data: updateData,
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/agenda");
    return { success: true, data: evento };
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Deletar evento
export async function deleteEvento(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    // Verificar se o evento existe e pertence ao tenant
    const evento = await prisma.evento.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!evento) {
      throw new Error("Evento não encontrado");
    }

    await prisma.evento.delete({
      where: { id },
    });

    revalidatePath("/agenda");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Marcar evento como realizado
export async function marcarEventoComoRealizado(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    const evento = await prisma.evento.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        status: "REALIZADO",
      },
    });

    revalidatePath("/agenda");
    return { success: true, data: evento };
  } catch (error) {
    console.error("Erro ao marcar evento como realizado:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Buscar dados para formulários (processos, clientes, advogados)
export async function getEventoFormData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    const [processos, clientes, advogados] = await Promise.all([
      prisma.processo.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          numero: true,
          titulo: true,
        },
        orderBy: { numero: "desc" },
      }),
      prisma.cliente.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          nome: true,
          email: true,
        },
        orderBy: { nome: "asc" },
      }),
      prisma.advogado.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          usuario: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { usuario: { firstName: "asc" } },
      }),
    ]);

    return {
      success: true,
      data: { processos, clientes, advogados },
    };
  } catch (error) {
    console.error("Erro ao buscar dados do formulário:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
