"use server";

import { getSession } from "@/app/lib/auth";
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
import logger from "@/lib/logger";

export interface DiligenciaCreatePayload {
  titulo: string;
  tipo?: string | null;
  descricao?: string | null;
  processoId?: string | null;
  causaId?: string | null;
  contratoId?: string | null;
  peticaoId?: string | null;
  documentoId?: string | null;
  regimePrazoId?: string | null;
  responsavelId?: string | null;
  prazoPrevisto?: string | null; // ISO string
}

export interface DiligenciaUpdatePayload {
  titulo?: string;
  tipo?: string | null;
  descricao?: string | null;
  responsavelId?: string | null;
  prazoPrevisto?: string | null;
  prazoConclusao?: string | null;
  status?: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  observacoes?: string | null;
}

export async function listDiligencias(params?: { status?: string; processoId?: string; causaId?: string }) {
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
    };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.processoId) {
      where.processoId = params.processoId;
    }

    if (params?.causaId) {
      where.causaId = params.causaId;
    }

    const diligencias = await prisma.diligencia.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        processo: true,
        causa: true,
        contrato: true,
        responsavel: true,
      },
    });

    // Converter valores Decimal para number recursivamente
    const diligenciasFormatted = diligencias.map((diligencia) => {
      const diligenciaConvertida = convertAllDecimalFields(diligencia);

      // Converter também os relacionamentos
      if (diligenciaConvertida.processo) {
        diligenciaConvertida.processo = convertAllDecimalFields(diligenciaConvertida.processo);
      }

      if (diligenciaConvertida.contrato) {
        diligenciaConvertida.contrato = convertAllDecimalFields(diligenciaConvertida.contrato);
      }

      return JSON.parse(JSON.stringify(diligenciaConvertida));
    });

    return {
      success: true,
      diligencias: diligenciasFormatted,
    };
  } catch (error) {
    logger.error("Erro ao listar diligências:", error);

    return {
      success: false,
      error: "Erro ao carregar diligências",
    };
  }
}

export async function createDiligencia(payload: DiligenciaCreatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    if (!payload.titulo?.trim()) {
      return { success: false, error: "Título da diligência é obrigatório" };
    }

    const data: any = {
      tenantId: user.tenantId,
      titulo: payload.titulo.trim(),
      tipo: payload.tipo?.trim() || null,
      descricao: payload.descricao?.trim() || null,
      criadoPorId: user.id,
    };

    const relatedIds = [
      { key: "processoId", value: payload.processoId },
      { key: "causaId", value: payload.causaId },
      { key: "contratoId", value: payload.contratoId },
      { key: "peticaoId", value: payload.peticaoId },
      { key: "documentoId", value: payload.documentoId },
      { key: "regimePrazoId", value: payload.regimePrazoId },
      { key: "responsavelId", value: payload.responsavelId },
    ];

    for (const item of relatedIds) {
      if (item.value) {
        data[item.key] = item.value;
      }
    }

    if (payload.prazoPrevisto) {
      const prazo = new Date(payload.prazoPrevisto);

      if (Number.isNaN(prazo.getTime())) {
        return { success: false, error: "Prazo previsto inválido" };
      }
      data.prazoPrevisto = prazo;
    }

    const diligencia = await prisma.diligencia.create({
      data,
      include: {
        processo: true,
        causa: true,
        contrato: true,
      },
    });

    // Converter valores Decimal para number recursivamente
    const diligenciaConvertida = convertAllDecimalFields(diligencia);

    // Converter também os relacionamentos
    if (diligenciaConvertida.processo) {
      diligenciaConvertida.processo = convertAllDecimalFields(diligenciaConvertida.processo);
    }

    if (diligenciaConvertida.contrato) {
      diligenciaConvertida.contrato = convertAllDecimalFields(diligenciaConvertida.contrato);
    }

    const serialized = JSON.parse(JSON.stringify(diligenciaConvertida));

    return {
      success: true,
      diligencia: serialized,
    };
  } catch (error) {
    logger.error("Erro ao criar diligência:", error);

    return {
      success: false,
      error: "Erro ao criar diligência",
    };
  }
}

export async function updateDiligencia(diligenciaId: string, payload: DiligenciaUpdatePayload) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const diligencia = await prisma.diligencia.findFirst({
      where: {
        id: diligenciaId,
        tenantId: user.tenantId,
      },
    });

    if (!diligencia) {
      return { success: false, error: "Diligência não encontrada" };
    }

    const data: any = {};

    if (payload.titulo !== undefined) {
      if (!payload.titulo.trim()) {
        return { success: false, error: "Título é obrigatório" };
      }
      data.titulo = payload.titulo.trim();
    }

    if (payload.tipo !== undefined) {
      data.tipo = payload.tipo?.trim() || null;
    }

    if (payload.descricao !== undefined) {
      data.descricao = payload.descricao?.trim() || null;
    }

    if (payload.responsavelId !== undefined) {
      data.responsavelId = payload.responsavelId || null;
    }

    if (payload.prazoPrevisto !== undefined) {
      if (payload.prazoPrevisto === null) {
        data.prazoPrevisto = null;
      } else {
        const prazo = new Date(payload.prazoPrevisto);

        if (Number.isNaN(prazo.getTime())) {
          return { success: false, error: "Prazo previsto inválido" };
        }
        data.prazoPrevisto = prazo;
      }
    }

    if (payload.prazoConclusao !== undefined) {
      if (payload.prazoConclusao === null) {
        data.prazoConclusao = null;
      } else {
        const prazo = new Date(payload.prazoConclusao);

        if (Number.isNaN(prazo.getTime())) {
          return { success: false, error: "Data de conclusão inválida" };
        }
        data.prazoConclusao = prazo;
      }
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.observacoes !== undefined) {
      data.observacoes = payload.observacoes?.trim() || null;
    }

    const updated = await prisma.diligencia.update({
      where: { id: diligencia.id },
      data,
      include: {
        processo: true,
        causa: true,
        contrato: true,
        responsavel: true,
      },
    });

    // Converter valores Decimal para number recursivamente
    const diligenciaConvertida = convertAllDecimalFields(updated);

    // Converter também os relacionamentos
    if (diligenciaConvertida.processo) {
      diligenciaConvertida.processo = convertAllDecimalFields(diligenciaConvertida.processo);
    }

    if (diligenciaConvertida.contrato) {
      diligenciaConvertida.contrato = convertAllDecimalFields(diligenciaConvertida.contrato);
    }

    const serialized = JSON.parse(JSON.stringify(diligenciaConvertida));

    return {
      success: true,
      diligencia: serialized,
    };
  } catch (error) {
    logger.error("Erro ao atualizar diligência:", error);

    return {
      success: false,
      error: "Erro ao atualizar diligência",
    };
  }
}
