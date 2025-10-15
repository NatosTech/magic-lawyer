"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface TarefaCreatePayload {
  titulo: string;
  descricao?: string | null;
  prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  dataLimite?: string | null; // ISO string
  dataInicio?: string | null; // ISO string
  lembreteEm?: string | null; // ISO string
  processoId?: string | null;
  clienteId?: string | null;
  categoriaId?: string | null;
  responsavelId?: string | null;
  boardId?: string | null;
  columnId?: string | null;
  estimativaHoras?: number | null;
  cor?: string | null;
  tarefaPaiId?: string | null;
}

export interface TarefaUpdatePayload {
  titulo?: string;
  descricao?: string | null;
  status?: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  dataLimite?: string | null;
  dataInicio?: string | null;
  lembreteEm?: string | null;
  responsavelId?: string | null;
  categoriaId?: string | null;
  boardId?: string | null;
  columnId?: string | null;
  estimativaHoras?: number | null;
  horasGastas?: number | null;
  cor?: string | null;
  arquivada?: boolean;
}

export async function listTarefas(params?: {
  status?: string;
  prioridade?: string;
  responsavelId?: string;
  processoId?: string;
  clienteId?: string;
  categoriaId?: string;
  atrasadas?: boolean;
  minhas?: boolean; // Apenas tarefas do usuário logado
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const where: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Filtros opcionais
    if (params?.status) {
      where.status = params.status;
    }

    if (params?.prioridade) {
      where.prioridade = params.prioridade;
    }

    if (params?.responsavelId) {
      where.responsavelId = params.responsavelId;
    }

    if (params?.processoId) {
      where.processoId = params.processoId;
    }

    if (params?.clienteId) {
      where.clienteId = params.clienteId;
    }

    if (params?.categoriaId) {
      where.categoriaId = params.categoriaId;
    }

    // Apenas tarefas do usuário logado
    if (params?.minhas) {
      where.responsavelId = user.id;
    }

    // Tarefas atrasadas
    if (params?.atrasadas) {
      where.dataLimite = {
        lt: new Date(),
      };
      where.status = {
        notIn: ["CONCLUIDA", "CANCELADA"],
      };
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
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
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { prioridade: "desc" },
        { dataLimite: "asc" },
      ],
    });

    return { success: true, tarefas };
  } catch (error) {
    logger.error("Erro ao listar tarefas:", error);

    return { success: false, error: "Erro ao listar tarefas" };
  }
}

export async function getTarefa(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tarefa = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
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
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            status: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });

    if (!tarefa) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    return { success: true, tarefa };
  } catch (error) {
    logger.error("Erro ao buscar tarefa:", error);

    return { success: false, error: "Erro ao buscar tarefa" };
  }
}

export async function createTarefa(data: TarefaCreatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Validações
    if (!data.titulo?.trim()) {
      return { success: false, error: "Título é obrigatório" };
    }

    // Verificar se processo existe (se fornecido)
    if (data.processoId) {
      const processo = await prisma.processo.findFirst({
        where: {
          id: data.processoId,
          tenantId: user.tenantId,
        },
      });

      if (!processo) {
        return { success: false, error: "Processo não encontrado" };
      }
    }

    // Verificar se cliente existe (se fornecido)
    if (data.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: data.clienteId,
          tenantId: user.tenantId,
        },
      });

      if (!cliente) {
        return { success: false, error: "Cliente não encontrado" };
      }
    }

    // Verificar se categoria existe (se fornecida)
    if (data.categoriaId) {
      const categoria = await prisma.categoriaTarefa.findFirst({
        where: {
          id: data.categoriaId,
          tenantId: user.tenantId,
        },
      });

      if (!categoria) {
        return { success: false, error: "Categoria não encontrada" };
      }
    }

    // Verificar se responsável existe (se fornecido)
    if (data.responsavelId) {
      const responsavel = await prisma.usuario.findFirst({
        where: {
          id: data.responsavelId,
          tenantId: user.tenantId,
        },
      });

      if (!responsavel) {
        return { success: false, error: "Responsável não encontrado" };
      }
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: data.titulo.trim(),
        descricao: data.descricao?.trim(),
        prioridade: data.prioridade || "MEDIA",
        status: "PENDENTE",
        dataLimite: data.dataLimite ? new Date(data.dataLimite) : null,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        lembreteEm: data.lembreteEm ? new Date(data.lembreteEm) : null,
        processoId: data.processoId,
        clienteId: data.clienteId,
        categoriaId: data.categoriaId,
        responsavelId: data.responsavelId,
        boardId: data.boardId,
        columnId: data.columnId,
        estimativaHoras: data.estimativaHoras,
        cor: data.cor,
        tarefaPaiId: data.tarefaPaiId,
        criadoPorId: user.id,
        tenantId: user.tenantId,
      },
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
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
          },
        },
      },
    });

    logger.info(`Tarefa criada: ${tarefa.id} por usuário ${user.email}`);

    return { success: true, tarefa };
  } catch (error) {
    logger.error("Erro ao criar tarefa:", error);

    return { success: false, error: "Erro ao criar tarefa" };
  }
}

export async function updateTarefa(id: string, data: TarefaUpdatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se a tarefa existe e pertence ao tenant
    const tarefaExistente = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!tarefaExistente) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Verificar se responsável existe (se fornecido)
    if (data.responsavelId) {
      const responsavel = await prisma.usuario.findFirst({
        where: {
          id: data.responsavelId,
          tenantId: user.tenantId,
        },
      });

      if (!responsavel) {
        return { success: false, error: "Responsável não encontrado" };
      }
    }

    // Verificar se categoria existe (se fornecida)
    if (data.categoriaId) {
      const categoria = await prisma.categoriaTarefa.findFirst({
        where: {
          id: data.categoriaId,
          tenantId: user.tenantId,
        },
      });

      if (!categoria) {
        return { success: false, error: "Categoria não encontrada" };
      }
    }

    const updateData: any = {};

    if (data.titulo !== undefined) updateData.titulo = data.titulo.trim();
    if (data.descricao !== undefined)
      updateData.descricao = data.descricao?.trim();
    if (data.status !== undefined) updateData.status = data.status;
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
    if (data.responsavelId !== undefined)
      updateData.responsavelId = data.responsavelId;
    if (data.categoriaId !== undefined)
      updateData.categoriaId = data.categoriaId;
    if (data.boardId !== undefined) updateData.boardId = data.boardId;
    if (data.columnId !== undefined) updateData.columnId = data.columnId;
    if (data.estimativaHoras !== undefined)
      updateData.estimativaHoras = data.estimativaHoras;
    if (data.horasGastas !== undefined)
      updateData.horasGastas = data.horasGastas;
    if (data.cor !== undefined) updateData.cor = data.cor;
    if (data.arquivada !== undefined) updateData.arquivada = data.arquivada;

    if (data.dataLimite !== undefined) {
      updateData.dataLimite = data.dataLimite
        ? new Date(data.dataLimite)
        : null;
    }

    if (data.dataInicio !== undefined) {
      updateData.dataInicio = data.dataInicio
        ? new Date(data.dataInicio)
        : null;
    }

    if (data.lembreteEm !== undefined) {
      updateData.lembreteEm = data.lembreteEm
        ? new Date(data.lembreteEm)
        : null;
    }

    // Se marcar como concluída, registrar data
    if (data.status === "CONCLUIDA" && tarefaExistente.status !== "CONCLUIDA") {
      updateData.completedAt = new Date();
    }

    // Se desmarcar como concluída, limpar data
    if (
      data.status &&
      data.status !== "CONCLUIDA" &&
      tarefaExistente.completedAt
    ) {
      updateData.completedAt = null;
    }

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: updateData,
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
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
          },
        },
      },
    });

    logger.info(`Tarefa atualizada: ${id} por usuário ${user.email}`);

    return { success: true, tarefa };
  } catch (error) {
    logger.error("Erro ao atualizar tarefa:", error);

    return { success: false, error: "Erro ao atualizar tarefa" };
  }
}

export async function deleteTarefa(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se a tarefa existe e pertence ao tenant
    const tarefa = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!tarefa) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Soft delete
    await prisma.tarefa.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.info(`Tarefa deletada: ${id} por usuário ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar tarefa:", error);

    return { success: false, error: "Erro ao deletar tarefa" };
  }
}

export async function marcarTarefaConcluida(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tarefa = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!tarefa) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        status: "CONCLUIDA",
        completedAt: new Date(),
      },
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info(
      `Tarefa marcada como concluída: ${id} por usuário ${user.email}`,
    );

    return { success: true, tarefa: tarefaAtualizada };
  } catch (error) {
    logger.error("Erro ao marcar tarefa como concluída:", error);

    return { success: false, error: "Erro ao marcar tarefa como concluída" };
  }
}

export async function getDashboardTarefas() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);

    amanha.setDate(amanha.getDate() + 1);

    const proximosDias = new Date(hoje);

    proximosDias.setDate(proximosDias.getDate() + 7);

    // Tarefas do usuário logado
    const minhasTarefas = await prisma.tarefa.count({
      where: {
        tenantId: user.tenantId,
        responsavelId: user.id,
        deletedAt: null,
        status: {
          notIn: ["CONCLUIDA", "CANCELADA"],
        },
      },
    });

    // Tarefas atrasadas
    const atrasadas = await prisma.tarefa.count({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        status: {
          notIn: ["CONCLUIDA", "CANCELADA"],
        },
        dataLimite: {
          lt: hoje,
        },
      },
    });

    // Tarefas de hoje
    const hoje_count = await prisma.tarefa.count({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        status: {
          notIn: ["CONCLUIDA", "CANCELADA"],
        },
        dataLimite: {
          gte: hoje,
          lt: amanha,
        },
      },
    });

    // Tarefas próximos 7 dias
    const proximosDias_count = await prisma.tarefa.count({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        status: {
          notIn: ["CONCLUIDA", "CANCELADA"],
        },
        dataLimite: {
          gte: hoje,
          lt: proximosDias,
        },
      },
    });

    // Por prioridade
    const porPrioridade = await prisma.tarefa.groupBy({
      by: ["prioridade"],
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        status: {
          notIn: ["CONCLUIDA", "CANCELADA"],
        },
      },
      _count: true,
    });

    // Por status
    const porStatus = await prisma.tarefa.groupBy({
      by: ["status"],
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
      },
      _count: true,
    });

    return {
      success: true,
      dashboard: {
        minhasTarefas,
        atrasadas,
        hoje: hoje_count,
        proximosDias: proximosDias_count,
        porPrioridade,
        porStatus,
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar dashboard de tarefas:", error);

    return { success: false, error: "Erro ao buscar dashboard de tarefas" };
  }
}

// ============================================
// FUNÇÕES ESPECÍFICAS DO KANBAN
// ============================================

export async function getTarefasPorBoard(
  boardId: string,
  params?: {
    columnId?: string;
    incluirArquivadas?: boolean;
  },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const where: any = {
      tenantId: user.tenantId,
      boardId,
      deletedAt: null,
    };

    if (params?.columnId) {
      where.columnId = params.columnId;
    }

    if (!params?.incluirArquivadas) {
      where.arquivada = false;
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
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
          },
        },
        _count: {
          select: {
            checklists: true,
            comentarios: true,
            anexos: true,
            subtarefas: {
              where: {
                deletedAt: null,
              },
            },
            tags: true,
          },
        },
      },
      orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, tarefas };
  } catch (error) {
    logger.error("Erro ao buscar tarefas do board:", error);

    return { success: false, error: "Erro ao buscar tarefas do board" };
  }
}

export async function moverTarefa(
  tarefaId: string,
  columnId: string,
  ordem: number,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se a tarefa existe
    const tarefa = await prisma.tarefa.findFirst({
      where: {
        id: tarefaId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!tarefa) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Verificar se a coluna existe
    const column = await prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        tenantId: user.tenantId,
      },
    });

    if (!column) {
      return { success: false, error: "Coluna não encontrada" };
    }

    // Atualizar tarefa
    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id: tarefaId },
      data: {
        columnId,
        boardId: column.boardId,
        ordem,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "MOVEU",
        descricao: `Moveu a tarefa para ${column.nome}`,
        tenantId: user.tenantId,
      },
    });

    logger.info(
      `Tarefa ${tarefaId} movida para coluna ${columnId} por usuário ${user.email}`,
    );

    return { success: true, tarefa: tarefaAtualizada };
  } catch (error) {
    logger.error("Erro ao mover tarefa:", error);

    return { success: false, error: "Erro ao mover tarefa" };
  }
}

export async function reordenarTarefas(
  columnId: string,
  tarefaOrders: Array<{ id: string; ordem: number }>,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se coluna existe
    const column = await prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        tenantId: user.tenantId,
      },
    });

    if (!column) {
      return { success: false, error: "Coluna não encontrada" };
    }

    // Atualizar ordem de cada tarefa
    await prisma.$transaction(
      tarefaOrders.map(({ id, ordem }) =>
        prisma.tarefa.update({
          where: { id },
          data: { ordem },
        }),
      ),
    );

    logger.info(
      `Tarefas reordenadas na coluna ${columnId} por usuário ${user.email}`,
    );

    return { success: true };
  } catch (error) {
    logger.error("Erro ao reordenar tarefas:", error);

    return { success: false, error: "Erro ao reordenar tarefas" };
  }
}

export async function arquivarTarefa(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tarefa = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!tarefa) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        arquivada: true,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId: id,
        usuarioId: user.id,
        tipo: "ARQUIVOU",
        descricao: "Arquivou a tarefa",
        tenantId: user.tenantId,
      },
    });

    logger.info(`Tarefa arquivada: ${id} por usuário ${user.email}`);

    return { success: true, tarefa: tarefaAtualizada };
  } catch (error) {
    logger.error("Erro ao arquivar tarefa:", error);

    return { success: false, error: "Erro ao arquivar tarefa" };
  }
}

export async function duplicarTarefa(id: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Buscar tarefa original
    const tarefaOriginal = await prisma.tarefa.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        checklists: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!tarefaOriginal) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Criar nova tarefa
    const novaTarefa = await prisma.tarefa.create({
      data: {
        titulo: `${tarefaOriginal.titulo} (cópia)`,
        descricao: tarefaOriginal.descricao,
        prioridade: tarefaOriginal.prioridade,
        status: "PENDENTE",
        processoId: tarefaOriginal.processoId,
        clienteId: tarefaOriginal.clienteId,
        categoriaId: tarefaOriginal.categoriaId,
        responsavelId: tarefaOriginal.responsavelId,
        boardId: tarefaOriginal.boardId,
        columnId: tarefaOriginal.columnId,
        estimativaHoras: tarefaOriginal.estimativaHoras,
        cor: tarefaOriginal.cor,
        criadoPorId: user.id,
        tenantId: user.tenantId,
      },
    });

    // Duplicar checklists
    if (tarefaOriginal.checklists.length > 0) {
      await prisma.tarefaChecklist.createMany({
        data: tarefaOriginal.checklists.map((check) => ({
          tarefaId: novaTarefa.id,
          titulo: check.titulo,
          ordem: check.ordem,
          tenantId: user.tenantId,
        })),
      });
    }

    // Duplicar tags
    if (tarefaOriginal.tags.length > 0) {
      await prisma.tarefaTagRelacao.createMany({
        data: tarefaOriginal.tags.map((rel) => ({
          tarefaId: novaTarefa.id,
          tagId: rel.tagId,
          tenantId: user.tenantId,
        })),
      });
    }

    logger.info(
      `Tarefa duplicada: ${id} → ${novaTarefa.id} por usuário ${user.email}`,
    );

    return { success: true, tarefa: novaTarefa };
  } catch (error) {
    logger.error("Erro ao duplicar tarefa:", error);

    return { success: false, error: "Erro ao duplicar tarefa" };
  }
}
