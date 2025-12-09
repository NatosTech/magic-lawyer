"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { MovimentacaoTipo } from "@/app/generated/prisma";
import {
  extractChangedFieldsFromDiff,
  logAudit,
  toAuditJson,
} from "@/app/lib/audit/log";
import { buildAndamentoDiff } from "@/app/lib/andamentos/diff";

// ============================================
// TIPOS
// ============================================

export interface AndamentoFilters {
  processoId?: string;
  tipo?: MovimentacaoTipo;
  dataInicio?: Date;
  dataFim?: Date;
  searchTerm?: string;
}

export interface AndamentoCreateInput {
  processoId: string;
  titulo: string;
  descricao?: string;
  tipo?: MovimentacaoTipo;
  dataMovimentacao?: Date;
  prazo?: Date;
  geraPrazo?: boolean; // Flag para indicar se deve gerar prazo automático
  // Campos para notificações
  notificarCliente?: boolean;
  notificarEmail?: boolean;
  notificarWhatsapp?: boolean;
  mensagemPersonalizada?: string;
}

export interface AndamentoUpdateInput {
  titulo?: string;
  descricao?: string;
  tipo?: MovimentacaoTipo;
  dataMovimentacao?: Date;
  prazo?: Date;
  // Campos para notificações
  notificarCliente?: boolean;
  notificarEmail?: boolean;
  notificarWhatsapp?: boolean;
  mensagemPersonalizada?: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// VALIDAÇÃO DE TENANT
// ============================================

async function getTenantId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou tenant não encontrado");
  }

  return session.user.tenantId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  return session.user.id;
}

// ============================================
// LISTAGEM
// ============================================

export async function listAndamentos(
  filters: AndamentoFilters,
): Promise<ActionResponse<any[]>> {
  try {
    const session = await getSession();
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const user = session?.user as any;
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    const where: any = {
      tenantId,
      ...(filters.processoId && { processoId: filters.processoId }),
      ...(filters.tipo && { tipo: filters.tipo }),
    };

    // Aplicar escopo de acesso para staff vinculados
    if (
      !isAdmin &&
      user?.role !== "CLIENTE" &&
      session &&
      !filters.processoId
    ) {
      const { getAccessibleAdvogadoIds } = await import(
        "@/app/lib/advogado-access"
      );
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros)
      if (accessibleAdvogados.length > 0) {
        // Filtrar andamentos de processos dos advogados acessíveis
        where.processo = {
          advogadoResponsavelId: {
            in: accessibleAdvogados,
          },
        };
      }
    }

    // Filtro de data
    if (filters.dataInicio || filters.dataFim) {
      where.dataMovimentacao = {};
      if (filters.dataInicio) {
        where.dataMovimentacao.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.dataMovimentacao.lte = filters.dataFim;
      }
    }

    // Busca textual
    if (filters.searchTerm) {
      where.OR = [
        { titulo: { contains: filters.searchTerm, mode: "insensitive" } },
        { descricao: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    const andamentos = await prisma.movimentacaoProcesso.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
        documentos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            url: true,
          },
        },
        prazosRelacionados: {
          select: {
            id: true,
            titulo: true,
            dataVencimento: true,
            status: true,
          },
        },
      },
      orderBy: {
        dataMovimentacao: "desc",
      },
    });

    return {
      success: true,
      data: andamentos,
    };
  } catch (error: any) {
    console.error("Erro ao listar andamentos:", error);

    return {
      success: false,
      error: error.message || "Erro ao listar andamentos",
    };
  }
}

// ============================================
// BUSCAR INDIVIDUAL
// ============================================

export async function getAndamento(
  andamentoId: string,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();

    const andamento = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            cliente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        documentos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            url: true,
            createdAt: true,
          },
        },
        prazosRelacionados: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            dataVencimento: true,
            status: true,
            responsavel: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!andamento) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao buscar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar andamento",
    };
  }
}

// ============================================
// CRIAR ANDAMENTO
// ============================================

export async function createAndamento(
  input: AndamentoCreateInput,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();
    const session = await getSession();
    const actor = session?.user as any;
    const actorName =
      `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
      (actor?.email as string | undefined) ||
      "Usuário";

    // Verificar se processo existe e pertence ao tenant
    const processo = await prisma.processo.findFirst({
      where: {
        id: input.processoId,
        tenantId,
      },
    });

    if (!processo) {
      return {
        success: false,
        error: "Processo não encontrado",
      };
    }

    const andamento = await prisma.movimentacaoProcesso.create({
      data: {
        tenantId,
        processoId: input.processoId,
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        dataMovimentacao: input.dataMovimentacao || new Date(),
        prazo: input.prazo,
        criadoPorId: userId,
        // Campos para notificações
        notificarCliente: input.notificarCliente || false,
        notificarEmail: input.notificarEmail || false,
        notificarWhatsapp: input.notificarWhatsapp || false,
        mensagemPersonalizada: input.mensagemPersonalizada,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    // Se marcado para gerar prazo automático
    if (input.geraPrazo && input.prazo) {
      const prazo = await prisma.processoPrazo.create({
        data: {
          tenantId,
          processoId: input.processoId,
          titulo: `Prazo: ${input.titulo}`,
          descricao: input.descricao,
          dataVencimento: input.prazo,
          status: "ABERTO",
          origemMovimentacaoId: andamento.id,
        },
      });

      // Notificar sobre o novo prazo usando sistema híbrido
      const { publishNotification } = await import(
        "@/app/actions/notifications-hybrid"
      );

      await publishNotification({
        type: "prazo.created",
        title: "Novo Prazo Criado",
        message: `Prazo "${input.titulo}" foi criado para o processo ${processo.numero}. Vencimento: ${input.prazo.toLocaleDateString("pt-BR")}.`,
        urgency: "HIGH",
        channels: ["REALTIME"],
        payload: {
          prazoId: prazo.id,
          processoId: input.processoId,
          processoNumero: processo.numero,
          titulo: input.titulo,
          dataVencimento: input.prazo,
        },
        referenciaTipo: "prazo",
        referenciaId: prazo.id,
      });
    }

    // Notificar envolvidos (advogado responsável e cliente, se existir)
    try {
      const advogado = await prisma.processo.findFirst({
        where: { id: input.processoId, tenantId },
        select: {
          advogadoResponsavel: {
            select: { usuario: { select: { id: true } } },
          },
          cliente: { select: { usuarioId: true, nome: true } },
          numero: true,
        },
      });

      const targetUserIds: string[] = [];
      const advogadoUserId = (advogado?.advogadoResponsavel?.usuario as any)
        ?.id;

      if (advogadoUserId) targetUserIds.push(advogadoUserId);
      if (advogado?.cliente?.usuarioId)
        targetUserIds.push(advogado.cliente.usuarioId);

      const channels = input.notificarEmail
        ? ["REALTIME", "EMAIL"]
        : (["REALTIME"] as ("REALTIME" | "EMAIL")[]);

      for (const uid of targetUserIds) {
        const { HybridNotificationService } = await import(
          "@/app/lib/notifications/hybrid-notification-service"
        );

        await HybridNotificationService.publishNotification({
          type: "andamento.created",
          tenantId,
          userId: uid,
          payload: {
            andamentoId: andamento.id,
            processoId: input.processoId,
            processoNumero: processo.numero,
            titulo: input.titulo,
            descricao: input.descricao ?? andamento.descricao ?? null,
            tipo: input.tipo,
            dataMovimentacao: input.dataMovimentacao || new Date(),
          },
          urgency: "MEDIUM",
          channels,
        } as any);
      }
    } catch (e) {
      console.warn(
        "Falha ao emitir notificações de andamento criado para envolvidos",
        e,
      );
    }

    try {
      const auditDados = toAuditJson({
        andamentoId: andamento.id,
        processoId: input.processoId,
        numeroProcesso: processo.numero,
        titulo: andamento.titulo,
        descricao: andamento.descricao ?? null,
        tipo: andamento.tipo ?? null,
        dataMovimentacao: andamento.dataMovimentacao,
        prazo: andamento.prazo ?? null,
        notificacoes: {
          cliente: andamento.notificarCliente,
          email: andamento.notificarEmail,
          whatsapp: andamento.notificarWhatsapp,
          mensagemPersonalizada: andamento.mensagemPersonalizada ?? null,
        },
        gerouPrazo: Boolean(input.geraPrazo && input.prazo),
        criadoPor: actorName,
        criadoPorId: userId,
      });

      const changedFields = [
        "processoId",
        "titulo",
        "descricao",
        "tipo",
        "dataMovimentacao",
        "prazo",
        "notificarCliente",
        "notificarEmail",
        "notificarWhatsapp",
        "mensagemPersonalizada",
      ];

      if (input.geraPrazo) {
        changedFields.push("geraPrazo");
      }

      await logAudit({
        tenantId,
        usuarioId: userId,
        acao: "ANDAMENTO_CRIADO",
        entidade: "Andamento",
        entidadeId: andamento.id,
        dados: auditDados,
        previousValues: null,
        changedFields,
      });
    } catch (auditError) {
      console.warn(
        "Falha ao registrar auditoria de criação de andamento",
        auditError,
      );
    }

    revalidatePath("/processos");
    revalidatePath(`/processos/${input.processoId}`);

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao criar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao criar andamento",
    };
  }
}

// ============================================
// ATUALIZAR ANDAMENTO
// ============================================

export async function updateAndamento(
  andamentoId: string,
  input: AndamentoUpdateInput,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const actor = session.user as any;
    const actorName =
      `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
      (actor?.email as string | undefined) ||
      "Usuário";

    // Verificar se andamento existe e pertence ao tenant
    const andamentoExistente = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
      select: {
        id: true,
        processoId: true,
        titulo: true,
        descricao: true,
        tipo: true,
        dataMovimentacao: true,
        prazo: true,
        notificarCliente: true,
        notificarEmail: true,
        notificarWhatsapp: true,
        mensagemPersonalizada: true,
      },
    });

    if (!andamentoExistente) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    const andamento = await prisma.movimentacaoProcesso.update({
      where: { id: andamentoId },
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        dataMovimentacao: input.dataMovimentacao,
        prazo: input.prazo,
        // Campos para notificações
        notificarCliente: input.notificarCliente,
        notificarEmail: input.notificarEmail,
        notificarWhatsapp: input.notificarWhatsapp,
        mensagemPersonalizada: input.mensagemPersonalizada,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    const diff = buildAndamentoDiff(andamentoExistente, andamento);
    const hasChanges = diff.items.length > 0;

    // Notificar atualização de andamento para envolvidos (advogado responsável e cliente)
    if (hasChanges) {
      try {
        const proc = await prisma.processo.findFirst({
          where: { id: andamento.processo.id, tenantId },
          select: {
            numero: true,
            advogadoResponsavel: {
              select: { usuario: { select: { id: true } } },
            },
            cliente: { select: { usuarioId: true } },
          },
        });

        const targetUserIds: string[] = [];
        const advogadoUserId = (proc?.advogadoResponsavel?.usuario as any)?.id;

        if (advogadoUserId) targetUserIds.push(advogadoUserId);
        if (proc?.cliente?.usuarioId)
          targetUserIds.push(proc.cliente.usuarioId);

        const channels = input.notificarEmail
          ? ["REALTIME", "EMAIL"]
          : (["REALTIME"] as ("REALTIME" | "EMAIL")[]);

        const { HybridNotificationService } = await import(
          "@/app/lib/notifications/hybrid-notification-service"
        );

        await Promise.all(
          targetUserIds.map((uid) =>
            HybridNotificationService.publishNotification({
              type: "andamento.updated",
              tenantId,
              userId: uid,
              payload: {
                andamentoId: andamento.id,
                processoId: andamento.processo.id,
                processoNumero: proc?.numero || andamento.processo.numero,
                titulo: andamento.titulo,
                descricao: andamento.descricao ?? null,
                tipo: andamento.tipo,
                dataMovimentacao: andamento.dataMovimentacao,
                referenciaTipo: "processo",
                referenciaId: andamento.processo.id,
                diff: diff.items,
                changes: diff.items.map((item) => item.field),
                changesSummary:
                  diff.summary || "Informações do andamento foram atualizadas",
              },
              urgency: "MEDIUM",
              channels,
            } as any),
          ),
        );
      } catch (e) {
        console.warn(
          "Falha ao emitir notificações de andamento atualizado para envolvidos",
          e,
        );
      }

      try {
        const auditDados = toAuditJson({
          andamentoId: andamento.id,
          processoId: andamento.processo.id,
          processoNumero: andamento.processo.numero,
          diff: diff.items,
          changesSummary:
            diff.summary || "Informações do andamento foram atualizadas",
          valoresAtuais: andamento,
          atualizadoPor: actorName,
          atualizadoPorId: userId,
          atualizadoEm: new Date().toISOString(),
        });

        await logAudit({
          tenantId,
          usuarioId: userId,
          acao: "ANDAMENTO_ATUALIZADO",
          entidade: "Andamento",
          entidadeId: andamento.id,
          dados: auditDados,
          previousValues: toAuditJson({
            ...andamentoExistente,
            processoId: andamentoExistente.processoId,
          }),
          changedFields: extractChangedFieldsFromDiff(diff.items),
        });
      } catch (auditError) {
        console.warn(
          "Falha ao registrar auditoria de atualização de andamento",
          auditError,
        );
      }
    }

    revalidatePath("/processos");
    revalidatePath(`/processos/${andamento.processoId}`);

    return {
      success: true,
      data: andamento,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao atualizar andamento",
    };
  }
}

// ============================================
// EXCLUIR ANDAMENTO
// ============================================

export async function deleteAndamento(
  andamentoId: string,
): Promise<ActionResponse<null>> {
  try {
    const tenantId = await getTenantId();
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const actor = session.user as any;
    const actorName =
      `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
      (actor?.email as string | undefined) ||
      "Usuário";

    // Verificar se andamento existe e pertence ao tenant
    const andamento = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId,
      },
    });

    if (!andamento) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    await prisma.movimentacaoProcesso.delete({
      where: { id: andamentoId },
    });

    try {
      await logAudit({
        tenantId,
        usuarioId: userId,
        acao: "ANDAMENTO_EXCLUIDO",
        entidade: "Andamento",
        entidadeId: andamentoId,
        dados: toAuditJson({
          andamentoId,
          processoId: andamento.processoId,
          removidoEm: new Date().toISOString(),
          removidoPor: actorName,
          removidoPorId: userId,
        }),
        previousValues: toAuditJson(andamento),
        changedFields: ["deleted"],
      });
    } catch (auditError) {
      console.warn(
        "Falha ao registrar auditoria de exclusão de andamento",
        auditError,
      );
    }

    revalidatePath("/processos");
    revalidatePath(`/processos/${andamento.processoId}`);

    return {
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.error("Erro ao excluir andamento:", error);

    return {
      success: false,
      error: error.message || "Erro ao excluir andamento",
    };
  }
}

// ============================================
// DASHBOARD/MÉTRICAS
// ============================================

export async function getDashboardAndamentos(
  processoId?: string,
): Promise<ActionResponse<any>> {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    const where: any = { tenantId };

    if (processoId) {
      where.processoId = processoId;
    }

    // Debug temporário
    console.log("getDashboardAndamentos - tenantId:", tenantId);
    console.log("getDashboardAndamentos - userId:", userId);
    console.log("getDashboardAndamentos - where:", where);

    // Usar a mesma lógica da função listAndamentos que está funcionando
    const andamentos = await prisma.movimentacaoProcesso.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    // Calcular métricas a partir dos dados
    const total = andamentos.length;
    const porTipo = andamentos.reduce((acc: any, andamento: any) => {
      const tipo = andamento.tipo;

      acc[tipo] = (acc[tipo] || 0) + 1;

      return acc;
    }, {});

    // Converter para o formato esperado
    const porTipoArray = Object.entries(porTipo).map(([tipo, count]) => ({
      tipo,
      _count: count,
    }));

    const ultimosAndamentos = andamentos
      .sort(
        (a: any, b: any) =>
          new Date(b.dataMovimentacao).getTime() -
          new Date(a.dataMovimentacao).getTime(),
      )
      .slice(0, 10);

    // Debug temporário
    console.log("getDashboardAndamentos - total:", total);
    console.log("getDashboardAndamentos - porTipo:", porTipoArray);
    console.log(
      "getDashboardAndamentos - ultimosAndamentos:",
      ultimosAndamentos.length,
    );

    return {
      success: true,
      data: {
        total,
        porTipo: porTipoArray,
        ultimosAndamentos,
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar dashboard de andamentos:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar dashboard de andamentos",
    };
  }
}

// ============================================
// TIPOS DE MOVIMENTAÇÃO
// ============================================

export async function getTiposMovimentacao(): Promise<
  ActionResponse<MovimentacaoTipo[]>
> {
  try {
    // Retornar os tipos do enum
    const tipos: MovimentacaoTipo[] = [
      "ANDAMENTO",
      "PRAZO",
      "INTIMACAO",
      "AUDIENCIA",
      "ANEXO",
      "OUTRO",
    ];

    return {
      success: true,
      data: tipos,
    };
  } catch (error: any) {
    console.error("Erro ao buscar tipos de movimentação:", error);

    return {
      success: false,
      error: error.message || "Erro ao buscar tipos de movimentação",
    };
  }
}
