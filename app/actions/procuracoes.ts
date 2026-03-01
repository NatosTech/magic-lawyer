"use server";

import { getSession } from "@/app/lib/auth";
import prisma, { toNumber } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import {
  Prisma,
  ProcuracaoEmitidaPor,
  ProcuracaoStatus,
} from "@/generated/prisma";
import {
  getAccessibleAdvogadoIds,
} from "@/app/lib/advogado-access";
import { gerarPdfProcuracaoBuffer } from "@/app/lib/procuracao-pdf";

// ============================================
// TYPES
// ============================================

export interface ProcuracaoFormData {
  numero?: string;
  arquivoUrl?: string;
  observacoes?: string;
  emitidaEm?: Date;
  validaAte?: Date;
  revogadaEm?: Date;
  assinadaPeloClienteEm?: Date;
  emitidaPor: "ESCRITORIO" | "ADVOGADO";
  clienteId: string;
  modeloId?: string;
  processoIds?: string[];
  advogadoIds: string[];
  status?: ProcuracaoStatus;
  ativa?: boolean;
  poderes?: {
    titulo?: string;
    descricao: string;
  }[];
}

export type ProcuracaoCreateInput = ProcuracaoFormData;

export interface ProcuracaoListFilters {
  search?: string;
  status?: ProcuracaoStatus | "";
  clienteId?: string;
  advogadoId?: string;
  emitidaPor?: ProcuracaoEmitidaPor | "";
}

export interface ProcuracaoListPaginatedParams {
  page?: number;
  pageSize?: number;
  filtros?: ProcuracaoListFilters;
}

interface ProcuracaoListMetrics {
  total: number;
  vigentes: number;
  pendentesAssinatura: number;
  encerradas: number;
  comProcessos: number;
  emitidasPeloEscritorio: number;
}

export interface ProcuracaoListPaginatedResult {
  items: ProcuracaoListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  metrics: ProcuracaoListMetrics;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const procuracaoListInclude = Prisma.validator<Prisma.ProcuracaoInclude>()({
  cliente: {
    select: {
      id: true,
      nome: true,
      tipoPessoa: true,
    },
  },
  modelo: {
    select: {
      id: true,
      nome: true,
      categoria: true,
    },
  },
  outorgados: {
    include: {
      advogado: {
        select: {
          id: true,
          oabNumero: true,
          oabUf: true,
          usuario: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
  processos: {
    include: {
      processo: {
        select: {
          id: true,
          numero: true,
          titulo: true,
        },
      },
    },
  },
  poderes: {
    select: {
      id: true,
      titulo: true,
      descricao: true,
      ativo: true,
    },
  },
  _count: {
    select: {
      processos: true,
      outorgados: true,
    },
  },
});

export type ProcuracaoListItem = Prisma.ProcuracaoGetPayload<{
  include: typeof procuracaoListInclude;
}>;

async function getClienteIdFromSession(session: {
  user: any;
}): Promise<string | null> {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: {
      id: true,
    },
  });

  return cliente?.id || null;
}

function clampPagination(
  page?: number,
  pageSize?: number,
): { page: number; pageSize: number } {
  const normalizedPage = Number.isFinite(page) ? Number(page) : 1;
  const normalizedPageSize = Number.isFinite(pageSize) ? Number(pageSize) : 12;

  return {
    page: Math.max(1, normalizedPage),
    pageSize: Math.min(Math.max(6, normalizedPageSize), 50),
  };
}

function mergeWhereConditions(
  base: Prisma.ProcuracaoWhereInput,
  extra?: Prisma.ProcuracaoWhereInput,
): Prisma.ProcuracaoWhereInput {
  if (!extra) {
    return base;
  }

  return {
    AND: [base, extra],
  };
}

async function buildProcuracaoAccessWhere(
  session: { user: any },
  user: any,
  opts?: { procuracaoId?: string },
): Promise<Prisma.ProcuracaoWhereInput> {
  let whereClause: Prisma.ProcuracaoWhereInput = {
    tenantId: user.tenantId,
    ...(opts?.procuracaoId ? { id: opts.procuracaoId } : {}),
  };

  const clienteId = await getClienteIdFromSession(session);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // Cliente final enxerga apenas suas próprias procurações.
  if (clienteId) {
    return {
      ...whereClause,
      clienteId,
    };
  }

  // Perfis administrativos enxergam todo o tenant.
  if (isAdmin) {
    return whereClause;
  }

  // Colaboradores/advogados seguem escopo por vínculos (inclusive modo estrito).
  const accessibleAdvogados = await getAccessibleAdvogadoIds(session);
  const orConditions: Prisma.ProcuracaoWhereInput[] = [
    {
      outorgados: {
        some: {
          advogadoId: {
            in: accessibleAdvogados,
          },
        },
      },
    },
    {
      cliente: {
        advogadoClientes: {
          some: {
            advogadoId: {
              in: accessibleAdvogados,
            },
          },
        },
      },
    },
    {
      processos: {
        some: {
          processo: {
            advogadoResponsavelId: {
              in: accessibleAdvogados,
            },
          },
        },
      },
    },
  ];

  if (user.role === "ADVOGADO") {
    orConditions.push({
      cliente: {
        usuario: {
          createdById: user.id,
        },
      },
    });
  }

  whereClause = {
    ...whereClause,
    OR: orConditions,
  };

  return whereClause;
}

function buildProcuracaoListWhere(
  accessWhere: Prisma.ProcuracaoWhereInput,
  filtros?: ProcuracaoListFilters,
): Prisma.ProcuracaoWhereInput {
  if (!filtros) {
    return accessWhere;
  }

  const term = filtros.search?.trim();
  const conditions: Prisma.ProcuracaoWhereInput[] = [accessWhere];

  if (term) {
    conditions.push({
      OR: [
        {
          numero: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          cliente: {
            nome: {
              contains: term,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (filtros.status) {
    conditions.push({
      status: filtros.status,
    });
  }

  if (filtros.clienteId) {
    conditions.push({
      clienteId: filtros.clienteId,
    });
  }

  if (filtros.emitidaPor) {
    conditions.push({
      emitidaPor: filtros.emitidaPor,
    });
  }

  if (filtros.advogadoId) {
    conditions.push({
      outorgados: {
        some: {
          advogadoId: filtros.advogadoId,
        },
      },
    });
  }

  if (conditions.length === 1) {
    return accessWhere;
  }

  return {
    AND: conditions,
  };
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Busca todas as procurações do tenant
 */
export async function getAllProcuracoes(): Promise<{
  success: boolean;
  procuracoes?: any[];
  error?: string;
}> {
  try {
    const result = await getProcuracoesPaginated({
      page: 1,
      pageSize: 100,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      procuracoes: result.data?.items ?? [],
    };
  } catch (error) {
    logger.error("Erro ao buscar todas as procurações:", error);

    return {
      success: false,
      error: "Erro ao buscar procurações",
    };
  }
}

export async function getProcuracoesPaginated(
  params?: ProcuracaoListPaginatedParams,
): Promise<{
  success: boolean;
  data?: ProcuracaoListPaginatedResult;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const { page, pageSize } = clampPagination(params?.page, params?.pageSize);
    const accessWhere = await buildProcuracaoAccessWhere(session, user);
    const where = buildProcuracaoListWhere(accessWhere, params?.filtros);

    const total = await prisma.procuracao.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * pageSize;

    const [items, vigentes, pendentesAssinatura, encerradas, comProcessos, emitidasPeloEscritorio] =
      await Promise.all([
        prisma.procuracao.findMany({
          where,
          include: procuracaoListInclude,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: pageSize,
        }),
        prisma.procuracao.count({
          where: mergeWhereConditions(where, {
            status: ProcuracaoStatus.VIGENTE,
          }),
        }),
        prisma.procuracao.count({
          where: mergeWhereConditions(where, {
            status: ProcuracaoStatus.PENDENTE_ASSINATURA,
          }),
        }),
        prisma.procuracao.count({
          where: mergeWhereConditions(where, {
            OR: [
              { status: ProcuracaoStatus.REVOGADA },
              { status: ProcuracaoStatus.EXPIRADA },
            ],
          }),
        }),
        prisma.procuracao.count({
          where: mergeWhereConditions(where, {
            processos: {
              some: {},
            },
          }),
        }),
        prisma.procuracao.count({
          where: mergeWhereConditions(where, {
            emitidaPor: ProcuracaoEmitidaPor.ESCRITORIO,
          }),
        }),
      ]);

    return {
      success: true,
      data: {
        items,
        page: currentPage,
        pageSize,
        total,
        totalPages,
        metrics: {
          total,
          vigentes,
          pendentesAssinatura,
          encerradas,
          comProcessos,
          emitidasPeloEscritorio,
        },
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar procurações paginadas:", error);

    return {
      success: false,
      error: "Erro ao buscar procurações",
    };
  }
}

/**
 * Busca uma procuração por ID
 */
export async function getProcuracaoById(procuracaoId: string): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const whereClause = await buildProcuracaoAccessWhere(session, user, {
      procuracaoId,
    });

    const procuracao = await prisma.procuracao.findFirst({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
            email: true,
            telefone: true,
          },
        },
        modelo: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            conteudo: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
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
          },
        },
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
                titulo: true,
                status: true,
              },
            },
          },
        },
        poderes: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            ativo: true,
            revogadoEm: true,
            createdAt: true,
          },
          orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!procuracao) {
      return {
        success: false,
        error: "Procuração não encontrada ou sem acesso",
      };
    }

    // Converter Decimals para number nos advogados outorgados
    const procuracaoSerializada = {
      ...procuracao,
      outorgados: procuracao.outorgados?.map((outorgado: any) => ({
        ...outorgado,
        advogado: {
          ...outorgado.advogado,
          comissaoPadrao: toNumber(outorgado.advogado.comissaoPadrao) || 0,
          comissaoAcaoGanha:
            toNumber(outorgado.advogado.comissaoAcaoGanha) || 0,
          comissaoHonorarios:
            toNumber(outorgado.advogado.comissaoHonorarios) || 0,
        },
      })),
    };

    return {
      success: true,
      procuracao: procuracaoSerializada,
    };
  } catch (error) {
    logger.error("Erro ao buscar procuração:", error);

    return {
      success: false,
      error: "Erro ao buscar procuração",
    };
  }
}

/**
 * Busca procurações de um cliente
 */
export async function getProcuracoesCliente(clienteId: string): Promise<{
  success: boolean;
  procuracoes?: any[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar acesso ao cliente
    let whereCliente: Prisma.ClienteWhereInput = {
      id: clienteId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    // Se não for ADMIN, aplicar escopo por vínculos do usuário.
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      if (user.role === "ADVOGADO") {
        whereCliente = {
          ...whereCliente,
          OR: [
            {
              advogadoClientes: {
                some: {
                  advogadoId: {
                    in: accessibleAdvogados,
                  },
                },
              },
            },
            {
              usuario: {
                createdById: user.id,
              },
            },
          ],
        };
      } else {
        whereCliente.advogadoClientes = {
          some: {
            advogadoId: {
              in: accessibleAdvogados,
            },
          },
        };
      }
    }

    // Verificar se cliente existe e está acessível
    const cliente = await prisma.cliente.findFirst({
      where: whereCliente,
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado ou sem acesso" };
    }

    const procuracoes = await prisma.procuracao.findMany({
      where: {
        clienteId: clienteId,
        tenantId: user.tenantId,
      },
      include: {
        modelo: {
          select: {
            id: true,
            nome: true,
            categoria: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
              select: {
                id: true,
                oabNumero: true,
                oabUf: true,
                especialidades: true,
                bio: true,
                telefone: true,
                whatsapp: true,
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
        _count: {
          select: {
            processos: true,
            outorgados: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      procuracoes: procuracoes,
    };
  } catch (error) {
    logger.error("Erro ao buscar procurações do cliente:", error);

    return {
      success: false,
      error: "Erro ao buscar procurações do cliente",
    };
  }
}

export async function generateProcuracaoPdf(procuracaoId: string): Promise<{
  success: boolean;
  fileName?: string;
  data?: string;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const where = await buildProcuracaoAccessWhere(session, user, {
      procuracaoId,
    });

    const procuracao = await prisma.procuracao.findFirst({
      where,
      include: {
        cliente: {
          select: {
            nome: true,
            documento: true,
            email: true,
            telefone: true,
            tipoPessoa: true,
          },
        },
        outorgados: {
          include: {
            advogado: {
              select: {
                oabNumero: true,
                oabUf: true,
                usuario: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        poderes: {
          where: {
            ativo: true,
          },
          select: {
            titulo: true,
            descricao: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!procuracao) {
      return {
        success: false,
        error: "Procuração não encontrada ou sem acesso",
      };
    }

    const pdfBuffer = gerarPdfProcuracaoBuffer({
      numero: procuracao.numero,
      status: procuracao.status,
      emitidaPor: procuracao.emitidaPor,
      emitidaEm: procuracao.emitidaEm,
      validaAte: procuracao.validaAte,
      revogadaEm: procuracao.revogadaEm,
      observacoes: procuracao.observacoes,
      createdAt: procuracao.createdAt,
      modeloNomeSnapshot: procuracao.modeloNomeSnapshot,
      modeloConteudoSnapshot: procuracao.modeloConteudoSnapshot,
      modeloVersaoSnapshot: procuracao.modeloVersaoSnapshot,
      cliente: procuracao.cliente,
      outorgados: procuracao.outorgados.map((item) => ({
        nome: `${item.advogado.usuario.firstName ?? ""} ${item.advogado.usuario.lastName ?? ""}`.trim(),
        oabNumero: item.advogado.oabNumero,
        oabUf: item.advogado.oabUf,
      })),
      poderes: procuracao.poderes,
    });

    const safeNumber =
      procuracao.numero?.trim().replace(/[^a-zA-Z0-9-_]/g, "-") ||
      procuracao.id;
    const fileName = `procuracao-${safeNumber}.pdf`;

    return {
      success: true,
      fileName,
      data: pdfBuffer.toString("base64"),
    };
  } catch (error) {
    logger.error("Erro ao gerar PDF da procuração:", error);

    return {
      success: false,
      error: "Erro ao gerar PDF da procuração",
    };
  }
}

/**
 * Cria uma nova procuração
 */
export async function createProcuracao(data: ProcuracaoFormData): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se é ADMIN ou ADVOGADO
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADVOGADO"
    ) {
      return { success: false, error: "Acesso negado" };
    }

    const advogadoIds = Array.from(
      new Set((data.advogadoIds ?? []).filter(Boolean)),
    );
    const processoIds = Array.from(
      new Set((data.processoIds ?? []).filter(Boolean)),
    );

    // Verificar se o cliente existe e está acessível
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: data.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    let modeloSnapshot:
      | {
          id: string;
          nome: string;
          categoria: string | null;
          conteudo: string;
          versao: number;
          updatedAt: Date;
        }
      | null = null;

    // Verificar se o modelo existe (se fornecido)
    if (data.modeloId) {
      const modelo = await prisma.modeloProcuracao.findFirst({
        where: {
          id: data.modeloId,
          tenantId: user.tenantId,
          deletedAt: null,
          ativo: true,
        },
      });

      if (!modelo) {
        return { success: false, error: "Modelo não encontrado" };
      }

      const ultimaVersao = await prisma.modeloProcuracaoVersao.findFirst({
        where: {
          modeloId: modelo.id,
        },
        select: {
          versao: true,
        },
        orderBy: {
          versao: "desc",
        },
      });

      modeloSnapshot = {
        id: modelo.id,
        nome: modelo.nome,
        categoria: modelo.categoria,
        conteudo: modelo.conteudo,
        versao: ultimaVersao?.versao ?? 1,
        updatedAt: modelo.updatedAt,
      };
    }

    // Verificar se os advogados existem
    if (advogadoIds.length > 0) {
      const advogados = await prisma.advogado.findMany({
        where: {
          id: {
            in: advogadoIds,
          },
          tenantId: user.tenantId,
        },
      });

      if (advogados.length !== advogadoIds.length) {
        return {
          success: false,
          error: "Um ou mais advogados não encontrados",
        };
      }
    }

    // Verificar se os processos existem (se fornecidos)
    if (processoIds.length > 0) {
      const processos = await prisma.processo.findMany({
        where: {
          id: {
            in: processoIds,
          },
          tenantId: user.tenantId,
          deletedAt: null,
        },
      });

      if (processos.length !== processoIds.length) {
        return {
          success: false,
          error: "Um ou mais processos não encontrados",
        };
      }
    }

    const procuracao = await prisma.$transaction(async (tx) => {
      const criada = await tx.procuracao.create({
        data: {
          tenantId: user.tenantId,
          clienteId: data.clienteId,
          modeloId: modeloSnapshot?.id,
          modeloNomeSnapshot: modeloSnapshot?.nome,
          modeloCategoriaSnapshot: modeloSnapshot?.categoria,
          modeloConteudoSnapshot: modeloSnapshot?.conteudo,
          modeloVersaoSnapshot: modeloSnapshot?.versao,
          modeloAtualizadoEmSnapshot: modeloSnapshot?.updatedAt,
          numero: data.numero,
          arquivoUrl: data.arquivoUrl,
          observacoes: data.observacoes,
          emitidaEm: data.emitidaEm,
          validaAte: data.validaAte,
          revogadaEm: data.revogadaEm,
          assinadaPeloClienteEm: data.assinadaPeloClienteEm,
          emitidaPor:
            data.emitidaPor === "ADVOGADO"
              ? ProcuracaoEmitidaPor.ADVOGADO
              : ProcuracaoEmitidaPor.ESCRITORIO,
          status: data.status ?? ProcuracaoStatus.RASCUNHO,
          ativa: data.ativa ?? true,
          createdById: user.id,
        },
        select: {
          id: true,
        },
      });

      if (advogadoIds.length > 0) {
        await tx.procuracaoAdvogado.createMany({
          data: advogadoIds.map((advogadoId) => ({
            tenantId: user.tenantId,
            procuracaoId: criada.id,
            advogadoId,
          })),
        });
      }

      if (processoIds.length > 0) {
        await tx.procuracaoProcesso.createMany({
          data: processoIds.map((processoId) => ({
            tenantId: user.tenantId,
            procuracaoId: criada.id,
            processoId,
          })),
        });
      }

      const poderesParaCriar = (data.poderes ?? [])
        .map((poder) => ({
          titulo: poder.titulo?.trim() || null,
          descricao: poder.descricao.trim(),
        }))
        .filter((poder) => poder.descricao.length > 0);

      if (poderesParaCriar.length > 0) {
        await tx.procuracaoPoder.createMany({
          data: poderesParaCriar.map((poder) => ({
            tenantId: user.tenantId,
            procuracaoId: criada.id,
            titulo: poder.titulo,
            descricao: poder.descricao,
          })),
        });
      }

      return tx.procuracao.findUniqueOrThrow({
        where: {
          id: criada.id,
        },
        include: procuracaoListInclude,
      });
    });

    return {
      success: true,
      procuracao: procuracao,
    };
  } catch (error) {
    logger.error("Erro ao criar procuração:", error);

    return {
      success: false,
      error: "Erro ao criar procuração",
    };
  }
}

// ============================================
// UPDATE PROCURAÇÃO
// ============================================

export interface ProcuracaoUpdateInput {
  numero?: string;
  arquivoUrl?: string;
  observacoes?: string;
  emitidaEm?: string;
  validaAte?: string;
  revogadaEm?: string;
  status?: ProcuracaoStatus;
  emitidaPor?: ProcuracaoEmitidaPor;
  ativa?: boolean;
}

export async function updateProcuracao(
  procuracaoId: string,
  data: ProcuracaoUpdateInput,
): Promise<{
  success: boolean;
  procuracao?: any;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe e o usuário tem acesso
    const procuracaoExistente = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracaoExistente) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Atualizar procuração
    const procuracao = await prisma.procuracao.update({
      where: {
        id: procuracaoId,
      },
      data: {
        numero: data.numero,
        arquivoUrl: data.arquivoUrl,
        observacoes: data.observacoes,
        emitidaEm: data.emitidaEm ? new Date(data.emitidaEm) : undefined,
        validaAte: data.validaAte ? new Date(data.validaAte) : undefined,
        revogadaEm: data.revogadaEm ? new Date(data.revogadaEm) : undefined,
        status: data.status,
        emitidaPor: data.emitidaPor,
        ativa: data.ativa,
      },
      include: procuracaoListInclude,
    });

    return {
      success: true,
      procuracao,
    };
  } catch (error) {
    logger.error("Erro ao atualizar procuração:", error);

    return {
      success: false,
      error: "Erro ao atualizar procuração",
    };
  }
}

// ============================================
// DELETE PROCURAÇÃO
// ============================================

export async function deleteProcuracao(procuracaoId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe e o usuário tem acesso
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Deletar procuração (cascade deleta os relacionamentos)
    await prisma.procuracao.delete({
      where: {
        id: procuracaoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao deletar procuração:", error);

    return {
      success: false,
      error: "Erro ao deletar procuração",
    };
  }
}

// ============================================
// ADVOGADOS
// ============================================

export async function adicionarAdvogadoNaProcuracao(
  procuracaoId: string,
  advogadoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Verificar se o advogado existe
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: advogadoId,
        tenantId: user.tenantId,
      },
    });

    if (!advogado) {
      return { success: false, error: "Advogado não encontrado" };
    }

    // Verificar se já existe o vínculo
    const vinculoExistente = await prisma.procuracaoAdvogado.findFirst({
      where: {
        procuracaoId,
        advogadoId,
      },
    });

    if (vinculoExistente) {
      return { success: false, error: "Advogado já está na procuração" };
    }

    // Criar vínculo
    await prisma.procuracaoAdvogado.create({
      data: {
        tenantId: user.tenantId,
        procuracaoId,
        advogadoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao adicionar advogado na procuração:", error);

    return {
      success: false,
      error: "Erro ao adicionar advogado na procuração",
    };
  }
}

export async function removerAdvogadoDaProcuracao(
  procuracaoId: string,
  advogadoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Remover vínculo
    const result = await prisma.procuracaoAdvogado.deleteMany({
      where: {
        procuracaoId,
        advogadoId,
        tenantId: user.tenantId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Vínculo não encontrado" };
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao remover advogado da procuração:", error);

    return {
      success: false,
      error: "Erro ao remover advogado da procuração",
    };
  }
}

// ============================================
// PROCESSOS
// ============================================

export async function vincularProcesso(
  procuracaoId: string,
  processoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar se a procuração existe
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Verificar se o processo existe
    const processo = await prisma.processo.findFirst({
      where: {
        id: processoId,
        tenantId: user.tenantId,
      },
    });

    if (!processo) {
      return { success: false, error: "Processo não encontrado" };
    }

    // Verificar se já existe o vínculo
    const vinculoExistente = await prisma.procuracaoProcesso.findFirst({
      where: {
        procuracaoId,
        processoId,
      },
    });

    if (vinculoExistente) {
      return { success: false, error: "Processo já está vinculado" };
    }

    // Criar vínculo
    await prisma.procuracaoProcesso.create({
      data: {
        tenantId: user.tenantId,
        procuracaoId,
        processoId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao vincular processo:", error);

    return {
      success: false,
      error: "Erro ao vincular processo",
    };
  }
}

export async function desvincularProcesso(
  procuracaoId: string,
  processoId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Remover vínculo
    const result = await prisma.procuracaoProcesso.deleteMany({
      where: {
        procuracaoId,
        processoId,
        tenantId: user.tenantId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Vínculo não encontrado" };
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao desvincular processo:", error);

    return {
      success: false,
      error: "Erro ao desvincular processo",
    };
  }
}

// ============================================
// PODERES OUTORGADOS
// ============================================

export async function adicionarPoderNaProcuracao(
  procuracaoId: string,
  data: {
    titulo?: string;
    descricao: string;
  },
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const descricao = data.descricao?.trim();
    const titulo = data.titulo?.trim();

    if (!descricao) {
      return { success: false, error: "Descrição do poder é obrigatória" };
    }

    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    await prisma.procuracaoPoder.create({
      data: {
        tenantId: user.tenantId,
        procuracaoId,
        titulo: titulo || null,
        descricao,
        ativo: true,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao adicionar poder na procuração:", error);

    return {
      success: false,
      error: "Erro ao adicionar poder na procuração",
    };
  }
}

export async function revogarPoderDaProcuracao(
  procuracaoId: string,
  poderId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const poder = await prisma.procuracaoPoder.findFirst({
      where: {
        id: poderId,
        procuracaoId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        ativo: true,
      },
    });

    if (!poder) {
      return { success: false, error: "Poder não encontrado" };
    }

    if (!poder.ativo) {
      return { success: false, error: "Este poder já está revogado" };
    }

    await prisma.procuracaoPoder.update({
      where: {
        id: poder.id,
      },
      data: {
        ativo: false,
        revogadoEm: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao revogar poder da procuração:", error);

    return {
      success: false,
      error: "Erro ao revogar poder da procuração",
    };
  }
}
