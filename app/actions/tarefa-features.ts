"use server";

import { getSession } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import logger from "@/lib/logger";

// ============================================
// CHECKLISTS
// ============================================

export async function addChecklistItem(tarefaId: string, titulo: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar tarefa
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

    // Pegar próxima ordem
    const ultimoItem = await prisma.tarefaChecklist.findFirst({
      where: { tarefaId },
      orderBy: { ordem: "desc" },
    });

    const item = await prisma.tarefaChecklist.create({
      data: {
        tarefaId,
        titulo: titulo.trim(),
        ordem: (ultimoItem?.ordem ?? -1) + 1,
        tenantId: user.tenantId,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "ADICIONOU_CHECKLIST",
        descricao: `Adicionou item: ${titulo}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true, item };
  } catch (error) {
    logger.error("Erro ao adicionar item checklist:", error);

    return { success: false, error: "Erro ao adicionar item" };
  }
}

export async function toggleChecklistItem(itemId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const item = await prisma.tarefaChecklist.findFirst({
      where: {
        id: itemId,
        tenantId: user.tenantId,
      },
    });

    if (!item) {
      return { success: false, error: "Item não encontrado" };
    }

    const itemAtualizado = await prisma.tarefaChecklist.update({
      where: { id: itemId },
      data: {
        concluida: !item.concluida,
        concluidaEm: !item.concluida ? new Date() : null,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId: item.tarefaId,
        usuarioId: user.id,
        tipo: itemAtualizado.concluida ? "CONCLUIU_ITEM" : "REABRIU_ITEM",
        descricao: itemAtualizado.concluida
          ? `Marcou item como concluído: ${item.titulo}`
          : `Reabriu item: ${item.titulo}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true, item: itemAtualizado };
  } catch (error) {
    logger.error("Erro ao toggle item checklist:", error);

    return { success: false, error: "Erro ao atualizar item" };
  }
}

export async function deleteChecklistItem(itemId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const item = await prisma.tarefaChecklist.findFirst({
      where: {
        id: itemId,
        tenantId: user.tenantId,
      },
    });

    if (!item) {
      return { success: false, error: "Item não encontrado" };
    }

    await prisma.tarefaChecklist.delete({
      where: { id: itemId },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar item checklist:", error);

    return { success: false, error: "Erro ao deletar item" };
  }
}

export async function getChecklists(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const items = await prisma.tarefaChecklist.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      orderBy: { ordem: "asc" },
    });

    return { success: true, items };
  } catch (error) {
    logger.error("Erro ao listar checklist:", error);

    return { success: false, error: "Erro ao listar checklist" };
  }
}

// ============================================
// COMENTÁRIOS
// ============================================

export async function addComentario(tarefaId: string, conteudo: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!conteudo.trim()) {
      return { success: false, error: "Comentário não pode estar vazio" };
    }

    // Verificar tarefa
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

    const comentario = await prisma.tarefaComentario.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        conteudo: conteudo.trim(),
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "COMENTOU",
        descricao: "Adicionou um comentário",
        tenantId: user.tenantId,
      },
    });

    return { success: true, comentario };
  } catch (error) {
    logger.error("Erro ao adicionar comentário:", error);

    return { success: false, error: "Erro ao adicionar comentário" };
  }
}

export async function updateComentario(comentarioId: string, conteudo: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!conteudo.trim()) {
      return { success: false, error: "Comentário não pode estar vazio" };
    }

    const comentario = await prisma.tarefaComentario.findFirst({
      where: {
        id: comentarioId,
        usuarioId: user.id, // Só pode editar próprio comentário
        tenantId: user.tenantId,
      },
    });

    if (!comentario) {
      return {
        success: false,
        error: "Comentário não encontrado ou sem permissão",
      };
    }

    const comentarioAtualizado = await prisma.tarefaComentario.update({
      where: { id: comentarioId },
      data: {
        conteudo: conteudo.trim(),
        editado: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return { success: true, comentario: comentarioAtualizado };
  } catch (error) {
    logger.error("Erro ao atualizar comentário:", error);

    return { success: false, error: "Erro ao atualizar comentário" };
  }
}

export async function deleteComentario(comentarioId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const comentario = await prisma.tarefaComentario.findFirst({
      where: {
        id: comentarioId,
        usuarioId: user.id, // Só pode deletar próprio comentário
        tenantId: user.tenantId,
      },
    });

    if (!comentario) {
      return {
        success: false,
        error: "Comentário não encontrado ou sem permissão",
      };
    }

    await prisma.tarefaComentario.delete({
      where: { id: comentarioId },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar comentário:", error);

    return { success: false, error: "Erro ao deletar comentário" };
  }
}

export async function getComentarios(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const comentarios = await prisma.tarefaComentario.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, comentarios };
  } catch (error) {
    logger.error("Erro ao listar comentários:", error);

    return { success: false, error: "Erro ao listar comentários" };
  }
}

// ============================================
// TAGS
// ============================================

export async function listTags() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const tags = await prisma.tarefaTag.findMany({
      where: {
        tenantId: user.tenantId,
        ativo: true,
      },
      include: {
        _count: {
          select: {
            tarefas: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    return { success: true, tags };
  } catch (error) {
    logger.error("Erro ao listar tags:", error);

    return { success: false, error: "Erro ao listar tags" };
  }
}

export async function createTag(nome: string, cor: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!nome.trim()) {
      return { success: false, error: "Nome é obrigatório" };
    }

    // Verificar se já existe
    const existente = await prisma.tarefaTag.findFirst({
      where: {
        tenantId: user.tenantId,
        nome: nome.trim(),
      },
    });

    if (existente) {
      return { success: false, error: "Tag já existe" };
    }

    const tag = await prisma.tarefaTag.create({
      data: {
        nome: nome.trim(),
        cor: cor || "#3B82F6",
        tenantId: user.tenantId,
      },
    });

    return { success: true, tag };
  } catch (error) {
    logger.error("Erro ao criar tag:", error);

    return { success: false, error: "Erro ao criar tag" };
  }
}

export async function addTagToTarefa(tarefaId: string, tagId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se já existe a relação
    const existente = await prisma.tarefaTagRelacao.findFirst({
      where: {
        tarefaId,
        tagId,
      },
    });

    if (existente) {
      return { success: false, error: "Tag já adicionada a esta tarefa" };
    }

    const relacao = await prisma.tarefaTagRelacao.create({
      data: {
        tarefaId,
        tagId,
        tenantId: user.tenantId,
      },
      include: {
        tag: true,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "ADICIONOU_TAG",
        descricao: `Adicionou tag: ${relacao.tag.nome}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true, relacao };
  } catch (error) {
    logger.error("Erro ao adicionar tag:", error);

    return { success: false, error: "Erro ao adicionar tag" };
  }
}

export async function removeTagFromTarefa(tarefaId: string, tagId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const relacao = await prisma.tarefaTagRelacao.findFirst({
      where: {
        tarefaId,
        tagId,
        tenantId: user.tenantId,
      },
      include: {
        tag: true,
      },
    });

    if (!relacao) {
      return { success: false, error: "Relação não encontrada" };
    }

    await prisma.tarefaTagRelacao.delete({
      where: { id: relacao.id },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "REMOVEU_TAG",
        descricao: `Removeu tag: ${relacao.tag.nome}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao remover tag:", error);

    return { success: false, error: "Erro ao remover tag" };
  }
}

export async function getTagsDaTarefa(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const relacoes = await prisma.tarefaTagRelacao.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      include: {
        tag: true,
      },
    });

    const tags = relacoes.map((r) => r.tag);

    return { success: true, tags };
  } catch (error) {
    logger.error("Erro ao listar tags da tarefa:", error);

    return { success: false, error: "Erro ao listar tags" };
  }
}

// ============================================
// ANEXOS
// ============================================

export async function addAnexo(
  tarefaId: string,
  nome: string,
  url: string,
  tamanho?: number,
  contentType?: string,
  publicId?: string,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar tarefa
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

    const anexo = await prisma.tarefaAnexo.create({
      data: {
        tarefaId,
        nome,
        url,
        tamanho,
        contentType,
        publicId,
        tenantId: user.tenantId,
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "ANEXOU",
        descricao: `Anexou arquivo: ${nome}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true, anexo };
  } catch (error) {
    logger.error("Erro ao adicionar anexo:", error);

    return { success: false, error: "Erro ao adicionar anexo" };
  }
}

export async function deleteAnexo(anexoId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const anexo = await prisma.tarefaAnexo.findFirst({
      where: {
        id: anexoId,
        tenantId: user.tenantId,
      },
    });

    if (!anexo) {
      return { success: false, error: "Anexo não encontrado" };
    }

    await prisma.tarefaAnexo.delete({
      where: { id: anexoId },
    });

    // TODO: Deletar do Cloudinary também
    // if (anexo.publicId) {
    //   await deleteFromCloudinary(anexo.publicId);
    // }

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId: anexo.tarefaId,
        usuarioId: user.id,
        tipo: "REMOVEU_ANEXO",
        descricao: `Removeu arquivo: ${anexo.nome}`,
        tenantId: user.tenantId,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar anexo:", error);

    return { success: false, error: "Erro ao deletar anexo" };
  }
}

export async function getAnexos(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const anexos = await prisma.tarefaAnexo.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, anexos };
  } catch (error) {
    logger.error("Erro ao listar anexos:", error);

    return { success: false, error: "Erro ao listar anexos" };
  }
}

// ============================================
// ATIVIDADES
// ============================================

export async function getAtividades(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const atividades = await prisma.tarefaAtividade.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limitar a 50 últimas
    });

    return { success: true, atividades };
  } catch (error) {
    logger.error("Erro ao listar atividades:", error);

    return { success: false, error: "Erro ao listar atividades" };
  }
}

// ============================================
// OBSERVADORES (WATCHERS)
// ============================================

export async function addWatcher(tarefaId: string, usuarioId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se já é observador
    const existente = await prisma.tarefaWatcher.findFirst({
      where: {
        tarefaId,
        usuarioId,
      },
    });

    if (existente) {
      return { success: false, error: "Usuário já é observador" };
    }

    const watcher = await prisma.tarefaWatcher.create({
      data: {
        tarefaId,
        usuarioId,
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Registrar atividade
    await prisma.tarefaAtividade.create({
      data: {
        tarefaId,
        usuarioId: user.id,
        tipo: "ADICIONOU_OBSERVADOR",
        descricao: `Adicionou ${watcher.usuario.firstName} como observador`,
        tenantId: user.tenantId,
      },
    });

    return { success: true, watcher };
  } catch (error) {
    logger.error("Erro ao adicionar observador:", error);

    return { success: false, error: "Erro ao adicionar observador" };
  }
}

export async function removeWatcher(tarefaId: string, usuarioId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const watcher = await prisma.tarefaWatcher.findFirst({
      where: {
        tarefaId,
        usuarioId,
        tenantId: user.tenantId,
      },
    });

    if (!watcher) {
      return { success: false, error: "Observador não encontrado" };
    }

    await prisma.tarefaWatcher.delete({
      where: { id: watcher.id },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao remover observador:", error);

    return { success: false, error: "Erro ao remover observador" };
  }
}

export async function getWatchers(tarefaId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    const watchers = await prisma.tarefaWatcher.findMany({
      where: {
        tarefaId,
        tenantId: user.tenantId,
      },
      include: {
        usuario: {
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

    return { success: true, watchers };
  } catch (error) {
    logger.error("Erro ao listar observadores:", error);

    return { success: false, error: "Erro ao listar observadores" };
  }
}
