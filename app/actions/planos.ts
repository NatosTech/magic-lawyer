"use server";

import { Prisma, PlanoVersaoStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export type Plano = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  valorMensal?: number | null;
  valorAnual?: number | null;
  moeda: string;
  limiteUsuarios?: number | null;
  limiteProcessos?: number | null;
  limiteStorageMb?: number | null;
  recursos?: any;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanoVersaoResumo = {
  id: string;
  numero: number;
  status: string;
  titulo?: string | null;
  descricao?: string | null;
  publicadoEm?: Date | null;
  criadoPorId?: string | null;
  publicadoPorId?: string | null;
};

export type ModuloCatalogoItem = {
  id: string;
  slug: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  icone?: string | null;
  ordem?: number | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanoModuloConfig = {
  moduloId: string;
  slug: string;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number | null;
  habilitado: boolean;
};

export type PlanoModuloUpdateInput = {
  moduloId: string;
  habilitado: boolean;
};

export type DefaultActionResponse = {
  success: boolean;
  error?: string;
};

export type PlanoMatrixModuleRow = {
  moduloId: string;
  slug: string;
  nome: string;
  categoria?: string | null;
  planos: Array<{
    planoId: string;
    habilitado: boolean;
  }>;
};

export type GetPlanoMatrixResponse = {
  success: boolean;
  data?: {
    planos: Array<{ id: string; nome: string; slug: string }>;
    modulos: PlanoMatrixModuleRow[];
  };
  error?: string;
};

function toPlanoVersaoResumo(versao: {
  id: string;
  numero: number;
  status: PlanoVersaoStatus;
  titulo: string | null;
  descricao: string | null;
  publicadoEm: Date | null;
  criadoPorId: string | null;
  publicadoPorId: string | null;
}): PlanoVersaoResumo {
  return {
    id: versao.id,
    numero: versao.numero,
    status: versao.status,
    titulo: versao.titulo ?? undefined,
    descricao: versao.descricao ?? undefined,
    publicadoEm: versao.publicadoEm ?? undefined,
    criadoPorId: versao.criadoPorId ?? undefined,
    publicadoPorId: versao.publicadoPorId ?? undefined,
  };
}

async function createPlanoVersaoSnapshotTx(
  tx: Prisma.TransactionClient,
  params: {
    plano: { id: string; nome: string };
    status: PlanoVersaoStatus;
    usuarioId: string;
    titulo?: string;
    descricao?: string;
    requireActiveModules?: boolean;
  },
) {
  const { plano, status, usuarioId, titulo, descricao, requireActiveModules } =
    params;

  const modulosAtivos = await tx.planoModulo.findMany({
    where: { planoId: plano.id, habilitado: true },
    select: { moduloId: true },
  });

  if (
    (requireActiveModules ?? status === PlanoVersaoStatus.PUBLISHED) &&
    modulosAtivos.length === 0
  ) {
    throw new Error(
      "Nenhum módulo habilitado. Ative ao menos um módulo antes de criar a versão.",
    );
  }

  const ultimaVersao = await tx.planoVersao.findFirst({
    where: { planoId: plano.id },
    orderBy: { numero: "desc" },
  });

  const proximoNumero = (ultimaVersao?.numero ?? 0) + 1;

  const defaultTitulo =
    titulo ??
    (status === PlanoVersaoStatus.REVIEW
      ? `${plano.nome} · Revisão ${proximoNumero}`
      : status === PlanoVersaoStatus.DRAFT
        ? `${plano.nome} · Rascunho ${proximoNumero}`
        : `${plano.nome} · Versão ${proximoNumero}`);

  const modulosData = modulosAtivos.map((modulo) => ({
    moduloId: modulo.moduloId,
    habilitado: true,
  }));

  const now = new Date();

  const versao = await tx.planoVersao.create({
    data: {
      planoId: plano.id,
      numero: proximoNumero,
      status,
      titulo: defaultTitulo,
      descricao,
      criadoPorId: usuarioId,
      publicadoPorId:
        status === PlanoVersaoStatus.PUBLISHED ? usuarioId : undefined,
      publicadoEm: status === PlanoVersaoStatus.PUBLISHED ? now : undefined,
      modulos:
        modulosData.length > 0
          ? {
              createMany: {
                data: modulosData,
              },
            }
          : undefined,
    },
  });

  return versao;
}

export type TenantSubscription = {
  id: string;
  tenantId: string;
  planoId?: string;
  status: string;
  dataInicio: Date;
  dataFim?: Date | null;
  renovaEm?: Date | null;
  trialEndsAt?: Date | null;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
};

export type GetPlanosResponse = {
  success: boolean;
  data?: Plano[];
  error?: string;
};

export type GetPlanoResponse = {
  success: boolean;
  data?: Plano;
  error?: string;
};

export type GetPlanoConfiguracaoResponse = {
  success: boolean;
  data?: {
    plano: Plano;
    modulos: PlanoModuloConfig[];
    versoes: PlanoVersaoResumo[];
    ultimaVersao?: PlanoVersaoResumo;
  };
  error?: string;
};

export type GetModuloCatalogoResponse = {
  success: boolean;
  data?: ModuloCatalogoItem[];
  error?: string;
};

export type GetEstatisticasPlanosResponse = {
  success: boolean;
  data?: {
    totalPlanos: number;
    planosAtivos: number;
    totalAssinaturas: number;
    assinaturasAtivas: number;
    faturamentoMensal: number;
  };
  error?: string;
};

// ==================== FUNÇÕES AUXILIARES ====================

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "SUPER_ADMIN") {
    throw new Error(
      "Acesso negado. Apenas Super Admins podem gerenciar planos.",
    );
  }

  return session.user.id as string;
}

// ==================== CRUD PLANOS ====================

export async function getPlanos(): Promise<GetPlanosResponse> {
  try {
    await ensureSuperAdmin();

    const planos = await prisma.plano.findMany({
      orderBy: [{ valorMensal: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: planos.map((plano) => ({
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      })),
    };
  } catch (error) {
    logger.error("Erro ao buscar planos:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getPlanoById(id: string): Promise<GetPlanoResponse> {
  try {
    await ensureSuperAdmin();

    const plano = await prisma.plano.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!plano) {
      return {
        success: false,
        error: "Plano não encontrado",
      };
    }

    return {
      success: true,
      data: {
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function updatePlano(
  id: string,
  data: Partial<Plano>,
): Promise<GetPlanoResponse> {
  try {
    await ensureSuperAdmin();

    // Verificar se o plano existe
    const planoExistente = await prisma.plano.findUnique({
      where: { id },
    });

    if (!planoExistente) {
      return {
        success: false,
        error: "Plano não encontrado",
      };
    }

    const plano = await prisma.plano.update({
      where: { id },
      data: {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao,
        valorMensal: data.valorMensal,
        valorAnual: data.valorAnual,
        limiteUsuarios: data.limiteUsuarios,
        limiteProcessos: data.limiteProcessos,
        limiteStorageMb: data.limiteStorageMb,
        recursos: data.recursos,
        ativo: data.ativo,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      },
    };
  } catch (error) {
    logger.error("Erro ao atualizar plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== CONFIGURAÇÃO DE MÓDULOS ====================

export async function getModuloCatalogo(): Promise<GetModuloCatalogoResponse> {
  try {
    await ensureSuperAdmin();

    const modulos = await prisma.modulo.findMany({
      orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: modulos,
    };
  } catch (error) {
    logger.error("Erro ao carregar catálogo de módulos:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getPlanoConfiguracao(
  planoId: string,
): Promise<GetPlanoConfiguracaoResponse> {
  try {
    await ensureSuperAdmin();

    const [plano, catalogo, configuracaoAtual, versoes] = await Promise.all([
      prisma.plano.findUnique({ where: { id: planoId } }),
      prisma.modulo.findMany({
        where: { ativo: true },
        orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }],
      }),
      prisma.planoModulo.findMany({
        where: { planoId },
      }),
      prisma.planoVersao.findMany({
        where: { planoId },
        orderBy: { numero: "desc" },
        take: 20,
      }),
    ]);

    if (!plano) {
      return {
        success: false,
        error: "Plano não encontrado",
      };
    }

    const modulosHabilitados = new Map(
      configuracaoAtual.map((modulo) => [modulo.moduloId, modulo.habilitado]),
    );

    const modulos: PlanoModuloConfig[] = catalogo.map((modulo) => ({
      moduloId: modulo.id,
      slug: modulo.slug,
      nome: modulo.nome,
      categoria: modulo.categoria ?? undefined,
      descricao: modulo.descricao ?? undefined,
      icone: modulo.icone ?? undefined,
      ordem: modulo.ordem ?? undefined,
      habilitado: modulosHabilitados.get(modulo.id) ?? false,
    }));

    const versoesResumo: PlanoVersaoResumo[] = versoes.map((versao) =>
      toPlanoVersaoResumo(versao),
    );

    return {
      success: true,
      data: {
        plano: {
          ...plano,
          valorMensal: plano.valorMensal
            ? Number(plano.valorMensal)
            : undefined,
          valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
        },
        modulos,
        versoes: versoesResumo,
        ultimaVersao: versoesResumo[0],
      },
    };
  } catch (error) {
    logger.error("Erro ao carregar configuração do plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getPlanosMatrix(): Promise<GetPlanoMatrixResponse> {
  try {
    await ensureSuperAdmin();

    const [planos, modulos, relacoes] = await Promise.all([
      prisma.plano.findMany({
        select: { id: true, nome: true, slug: true },
        orderBy: [{ nome: "asc" }],
      }),
      prisma.modulo.findMany({
        where: { ativo: true },
        orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }],
      }),
      prisma.planoModulo.findMany({
        select: {
          planoId: true,
          moduloId: true,
          habilitado: true,
        },
      }),
    ]);

    const statusPorModulo = new Map<string, Map<string, boolean>>();

    relacoes.forEach((relacao) => {
      if (!statusPorModulo.has(relacao.moduloId)) {
        statusPorModulo.set(relacao.moduloId, new Map());
      }

      statusPorModulo
        .get(relacao.moduloId)!
        .set(relacao.planoId, relacao.habilitado);
    });

    const matriz: PlanoMatrixModuleRow[] = modulos.map((modulo) => ({
      moduloId: modulo.id,
      slug: modulo.slug,
      nome: modulo.nome,
      categoria: modulo.categoria ?? undefined,
      planos: planos.map((plano) => ({
        planoId: plano.id,
        habilitado: statusPorModulo.get(modulo.id)?.get(plano.id) ?? false,
      })),
    }));

    return {
      success: true,
      data: {
        planos,
        modulos: matriz,
      },
    };
  } catch (error) {
    logger.error("Erro ao carregar matriz de planos:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function setPlanoModulos(
  planoId: string,
  updates: PlanoModuloUpdateInput[],
): Promise<DefaultActionResponse> {
  if (!updates?.length) {
    return { success: true };
  }

  try {
    await ensureSuperAdmin();

    await prisma.$transaction(async (tx) => {
      const plano = await tx.plano.findUnique({ where: { id: planoId } });

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      const moduloIds = Array.from(
        new Set(updates.map((item) => item.moduloId)),
      );

      const modulosExistentes = await tx.modulo.findMany({
        where: { id: { in: moduloIds } },
        select: { id: true },
      });

      const modulosValidos = new Set(modulosExistentes.map((item) => item.id));

      for (const update of updates) {
        if (!modulosValidos.has(update.moduloId)) {
          throw new Error(`Módulo inválido: ${update.moduloId}`);
        }

        await tx.planoModulo.upsert({
          where: {
            planoId_moduloId: {
              planoId,
              moduloId: update.moduloId,
            },
          },
          update: {
            habilitado: update.habilitado,
            updatedAt: new Date(),
          },
          create: {
            planoId,
            moduloId: update.moduloId,
            habilitado: update.habilitado,
          },
        });
      }

      await tx.plano.update({
        where: { id: planoId },
        data: {
          updatedAt: new Date(),
        },
      });
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar módulos do plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function syncPlanoModulos(
  planoId: string,
  activeModuloIds: string[],
): Promise<DefaultActionResponse> {
  try {
    await ensureSuperAdmin();

    const activeSet = new Set(activeModuloIds);

    await prisma.$transaction(async (tx) => {
      const plano = await tx.plano.findUnique({
        where: { id: planoId },
      });

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      const modulosAtuais = await tx.planoModulo.findMany({
        where: { planoId },
        select: {
          moduloId: true,
          habilitado: true,
        },
      });

      const modulosAtuaisSet = new Set(
        modulosAtuais.filter((m) => m.habilitado).map((m) => m.moduloId),
      );

      const modulosParaHabilitar = activeModuloIds.filter(
        (moduloId) => !modulosAtuaisSet.has(moduloId),
      );

      const modulosParaDesabilitar = modulosAtuais
        .filter(
          (modulo) => modulo.habilitado && !activeSet.has(modulo.moduloId),
        )
        .map((modulo) => modulo.moduloId);

      if (modulosParaHabilitar.length > 0) {
        await tx.planoModulo.createMany({
          data: modulosParaHabilitar.map((moduloId) => ({
            planoId,
            moduloId,
            habilitado: true,
          })),
          skipDuplicates: true,
        });

        await tx.planoModulo.updateMany({
          where: {
            planoId,
            moduloId: { in: modulosParaHabilitar },
          },
          data: { habilitado: true, updatedAt: new Date() },
        });
      }

      if (modulosParaDesabilitar.length > 0) {
        await tx.planoModulo.updateMany({
          where: {
            planoId,
            moduloId: { in: modulosParaDesabilitar },
          },
          data: { habilitado: false, updatedAt: new Date() },
        });
      }

      await tx.plano.update({
        where: { id: planoId },
        data: { updatedAt: new Date() },
      });
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao sincronizar módulos do plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function createPlanoVersaoDraft(
  planoId: string,
  payload?: { titulo?: string; descricao?: string },
): Promise<{ success: boolean; data?: PlanoVersaoResumo; error?: string }> {
  try {
    const usuarioId = await ensureSuperAdmin();

    const versao = await prisma.$transaction(async (tx) => {
      const plano = await tx.plano.findUnique({
        where: { id: planoId },
        select: { id: true, nome: true },
      });

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      const novaVersao = await createPlanoVersaoSnapshotTx(tx, {
        plano,
        status: PlanoVersaoStatus.DRAFT,
        usuarioId,
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        requireActiveModules: false,
      });

      await tx.plano.update({
        where: { id: planoId },
        data: { updatedAt: new Date() },
      });

      return novaVersao;
    });

    return { success: true, data: toPlanoVersaoResumo(versao) };
  } catch (error) {
    logger.error("Erro ao criar rascunho de versão:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function createPlanoVersaoReview(
  planoId: string,
  payload?: { titulo?: string; descricao?: string },
): Promise<{ success: boolean; data?: PlanoVersaoResumo; error?: string }> {
  try {
    const usuarioId = await ensureSuperAdmin();

    const versao = await prisma.$transaction(async (tx) => {
      const plano = await tx.plano.findUnique({
        where: { id: planoId },
        select: { id: true, nome: true },
      });

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      const novaVersao = await createPlanoVersaoSnapshotTx(tx, {
        plano,
        status: PlanoVersaoStatus.REVIEW,
        usuarioId,
        titulo: payload?.titulo,
        descricao: payload?.descricao,
        requireActiveModules: true,
      });

      await tx.plano.update({
        where: { id: planoId },
        data: { updatedAt: new Date() },
      });

      return novaVersao;
    });

    return { success: true, data: toPlanoVersaoResumo(versao) };
  } catch (error) {
    logger.error("Erro ao enviar versão para revisão:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function publishPlanoVersao(
  planoId: string,
  payload?: { titulo?: string; descricao?: string; versaoId?: string },
): Promise<{ success: boolean; data?: PlanoVersaoResumo; error?: string }> {
  try {
    const usuarioId = await ensureSuperAdmin();

    const versao = await prisma.$transaction(async (tx) => {
      const plano = await tx.plano.findUnique({
        where: { id: planoId },
        select: { id: true, nome: true },
      });

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      let versaoAlvo;

      if (payload?.versaoId) {
        versaoAlvo = await tx.planoVersao.findUnique({
          where: { id: payload.versaoId },
          include: {
            modulos: true,
          },
        });

        if (!versaoAlvo || versaoAlvo.planoId !== plano.id) {
          throw new Error("Versão informada não pertence a este plano");
        }

        if (versaoAlvo.status === PlanoVersaoStatus.PUBLISHED) {
          throw new Error("Esta versão já foi publicada");
        }

        if (versaoAlvo.modulos.length === 0) {
          throw new Error("Esta versão não possui módulos associados");
        }

        await tx.planoVersao.updateMany({
          where: { planoId, status: PlanoVersaoStatus.PUBLISHED },
          data: { status: PlanoVersaoStatus.ARCHIVED },
        });

        versaoAlvo = await tx.planoVersao.update({
          where: { id: versaoAlvo.id },
          data: {
            status: PlanoVersaoStatus.PUBLISHED,
            titulo:
              payload?.titulo ??
              versaoAlvo.titulo ??
              `${plano.nome} · Versão ${versaoAlvo.numero}`,
            descricao: payload?.descricao ?? versaoAlvo.descricao,
            publicadoPorId: usuarioId,
            publicadoEm: new Date(),
          },
        });
      } else {
        versaoAlvo = await createPlanoVersaoSnapshotTx(tx, {
          plano,
          status: PlanoVersaoStatus.PUBLISHED,
          usuarioId,
          titulo: payload?.titulo,
          descricao: payload?.descricao,
          requireActiveModules: true,
        });
      }

      await tx.tenantSubscription.updateMany({
        where: { planoId },
        data: {
          planoVersaoId: versaoAlvo.id,
          updatedAt: new Date(),
        },
      });

      await tx.plano.update({
        where: { id: planoId },
        data: { updatedAt: new Date() },
      });

      return versaoAlvo;
    });

    return { success: true, data: toPlanoVersaoResumo(versao) };
  } catch (error) {
    logger.error("Erro ao publicar versão do plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

type CreatePlanoInput = {
  nome: string;
  slug: string;
  descricao?: string | null;
  valorMensal?: number;
  valorAnual?: number;
  moeda?: string;
  limiteUsuarios?: number | null;
  limiteProcessos?: number | null;
  limiteStorageMb?: number | null;
  periodoTeste?: number;
  recursos?: any;
  ativo?: boolean;
  moduloIds?: string[];
  moduloSlugs?: string[];
};

export async function createPlano(
  input: CreatePlanoInput,
): Promise<GetPlanoResponse> {
  try {
    const usuarioId = await ensureSuperAdmin();

    const plano = await prisma.$transaction(async (tx) => {
      const slugEmUso = await tx.plano.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

      if (slugEmUso) {
        throw new Error("Já existe um plano com este slug");
      }

      const planoCriado = await tx.plano.create({
        data: {
          nome: input.nome,
          slug: input.slug,
          descricao: input.descricao,
          valorMensal: input.valorMensal,
          valorAnual: input.valorAnual,
          moeda: input.moeda ?? "BRL",
          limiteUsuarios: input.limiteUsuarios,
          limiteProcessos: input.limiteProcessos,
          limiteStorageMb: input.limiteStorageMb,
          periodoTeste: input.periodoTeste ?? 14,
          recursos: input.recursos,
          ativo: input.ativo ?? true,
        },
      });

      const modulosDisponiveis = await tx.modulo.findMany({
        where: {
          OR: [
            {
              id: {
                in: input.moduloIds ?? [],
              },
            },
            {
              slug: {
                in: input.moduloSlugs ?? [],
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (modulosDisponiveis.length > 0) {
        await tx.planoModulo.createMany({
          data: modulosDisponiveis.map((modulo) => ({
            planoId: planoCriado.id,
            moduloId: modulo.id,
            habilitado: true,
          })),
          skipDuplicates: true,
        });

        await tx.planoVersao.create({
          data: {
            planoId: planoCriado.id,
            numero: 1,
            status: "PUBLISHED",
            titulo: `${planoCriado.nome} · Versão 1`,
            descricao: "Versão inicial publicada automaticamente",
            criadoPorId: usuarioId,
            publicadoPorId: usuarioId,
            publicadoEm: new Date(),
            modulos: {
              createMany: {
                data: modulosDisponiveis.map((modulo) => ({
                  moduloId: modulo.id,
                  habilitado: true,
                })),
              },
            },
          },
        });
      }

      return planoCriado;
    });

    return {
      success: true,
      data: {
        ...plano,
        valorMensal: plano.valorMensal ? Number(plano.valorMensal) : undefined,
        valorAnual: plano.valorAnual ? Number(plano.valorAnual) : undefined,
      },
    };
  } catch (error) {
    logger.error("Erro ao criar plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function duplicatePlano(
  planoId: string,
  overrides?: Partial<Omit<CreatePlanoInput, "moduloIds" | "moduloSlugs">>,
): Promise<GetPlanoResponse> {
  try {
    await ensureSuperAdmin();

    const planoOriginal = await prisma.plano.findUnique({
      where: { id: planoId },
      include: {
        modulos: true,
      },
    });

    if (!planoOriginal) {
      return {
        success: false,
        error: "Plano de origem não encontrado",
      };
    }

    const slugBase = overrides?.slug ?? `${planoOriginal.slug}-copy`;
    const slugNormalizadoBase = slugBase.replace(/\s+/g, "-").toLowerCase();

    let slugNormalizado = slugNormalizadoBase;
    let contador = 1;

    while (
      await prisma.plano.findUnique({
        where: { slug: slugNormalizado },
        select: { id: true },
      })
    ) {
      slugNormalizado = `${slugNormalizadoBase}-${contador}`;
      contador += 1;
    }

    return await createPlano({
      nome: overrides?.nome ?? `${planoOriginal.nome} (cópia)`,
      slug: slugNormalizado,
      descricao: overrides?.descricao ?? planoOriginal.descricao ?? undefined,
      valorMensal:
        overrides?.valorMensal ??
        (planoOriginal.valorMensal
          ? Number(planoOriginal.valorMensal)
          : undefined),
      valorAnual:
        overrides?.valorAnual ??
        (planoOriginal.valorAnual
          ? Number(planoOriginal.valorAnual)
          : undefined),
      moeda: overrides?.moeda ?? planoOriginal.moeda ?? "BRL",
      limiteUsuarios:
        overrides?.limiteUsuarios ?? planoOriginal.limiteUsuarios ?? undefined,
      limiteProcessos:
        overrides?.limiteProcessos ??
        planoOriginal.limiteProcessos ??
        undefined,
      limiteStorageMb:
        overrides?.limiteStorageMb ??
        planoOriginal.limiteStorageMb ??
        undefined,
      periodoTeste: overrides?.periodoTeste ?? planoOriginal.periodoTeste ?? 14,
      recursos: overrides?.recursos ?? planoOriginal.recursos ?? undefined,
      ativo: overrides?.ativo ?? false,
      moduloIds: planoOriginal.modulos
        .filter((modulo) => modulo.habilitado)
        .map((modulo) => modulo.moduloId),
    });
  } catch (error) {
    logger.error("Erro ao duplicar plano:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE ANÁLISE ====================

export async function getEstatisticasPlanos(): Promise<GetEstatisticasPlanosResponse> {
  try {
    await ensureSuperAdmin();

    const [
      totalPlanos,
      planosAtivos,
      totalAssinaturas,
      assinaturasAtivas,
      faturamentoMensal,
    ] = await Promise.all([
      prisma.plano.count(),
      prisma.plano.count({ where: { ativo: true } }),
      prisma.tenantSubscription.count(),
      prisma.tenantSubscription.count({
        where: {
          status: "ATIVA",
          planoId: { not: null },
        },
      }),
      prisma.fatura.aggregate({
        where: {
          status: "PAGA",
          pagoEm: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          valor: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPlanos,
        planosAtivos,
        totalAssinaturas,
        assinaturasAtivas,
        faturamentoMensal: Number(faturamentoMensal._sum?.valor ?? 0),
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar estatísticas de planos:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE ASSINATURAS ====================

export async function getAssinaturas() {
  try {
    await ensureSuperAdmin();

    const assinaturas = await prisma.tenantSubscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        plano: {
          select: {
            id: true,
            nome: true,
            valorMensal: true,
            valorAnual: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: assinaturas.map((assinatura) => ({
        ...assinatura,
        plano: assinatura.plano
          ? {
              ...assinatura.plano,
              valorMensal: assinatura.plano.valorMensal
                ? Number(assinatura.plano.valorMensal)
                : undefined,
              valorAnual: assinatura.plano.valorAnual
                ? Number(assinatura.plano.valorAnual)
                : undefined,
            }
          : null,
      })),
    };
  } catch (error) {
    logger.error("Erro ao buscar assinaturas:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}
