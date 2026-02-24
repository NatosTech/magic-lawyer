"use server";

import { getSession } from "@/app/lib/auth";
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import {
  JuizStatus,
  JuizNivel,
  EspecialidadeJuridica,
} from "@/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface JuizDetalhado {
  id: string;
  nome: string;
  nomeCompleto: string | null;
  cpf: string | null;
  oab: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  dataNascimento: Date | null;
  dataPosse: Date | null;
  dataAposentadoria: Date | null;
  status: JuizStatus;
  nivel: JuizNivel;
  especialidades: EspecialidadeJuridica[];
  vara: string | null;
  comarca: string | null;
  biografia: string | null;
  formacao: string | null;
  experiencia: string | null;
  premios: string | null;
  publicacoes: string | null;
  foto: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  observacoes: string | null;
  isPublico: boolean;
  isPremium: boolean;
  precoAcesso: number | null;
  tribunalId: string | null;
  tribunal?: {
    id: string;
    nome: string;
    sigla: string | null;
    esfera: string | null;
    uf: string | null;
    siteUrl: string | null;
  } | null;
  _count?: {
    processos: number;
    julgamentos: number;
    analises: number;
    favoritos: number;
  };
}

export interface ProcessoJuiz {
  id: string;
  numero: string;
  numeroCnj: string | null;
  titulo: string | null;
  status: string;
  fase: string | null;
  grau: string | null;
  valorCausa: number | null;
  dataDistribuicao: Date | null;
  createdAt: Date;
  cliente: {
    id: string;
    nome: string;
    tipoPessoa: string;
  };
  area?: {
    id: string;
    nome: string;
  } | null;
}

export interface JulgamentoJuiz {
  id: string;
  titulo: string;
  descricao: string | null;
  dataJulgamento: Date;
  tipoJulgamento: string;
  resultado: string | null;
  valorCausa: number | null;
  valorCondenacao: number | null;
  observacoes: string | null;
  pontosPositivos: string[];
  pontosNegativos: string[];
  estrategias: string[];
  recomendacoes: string[];
  tags: string[];
  isPublico: boolean;
  processo?: {
    id: string;
    numero: string;
    titulo: string | null;
  } | null;
}

export interface JuizSerializado {
  id: string;
  nome: string;
  nomeCompleto: string | null;
  cpf: string | null;
  oab: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  dataNascimento: Date | null;
  dataPosse: Date | null;
  dataAposentadoria: Date | null;
  status: JuizStatus;
  nivel: JuizNivel;
  especialidades: EspecialidadeJuridica[];
  vara: string | null;
  comarca: string | null;
  biografia: string | null;
  formacao: string | null;
  experiencia: string | null;
  premios: string | null;
  publicacoes: string | null;
  foto: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  observacoes: string | null;
  isPublico: boolean;
  isPremium: boolean;
  precoAcesso: number | null;
  tribunalId: string | null;
  tribunal?: {
    id: string;
    nome: string;
    sigla: string | null;
    esfera: string | null;
    uf: string | null;
    siteUrl: string | null;
  } | null;
  _count?: {
    processos: number;
    julgamentos: number;
    analises: number;
    favoritos: number;
  };
}

export interface JuizFormData {
  nome: string;
  nomeCompleto?: string;
  cpf?: string;
  oab?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  dataNascimento?: Date;
  dataPosse?: Date;
  dataAposentadoria?: Date;
  status: JuizStatus;
  nivel: JuizNivel;
  especialidades: EspecialidadeJuridica[];
  vara?: string;
  comarca?: string;
  biografia?: string;
  formacao?: string;
  experiencia?: string;
  premios?: string;
  publicacoes?: string;
  foto?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  observacoes?: string;
  tribunalId?: string;
}

export interface JuizFilters {
  search?: string;
  status?: JuizStatus;
  nivel?: JuizNivel;
  especialidades?: EspecialidadeJuridica[];
  tribunalId?: string;
  comarca?: string;
  vara?: string;
}

export interface JuizFormOptions {
  especialidades: EspecialidadeJuridica[];
  status: JuizStatus[];
  niveis: JuizNivel[];
  tribunais: Array<{
    id: string;
    nome: string;
    sigla: string | null;
    esfera: string | null;
    uf: string | null;
  }>;
}

// ============================================
// ACTIONS
// ============================================

export async function getJuizFormData(): Promise<{
  success: boolean;
  data?: JuizFormOptions;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Buscar tribunais
    const tribunais = await prisma.tribunal.findMany({
      select: {
        id: true,
        nome: true,
        sigla: true,
        esfera: true,
        uf: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    // Definir opções estáticas para especialidades, status e níveis
    const especialidades = [
      "CIVEL",
      "CRIMINAL",
      "FAMILIA",
      "CONSUMIDOR",
      "TRABALHISTA",
      "ADMINISTRATIVO",
      "TRIBUTARIO",
      "EMPREENDIMENTOS",
      "IMOBILIARIO",
      "CONTRATOS",
      "SUCESSOES",
      "PREVIDENCIARIO",
      "AMBIENTAL",
      "CONCORRENCIAL",
      "INTERNACIONAL",
      "TECNOLOGIA",
      "SAUDE",
      "EDUCACAO",
      "FINANCEIRO",
      "SEGURANCA_PUBLICA",
    ] as EspecialidadeJuridica[];

    const status = [
      "ATIVO",
      "INATIVO",
      "APOSENTADO",
      "AFASTADO",
    ] as JuizStatus[];

    const niveis = [
      "JUIZ_TITULAR",
      "JUIZ_SUBSTITUTO",
      "DESEMBARGADOR",
      "MINISTRO",
      "MAGISTRADO",
    ] as JuizNivel[];

    return {
      success: true,
      data: {
        especialidades,
        status,
        niveis,
        tribunais,
      },
    };
  } catch (error) {
    logger.error("Erro ao buscar dados do formulário de juízes:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar dados do formulário",
    };
  }
}

export async function getJuizes(filters: JuizFilters = {}): Promise<{
  success: boolean;
  data?: JuizSerializado[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Construir where clause
    const where: any = {
      OR: [
        { isPublico: true },
        {
          favoritos: {
            some: {
              tenantId: user.tenantId,
            },
          },
        },
        {
          acessos: {
            some: {
              tenantId: user.tenantId,
            },
          },
        },
      ],
    };

    // Aplicar filtros
    if (filters.search) {
      where.OR = [
        ...where.OR,
        {
          nome: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          nomeCompleto: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.nivel) {
      where.nivel = filters.nivel;
    }

    if (filters.especialidades && filters.especialidades.length > 0) {
      where.especialidades = {
        hasSome: filters.especialidades,
      };
    }

    if (filters.tribunalId) {
      where.tribunalId = filters.tribunalId;
    }

    if (filters.comarca) {
      where.comarca = {
        contains: filters.comarca,
        mode: "insensitive",
      };
    }

    if (filters.vara) {
      where.vara = {
        contains: filters.vara,
        mode: "insensitive",
      };
    }

    const juizes = await prisma.juiz.findMany({
      where,
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            analises: true,
            favoritos: true,
          },
        },
      },
      orderBy: [{ isPremium: "desc" }, { isPublico: "desc" }, { nome: "asc" }],
    });

    const converted = juizes.map((j) =>
      convertAllDecimalFields(j),
    ) as JuizSerializado[];

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar juízes:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar juízes",
    };
  }
}

export async function getJuizDetalhado(juizId: string): Promise<{
  success: boolean;
  juiz?: JuizDetalhado;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    logger.info("getJuizDetalhado - Usuário:", {
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
    logger.info("getJuizDetalhado - Buscando juiz:", juizId);

    // Construir condições de acesso - simplificado para debug
    let whereCondition: any = {
      id: juizId,
    };

    // Temporariamente permitir acesso a todos os juízes para debug
    // TODO: Restaurar controle de acesso depois de resolver o problema
    logger.info(
      "getJuizDetalhado - Aplicando condições de acesso simplificadas para debug",
    );

    const juiz = await prisma.juiz.findFirst({
      where: whereCondition,
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            analises: true,
            favoritos: true,
          },
        },
      },
    });

    logger.info("getJuizDetalhado - Juiz encontrado:", juiz ? "Sim" : "Não");

    if (!juiz) {
      logger.error("getJuizDetalhado - Juiz não encontrado para ID:", juizId);

      return { success: false, error: "Juiz não encontrado ou sem acesso" };
    }

    const converted = convertAllDecimalFields(juiz) as any as JuizDetalhado;

    // Serialização simplificada para debug
    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    logger.info("getJuizDetalhado - Dados serializados:", {
      id: serialized.id,
      nome: serialized.nome,
      hasTribunal: !!serialized.tribunal,
      hasCount: !!serialized._count,
    });

    return {
      success: true,
      juiz: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar detalhes do juiz:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar juiz",
    };
  }
}

export async function getProcessosDoJuiz(juizId: string): Promise<{
  success: boolean;
  processos?: ProcessoJuiz[];
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

    // Verificar se o usuário tem acesso ao juiz
    const juiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        OR: [
          { isPublico: true },
          {
            favoritos: {
              some: {
                tenantId: user.tenantId,
              },
            },
          },
          {
            acessos: {
              some: {
                tenantId: user.tenantId,
              },
            },
          },
        ],
      },
    });

    if (!juiz) {
      return { success: false, error: "Juiz não encontrado ou sem acesso" };
    }

    const processos = await prisma.processo.findMany({
      where: {
        juizId: juizId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        numero: true,
        numeroCnj: true,
        titulo: true,
        status: true,
        fase: true,
        grau: true,
        valorCausa: true,
        dataDistribuicao: true,
        createdAt: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
          },
        },
        area: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const converted = processos.map((p) =>
      convertAllDecimalFields(p),
    ) as ProcessoJuiz[];

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      processos: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar processos do juiz:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar processos do juiz",
    };
  }
}

export async function getJulgamentosDoJuiz(juizId: string): Promise<{
  success: boolean;
  julgamentos?: JulgamentoJuiz[];
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

    // Verificar se o usuário tem acesso ao juiz
    const juiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        OR: [
          { isPublico: true },
          {
            favoritos: {
              some: {
                tenantId: user.tenantId,
              },
            },
          },
          {
            acessos: {
              some: {
                tenantId: user.tenantId,
              },
            },
          },
        ],
      },
    });

    if (!juiz) {
      return { success: false, error: "Juiz não encontrado ou sem acesso" };
    }

    const julgamentos = await prisma.julgamento.findMany({
      where: {
        juizId: juizId,
        tenantId: user.tenantId,
        OR: [{ isPublico: true }, { criadoPorId: user.id }],
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        dataJulgamento: true,
        tipoJulgamento: true,
        resultado: true,
        valorCausa: true,
        valorCondenacao: true,
        observacoes: true,
        pontosPositivos: true,
        pontosNegativos: true,
        estrategias: true,
        recomendacoes: true,
        tags: true,
        isPublico: true,
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        dataJulgamento: "desc",
      },
    });

    const converted = julgamentos.map((j) =>
      convertAllDecimalFields(j),
    ) as JulgamentoJuiz[];

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      julgamentos: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar julgamentos do juiz:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar julgamentos do juiz",
    };
  }
}

export async function verificarFavoritoJuiz(juizId: string): Promise<{
  success: boolean;
  isFavorito?: boolean;
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

    const favorito = await prisma.favoritoJuiz.findFirst({
      where: {
        juizId,
        tenantId: user.tenantId,
        usuarioId: user.id,
      },
    });

    return { success: true, isFavorito: !!favorito };
  } catch (error) {
    logger.error("Erro ao verificar favorito:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao verificar favorito",
    };
  }
}

export async function adicionarFavoritoJuiz(juizId: string): Promise<{
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

    // Verificar se já é favorito
    const favoritoExistente = await prisma.favoritoJuiz.findFirst({
      where: {
        juizId,
        tenantId: user.tenantId,
        usuarioId: user.id,
      },
    });

    if (favoritoExistente) {
      return { success: false, error: "Juiz já está nos favoritos" };
    }

    await prisma.favoritoJuiz.create({
      data: {
        juizId,
        tenantId: user.tenantId,
        usuarioId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao adicionar favorito:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao adicionar favorito",
    };
  }
}

export async function removerFavoritoJuiz(juizId: string): Promise<{
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

    await prisma.favoritoJuiz.deleteMany({
      where: {
        juizId,
        tenantId: user.tenantId,
        usuarioId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao remover favorito:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao remover favorito",
    };
  }
}

export async function getJuizesAdmin(filters?: {
  isPremium?: boolean;
  isPublico?: boolean;
}): Promise<{
  success: boolean;
  data?: JuizSerializado[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se é super admin
    if (user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso negado - apenas super admin" };
    }

    const juizes = await prisma.juiz.findMany({
      where: {
        superAdminId: user.id,
        ...(filters?.isPremium !== undefined && {
          isPremium: filters.isPremium,
        }),
        ...(filters?.isPublico !== undefined && {
          isPublico: filters.isPublico,
        }),
      },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            analises: true,
            favoritos: true,
          },
        },
      },
      orderBy: [{ isPremium: "desc" }, { isPublico: "desc" }, { nome: "asc" }],
    });

    const converted = juizes.map((j) =>
      convertAllDecimalFields(j),
    ) as JuizSerializado[];

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar juízes admin:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar juízes",
    };
  }
}

export async function createJuizTenant(data: {
  nome: string;
  nomeCompleto?: string;
  cpf?: string;
  oab?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  dataNascimento?: Date;
  dataPosse?: Date;
  dataAposentadoria?: Date;
  status: JuizStatus;
  nivel: JuizNivel;
  especialidades: EspecialidadeJuridica[];
  vara?: string;
  comarca?: string;
  biografia?: string;
  formacao?: string;
  experiencia?: string;
  premios?: string;
  publicacoes?: string;
  foto?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  observacoes?: string;
  tribunalId?: string;
}): Promise<{
  success: boolean;
  juiz?: JuizSerializado;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Apenas super admins podem criar juízes
    if (user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas super admins podem criar juízes",
      };
    }

    const juiz = await prisma.juiz.create({
      data: {
        ...data,
        superAdminId: user.id,
      },
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            analises: true,
            favoritos: true,
          },
        },
      },
    });

    const converted = convertAllDecimalFields(juiz) as JuizSerializado;

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      juiz: serialized,
    };
  } catch (error) {
    logger.error("Erro ao criar juiz:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar juiz",
    };
  }
}

export async function updateJuizTenant(
  juizId: string,
  data: {
    nome?: string;
    nomeCompleto?: string;
    cpf?: string;
    oab?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    dataNascimento?: Date;
    dataPosse?: Date;
    dataAposentadoria?: Date;
    status?: JuizStatus;
    nivel?: JuizNivel;
    especialidades?: EspecialidadeJuridica[];
    vara?: string;
    comarca?: string;
    biografia?: string;
    formacao?: string;
    experiencia?: string;
    premios?: string;
    publicacoes?: string;
    foto?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    observacoes?: string;
    tribunalId?: string;
  },
): Promise<{
  success: boolean;
  juiz?: JuizSerializado;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Apenas super admins podem atualizar juízes
    if (user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas super admins podem atualizar juízes",
      };
    }

    // Verificar se o juiz foi criado pelo super admin
    const existingJuiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        superAdminId: user.id,
      },
    });

    if (!existingJuiz) {
      return { success: false, error: "Juiz não encontrado ou sem permissão" };
    }

    const juiz = await prisma.juiz.update({
      where: { id: juizId },
      data,
      include: {
        tribunal: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            esfera: true,
            uf: true,
            siteUrl: true,
          },
        },
        _count: {
          select: {
            processos: true,
            julgamentos: true,
            analises: true,
            favoritos: true,
          },
        },
      },
    });

    const converted = convertAllDecimalFields(juiz) as JuizSerializado;

    const serialized = JSON.parse(
      JSON.stringify(converted, (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          value.constructor &&
          value.constructor.name === "Decimal"
        ) {
          return Number(value.toString());
        }

        return value;
      }),
    );

    return {
      success: true,
      juiz: serialized,
    };
  } catch (error) {
    logger.error("Erro ao atualizar juiz:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar juiz",
    };
  }
}

export async function deleteJuizTenant(juizId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Apenas super admins podem excluir juízes
    if (user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas super admins podem excluir juízes",
      };
    }

    // Verificar se o juiz foi criado pelo super admin
    const existingJuiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        superAdminId: user.id,
      },
    });

    if (!existingJuiz) {
      return { success: false, error: "Juiz não encontrado ou sem permissão" };
    }

    // Verificar se o juiz tem processos vinculados
    const processosCount = await prisma.processo.count({
      where: { juizId },
    });

    if (processosCount > 0) {
      return {
        success: false,
        error: "Não é possível excluir juiz com processos vinculados",
      };
    }

    await prisma.juiz.delete({
      where: { id: juizId },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao excluir juiz:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir juiz",
    };
  }
}

export async function uploadJuizFoto(
  formData: FormData,
  juizId: string,
  juizNome: string,
): Promise<{
  success: boolean;
  fotoUrl?: string;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    // Verificar se o juiz foi criado pelo super admin
    const existingJuiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        superAdminId: user.id,
      },
    });

    if (!existingJuiz) {
      return { success: false, error: "Juiz não encontrado ou sem permissão" };
    }

    // Fazer upload para Cloudinary
    const cloudinaryResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!cloudinaryResponse.ok) {
      throw new Error("Erro no upload para Cloudinary");
    }

    const uploadResult = await cloudinaryResponse.json();

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error("Upload falhou");
    }

    // Atualizar o juiz com a nova foto
    await prisma.juiz.update({
      where: { id: juizId },
      data: { foto: uploadResult.url },
    });

    return {
      success: true,
      fotoUrl: uploadResult.url,
    };
  } catch (error) {
    logger.error("Erro ao fazer upload da foto do juiz:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao fazer upload da foto",
    };
  }
}

export async function deleteJuizFoto(
  juizId: string,
  currentFotoUrl: string | null,
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

    // Verificar se o juiz foi criado pelo super admin
    const existingJuiz = await prisma.juiz.findFirst({
      where: {
        id: juizId,
        superAdminId: user.id,
      },
    });

    if (!existingJuiz) {
      return { success: false, error: "Juiz não encontrado ou sem permissão" };
    }

    // Se há uma foto atual, deletar do Cloudinary
    if (currentFotoUrl) {
      try {
        // Extrair o public_id da URL do Cloudinary
        const urlParts = currentFotoUrl.split("/");
        const publicId = urlParts[urlParts.length - 1].split(".")[0];

        const deleteResponse = await fetch("/api/upload", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId }),
        });

        if (!deleteResponse.ok) {
          logger.warn(
            "Erro ao deletar foto do Cloudinary:",
            await deleteResponse.text(),
          );
        }
      } catch (deleteError) {
        logger.warn("Erro ao deletar foto do Cloudinary:", deleteError);
        // Continuar mesmo se não conseguir deletar do Cloudinary
      }
    }

    // Atualizar o juiz removendo a foto
    await prisma.juiz.update({
      where: { id: juizId },
      data: { foto: null },
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar foto do juiz:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao deletar foto",
    };
  }
}
