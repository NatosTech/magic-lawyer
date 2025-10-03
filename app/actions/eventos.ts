"use server";

import { prisma } from "@/app/lib/prisma";
import { getTenantWithBranding } from "@/app/lib/tenant";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema de validação para eventos
const eventoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  tipo: z.enum(["REUNIAO", "AUDIENCIA", "CONSULTA", "PRAZO", "LEMBRETE"]),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime(),
  local: z.string().optional(),
  participantes: z.array(z.string().email()).optional().default([]),
  processoId: z.string().optional(),
  clienteId: z.string().optional(),
  advogadoResponsavelId: z.string().optional(),
  status: z.enum(["AGENDADO", "CONFIRMADO", "REALIZADO", "CANCELADO"]).default("AGENDADO"),
  lembreteMinutos: z.number().min(0).optional(),
  observacoes: z.string().optional(),
});

export type EventoFormData = z.infer<typeof eventoSchema>;

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
    const validatedData = eventoSchema.parse(formData);

    // Verificar se processo e cliente pertencem ao tenant
    if (validatedData.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: validatedData.processoId,
          tenantId: tenant.id,
        },
      });
      if (!processo) {
        throw new Error("Processo não encontrado ou não pertence ao tenant");
      }
    }

    if (validatedData.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: validatedData.clienteId,
          tenantId: tenant.id,
        },
      });
      if (!cliente) {
        throw new Error("Cliente não encontrado ou não pertence ao tenant");
      }
    }

    if (validatedData.advogadoResponsavelId) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          id: validatedData.advogadoResponsavelId,
          tenantId: tenant.id,
        },
      });
      if (!advogado) {
        throw new Error("Advogado não encontrado ou não pertence ao tenant");
      }
    }

    const evento = await prisma.evento.create({
      data: {
        ...validatedData,
        tenantId: tenant.id,
        criadoPorId: session.user.id,
        dataInicio: new Date(validatedData.dataInicio),
        dataFim: new Date(validatedData.dataFim),
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
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
    const validatedData = formData ? eventoSchema.partial().parse(formData) : {};

    // Verificar relacionamentos se fornecidos
    if (validatedData.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: validatedData.processoId,
          tenantId: tenant.id,
        },
      });
      if (!processo) {
        throw new Error("Processo não encontrado ou não pertence ao tenant");
      }
    }

    if (validatedData.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: validatedData.clienteId,
          tenantId: tenant.id,
        },
      });
      if (!cliente) {
        throw new Error("Cliente não encontrado ou não pertence ao tenant");
      }
    }

    if (validatedData.advogadoResponsavelId) {
      const advogado = await prisma.advogado.findFirst({
        where: {
          id: validatedData.advogadoResponsavelId,
          tenantId: tenant.id,
        },
      });
      if (!advogado) {
        throw new Error("Advogado não encontrado ou não pertence ao tenant");
      }
    }

    const updateData: any = { ...validatedData };

    if (validatedData.dataInicio) {
      updateData.dataInicio = new Date(validatedData.dataInicio);
    }
    if (validatedData.dataFim) {
      updateData.dataFim = new Date(validatedData.dataFim);
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
