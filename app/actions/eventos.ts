"use server";

import { prisma } from "@/app/lib/prisma";
import { getTenantWithBranding } from "@/app/lib/tenant";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";
// Usar tipos do Prisma - sempre sincronizado com o banco!
import type { Evento, EventoTipo, EventoStatus, EventoParticipante, EventoConfirmacaoStatus } from "@/app/generated/prisma";

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
  // Primeiro verificar se é SuperAdmin
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (superAdmin) {
    // SuperAdmin não tem tenant, retorna null
    return null;
  }

  // Se não é SuperAdmin, buscar como usuário normal
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });

  if (!usuario) {
    return null;
  }

  return await getTenantWithBranding(usuario.tenantId);
}

// Função auxiliar para buscar o cliente associado ao usuário
async function getCurrentCliente(userId: string) {
  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: userId,
      deletedAt: null, // Não deletado
    },
    select: { id: true, nome: true },
  });

  return cliente;
}

// Buscar eventos do tenant atual
export async function getEventos(filters?: { dataInicio?: Date; dataFim?: Date; status?: string; tipo?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);

    // SuperAdmin não tem eventos específicos por enquanto
    if (!tenant) {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });

      if (superAdmin) {
        // SuperAdmin - retorna array vazio
        return {
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          },
        };
      }

      throw new Error("Tenant não encontrado");
    }

    const where: any = {
      tenantId: tenant.id,
    };

    // Se o usuário for um cliente, filtrar apenas eventos relacionados aos seus processos
    const userRole = (session.user as any)?.role;
    if (userRole === "CLIENTE") {
      const cliente = await getCurrentCliente(session.user.id);
      if (cliente) {
        where.clienteId = cliente.id;
      } else {
        // Cliente sem registro na tabela Cliente - não tem eventos
        return {
          success: true,
          data: [],
        };
      }
    }

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
        confirmacoes: {
          select: {
            id: true,
            participanteEmail: true,
            participanteNome: true,
            status: true,
            confirmadoEm: true,
            observacoes: true,
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

    const where: any = {
      id,
      tenantId: tenant.id,
    };

    // Se o usuário for um cliente, verificar se o evento pertence aos seus processos
    const userRole = (session.user as any)?.role;
    if (userRole === "CLIENTE") {
      const cliente = await getCurrentCliente(session.user.id);
      if (cliente) {
        where.clienteId = cliente.id;
      } else {
        throw new Error("Cliente não encontrado");
      }
    }

    const evento = await prisma.evento.findFirst({
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
        confirmacoes: {
          select: {
            id: true,
            participanteEmail: true,
            participanteNome: true,
            status: true,
            confirmadoEm: true,
            observacoes: true,
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
        confirmacoes: {
          select: {
            id: true,
            participanteEmail: true,
            participanteNome: true,
            status: true,
            confirmadoEm: true,
            observacoes: true,
          },
        },
      },
    });

    // Criar registros de confirmação para os participantes
    if (formData.participantes && formData.participantes.length > 0) {
      const confirmacoesData = formData.participantes.map((email) => ({
        tenantId: tenant.id,
        eventoId: evento.id,
        participanteEmail: email,
        status: "PENDENTE" as EventoConfirmacaoStatus,
      }));

      await prisma.eventoParticipante.createMany({
        data: confirmacoesData,
      });

      // Criar notificações para os participantes
      const notificacoesData = formData.participantes.map((email) => ({
        tenantId: tenant.id,
        titulo: "Novo Evento - Confirmação Necessária",
        mensagem: `Você foi convidado para o evento "${evento.titulo}" em ${new Date(evento.dataInicio).toLocaleDateString("pt-BR")} às ${new Date(evento.dataInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Por favor, confirme sua participação.`,
        tipo: "OUTRO" as any,
        prioridade: "MEDIA" as any,
        canais: ["IN_APP"] as any,
        referenciaTipo: "EVENTO",
        referenciaId: evento.id,
        dados: {
          eventoId: evento.id,
          participanteEmail: email,
          tipoConfirmacao: "INVITE",
          eventoTitulo: evento.titulo,
          eventoData: evento.dataInicio,
          eventoLocal: evento.local,
        },
        createdById: session.user.id,
      }));

      await prisma.notificacao.createMany({
        data: notificacoesData,
      });
    }

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

    // Buscar evento atual para comparar mudanças
    const eventoAtual = await prisma.evento.findUnique({
      where: { id },
      select: {
        dataInicio: true,
        dataFim: true,
        local: true,
        participantes: true,
        titulo: true,
      },
    });

    if (!eventoAtual) {
      throw new Error("Evento não encontrado");
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

    // Verificar se houve mudanças que exigem re-confirmação
    const mudancasCriticas =
      eventoAtual.dataInicio.getTime() !== (formData?.dataInicio ? new Date(formData.dataInicio).getTime() : eventoAtual.dataInicio.getTime()) ||
      eventoAtual.dataFim.getTime() !== (formData?.dataFim ? new Date(formData.dataFim).getTime() : eventoAtual.dataFim.getTime()) ||
      eventoAtual.local !== (formData?.local || eventoAtual.local) ||
      JSON.stringify(eventoAtual.participantes.sort()) !== JSON.stringify((formData?.participantes || eventoAtual.participantes).sort());

    if (mudancasCriticas) {
      // Resetar todas as confirmações para PENDENTE
      await prisma.eventoParticipante.updateMany({
        where: {
          eventoId: id,
          tenantId: tenant.id,
        },
        data: {
          status: "PENDENTE",
          confirmadoEm: null,
          observacoes: "Evento alterado - confirmação necessária",
        },
      });

      // Criar notificações para todos os participantes sobre a mudança
      const participantes = formData?.participantes || eventoAtual.participantes;
      if (participantes.length > 0) {
        const notificacoesData = participantes.map((email) => ({
          tenantId: tenant.id,
          titulo: "Evento Alterado - Nova Confirmação Necessária",
          mensagem: `O evento "${eventoAtual.titulo}" foi alterado. Por favor, confirme novamente sua participação.`,
          tipo: "OUTRO" as any,
          prioridade: "ALTA" as any,
          canais: ["IN_APP"] as any,
          referenciaTipo: "EVENTO",
          referenciaId: evento.id,
          dados: {
            eventoId: evento.id,
            participanteEmail: email,
            tipoConfirmacao: "RE_CONFIRMACAO",
            motivo: "Evento alterado",
            eventoTitulo: eventoAtual.titulo,
            eventoData: evento.dataInicio,
            eventoLocal: evento.local,
          },
          createdById: session.user.id,
        }));

        await prisma.notificacao.createMany({
          data: notificacoesData,
        });
      }
    }

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

    const where: any = {
      id,
      tenantId: tenant.id,
    };

    // Se o usuário for um cliente, verificar se o evento pertence aos seus processos
    const userRole = (session.user as any)?.role;
    if (userRole === "CLIENTE") {
      const cliente = await getCurrentCliente(session.user.id);
      if (cliente) {
        where.clienteId = cliente.id;
      } else {
        throw new Error("Cliente não encontrado");
      }
    }

    const evento = await prisma.evento.update({
      where,
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

// Confirmar participação em evento
export async function confirmarParticipacaoEvento(eventoId: string, participanteEmail: string, status: EventoConfirmacaoStatus, observacoes?: string) {
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
        id: eventoId,
        tenantId: tenant.id,
      },
    });

    if (!evento) {
      throw new Error("Evento não encontrado");
    }

    // Verificar se o participante está na lista de participantes do evento
    if (!evento.participantes.includes(participanteEmail)) {
      throw new Error("Participante não está na lista de participantes do evento");
    }

    // Atualizar ou criar confirmação
    const confirmacao = await prisma.eventoParticipante.upsert({
      where: {
        eventoId_participanteEmail: {
          eventoId,
          participanteEmail,
        },
      },
      update: {
        status,
        confirmadoEm: new Date(),
        observacoes,
      },
      create: {
        tenantId: tenant.id,
        eventoId,
        participanteEmail,
        status,
        confirmadoEm: new Date(),
        observacoes,
      },
    });

    // Criar notificações para todos os outros participantes do evento
    const statusLabels: Record<EventoConfirmacaoStatus, string> = {
      PENDENTE: "atualizou a confirmação",
      CONFIRMADO: "confirmou",
      RECUSADO: "recusou",
      TALVEZ: "marcou como talvez",
    };

    const statusLabel = statusLabels[status];
    const outrosParticipantes = evento.participantes.filter((email) => email !== participanteEmail);

    if (outrosParticipantes.length > 0) {
      const notificacoesData = outrosParticipantes.map((email) => ({
        tenantId: tenant.id,
        titulo: "Atualização de Confirmação",
        mensagem: `${participanteEmail} ${statusLabel} o evento "${evento.titulo}".`,
        tipo: "OUTRO" as any,
        prioridade: "BAIXA" as any,
        canais: ["IN_APP"] as any,
        referenciaTipo: "EVENTO",
        referenciaId: eventoId,
        dados: {
          eventoId,
          participanteEmail,
          status,
          tipoConfirmacao: "RESPONSE",
          destinatarioEmail: email,
        },
        createdById: session.user.id,
      }));

      await prisma.notificacao.createMany({
        data: notificacoesData,
      });
    }

    revalidatePath("/agenda");
    return { success: true, data: confirmacao };
  } catch (error) {
    console.error("Erro ao confirmar participação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// Buscar confirmações de um evento
export async function getConfirmacoesEvento(eventoId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const tenant = await getCurrentTenant(session.user.id);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    const confirmacoes = await prisma.eventoParticipante.findMany({
      where: {
        eventoId,
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: true, data: confirmacoes };
  } catch (error) {
    console.error("Erro ao buscar confirmações:", error);
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
          clienteId: true,
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
