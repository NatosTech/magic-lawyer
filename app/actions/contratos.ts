"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/auth";
import prisma, { convertAllDecimalFields } from "@/app/lib/prisma";
import { UploadService } from "@/lib/upload-service";
import { ContratoStatus } from "@/generated/prisma";
import logger from "@/lib/logger";
import { checkPermission } from "@/app/actions/equipe";
import {
  getAccessibleAdvogadoIds,
  getAdvogadoIdFromSession,
} from "@/app/lib/advogado-access";
import { UserRole } from "@/generated/prisma";

// ============================================
// TYPES
// ============================================

export interface ContratoCreateInput {
  titulo: string;
  resumo?: string;
  tipoContratoId?: string;
  modeloContratoId?: string;
  arquivoUrl?: string;
  status?: ContratoStatus;
  valor?: number;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  clienteId: string;
  advogadoId?: string;
  processoId?: string;
  dadosBancariosId?: string;
  observacoes?: string;
}

async function ensureContratoRelacoesValidas(
  session: any,
  data: {
    tenantId: string;
    clienteId?: string | null;
    advogadoId?: string | null;
    processoId?: string | null;
    dadosBancariosId?: string | null;
    tipoContratoId?: string | null;
    modeloContratoId?: string | null;
  },
  allowAdminToBypassAdvogado = false,
) {
  const { tenantId } = data;

  if (data.tipoContratoId) {
    const tipo = await prisma.tipoContrato.findFirst({
      where: {
        id: data.tipoContratoId,
        OR: [{ tenantId }, { tenantId: "GLOBAL" }],
      },
      select: { id: true },
    });

    if (!tipo) {
      return { error: "Tipo de contrato não encontrado." };
    }
  }

  if (data.modeloContratoId) {
    const modelo = await prisma.modeloContrato.findFirst({
      where: {
        id: data.modeloContratoId,
        tenantId,
      },
      select: { id: true },
    });

    if (!modelo) {
      return {
        error: "Modelo de contrato não encontrado ou indisponível para este escritório.",
      };
    }
  }

  if (data.advogadoId) {
    const advogado = await prisma.advogado.findFirst({
      where: {
        id: data.advogadoId,
        tenantId,
      },
      select: {
        id: true,
        usuario: {
          select: {
            active: true,
          },
        },
      },
    });

    if (!advogado || !advogado.usuario.active) {
      return { error: "Advogado responsável inválido." };
    }

    if (
      session.user?.role === UserRole.ADVOGADO &&
      !allowAdminToBypassAdvogado &&
      data.advogadoId !== undefined
    ) {
      const advogadoSessao = await getAdvogadoIdFromSession(session);

      if (advogadoSessao && data.advogadoId !== advogadoSessao) {
        return {
          error:
            "Advogados só podem editar contratos vinculados a eles mesmos.",
        };
      }
    }
  }

  if (data.processoId) {
    const processo = await prisma.processo.findFirst({
      where: {
        id: data.processoId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!processo) {
      return { error: "Processo não encontrado." };
    }
  }

  if (data.dadosBancariosId) {
    const dadosBancarios = await prisma.dadosBancarios.findFirst({
      where: {
        id: data.dadosBancariosId,
        tenantId,
        ativo: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!dadosBancarios) {
      return { error: "Dados bancários não encontrados ou inativos." };
    }
  }

  if (data.clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: data.clienteId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!cliente) {
      return { error: "Cliente não encontrado." };
    }
  }

  return { error: null };
}

// ============================================
// HELPERS
// ============================================

async function getSession() {
  return await getServerSession(authOptions);
}

function getFormStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumberFromText(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  return Number.isNaN(parsed) ? undefined : parsed;
}

function toPdfFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function normalizeDateFromForm(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeContratoStatus(value: string): ContratoStatus | undefined {
  if (!value) {
    return undefined;
  }

  const status = value as ContratoStatus;

  return Object.values(ContratoStatus).includes(status)
    ? status
    : undefined;
}

// ============================================
// ACTIONS - BUSCAR PROCURAÇÕES
// ============================================

export async function getProcuracoesDisponiveis(clienteId: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const user = session.user;
  const tenantId = user.tenantId;

  try {
    // Buscar procurações ativas do cliente
    const procuracoes = await prisma.procuracao.findMany({
      where: {
        tenantId,
        clienteId,
        ativa: true,
      },
      include: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return procuracoes;
  } catch (error) {
    logger.error("Erro ao buscar procurações:", error);
    throw new Error("Erro ao buscar procurações disponíveis");
  }
}

/**
 * Vincula uma procuração a um contrato através do processo
 *
 * Lógica:
 * - Se o contrato JÁ tem um processo: valida se a procuração está vinculada a esse processo
 * - Se o contrato NÃO tem processo: vincula o contrato ao primeiro processo da procuração
 * - Se a procuração não tem processos: retorna erro
 */
export async function vincularContratoProcuracao(
  contratoId: string,
  procuracaoId: string,
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const user = session.user;
  const tenantId = user.tenantId;

  try {
    // Verificar se o contrato existe e pertence ao tenant
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId,
        deletedAt: null,
      },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Verificar se a procuração existe e está ativa
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId,
        ativa: true,
      },
      include: {
        processos: {
          include: {
            processo: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        },
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada ou inativa" };
    }

    // Caso 1: Contrato JÁ tem um processo vinculado
    if (contrato.processoId) {
      const processoVinculado = procuracao.processos.find(
        (pp) => pp.processoId === contrato.processoId,
      );

      if (!processoVinculado) {
        return {
          success: false,
          error: `Este contrato está vinculado ao processo ${contrato.processo?.numero}, mas a procuração selecionada não está vinculada a este processo. Primeiro vincule a procuração ao processo.`,
        };
      }

      // Processo já está vinculado e procuração também está nesse processo
      return {
        success: true,
        message: `Vinculação confirmada! O contrato e a procuração já estão conectados através do processo ${contrato.processo?.numero}`,
      };
    }

    // Caso 2: Contrato NÃO tem processo - vamos vincular ao primeiro processo da procuração
    if (procuracao.processos.length === 0) {
      return {
        success: false,
        error:
          "Esta procuração não está vinculada a nenhum processo. Primeiro vincule a procuração a um processo.",
      };
    }

    // Vincular o contrato ao primeiro processo da procuração
    const processoParaVincular = procuracao.processos[0];

    await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        processoId: processoParaVincular.processoId,
      },
    });

    return {
      success: true,
      message: `Contrato vinculado com sucesso ao processo ${processoParaVincular.processo.numero}! Agora o contrato e a procuração estão conectados.`,
    };
  } catch (error) {
    logger.error("Erro ao vincular contrato à procuração:", error);

    return {
      success: false,
      error: "Erro ao processar vinculação",
    };
  }
}

// ============================================
// ACTIONS - CRIAR CONTRATO
// ============================================

export async function createContrato(data: ContratoCreateInput) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;

    if (!user.tenantId) {
      return { success: false, error: "Tenant não encontrado" };
    }

    // Verificar permissão para criar contratos
    const podeCriar = await checkPermission("financeiro", "criar");

    if (!podeCriar) {
      return {
        success: false,
        error: "Você não tem permissão para criar contratos",
      };
    }

    // Validar campos obrigatórios
    if (!data.titulo || !data.clienteId) {
      return { success: false, error: "Título e cliente são obrigatórios" };
    }

    // Validar acesso ao cliente
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

    // Se for ADVOGADO, validar vínculo com o cliente
    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (!advogadoId) {
        return { success: false, error: "Advogado não encontrado" };
      }

      const vinculo = await prisma.advogadoCliente.findFirst({
        where: {
          advogadoId,
          clienteId: cliente.id,
          tenantId: user.tenantId,
        },
      });

      if (!vinculo) {
        return { success: false, error: "Você não tem acesso a este cliente" };
      }

      // Se não informou advogado, usar o próprio
      if (!data.advogadoId) {
        data.advogadoId = advogadoId;
      }
    }

    const validacaoRelacoes = await ensureContratoRelacoesValidas(session, {
      tenantId: user.tenantId,
      clienteId: data.clienteId,
      advogadoId: data.advogadoId || null,
      processoId: data.processoId || null,
      dadosBancariosId: data.dadosBancariosId || null,
      tipoContratoId: data.tipoContratoId || null,
      modeloContratoId: data.modeloContratoId || null,
    });

    if (validacaoRelacoes.error) {
      return {
        success: false,
        error: validacaoRelacoes.error,
      };
    }

    // Criar contrato
    const contrato = await prisma.contrato.create({
      data: {
        tenantId: user.tenantId,
        titulo: data.titulo,
        resumo: data.resumo,
        arquivoUrl: data.arquivoUrl,
        tipoId: data.tipoContratoId,
        modeloId: data.modeloContratoId,
        status: data.status || ContratoStatus.RASCUNHO,
        valor: data.valor,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        clienteId: data.clienteId,
        advogadoResponsavelId: data.advogadoId,
        processoId: data.processoId,
        dadosBancariosId: data.dadosBancariosId,
        observacoes: data.observacoes,
        criadoPorId: user.id,
      },
      include: {
        cliente: true,
        tipo: true,
        modelo: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
        dadosBancarios: true,
      },
    });

    // Notificar criação do contrato
    try {
      const { NotificationService } = await import(
        "@/app/lib/notifications/notification-service"
      );
      const { NotificationFactory } = await import(
        "@/app/lib/notifications/domain/notification-factory"
      );

      // Determinar destinatários
      const recipients: string[] = [];

      // Admin do tenant
      const admin = await prisma.usuario.findFirst({
        where: {
          tenantId: user.tenantId,
          role: "ADMIN",
        },
        select: { id: true },
      });

      if (admin) recipients.push(admin.id);

      // Advogado responsável
      if (contrato.advogadoResponsavel?.usuario?.id) {
        recipients.push(contrato.advogadoResponsavel.usuario.id);
      }

      // Cliente (se tiver usuário)
      const clienteUsuario = await prisma.usuario.findFirst({
        where: {
          tenantId: user.tenantId,
          clientes: {
            some: { id: contrato.clienteId },
          },
        },
        select: { id: true },
      });

      if (clienteUsuario) recipients.push(clienteUsuario.id);

      // Enviar notificação para cada destinatário
      const basePayload = {
        contratoId: contrato.id,
        clienteId: contrato.clienteId,
        clienteNome: contrato.cliente.nome,
      };

      for (const recipientId of recipients) {
        const event = NotificationFactory.createEvent(
          "contrato.created",
          user.tenantId,
          recipientId,
          {
            ...basePayload,
            titulo: contrato.titulo,
            valor: Number(contrato.valor),
            status: contrato.status,
          },
        );

        await NotificationService.publishNotification(event);
      }
    } catch (notificationError) {
      // Não falhar criação do contrato se notificação falhar
      console.error(
        "[Contrato] Erro ao enviar notificação:",
        notificationError,
      );
    }

    // Converter Decimals para number antes de retornar
    const contratoSerializado = {
      ...contrato,
      valor: Number(contrato.valor),
      comissaoAdvogado: Number(contrato.comissaoAdvogado),
      percentualAcaoGanha: Number(contrato.percentualAcaoGanha),
      valorAcaoGanha: Number(contrato.valorAcaoGanha),
      advogadoResponsavel: contrato.advogadoResponsavel
        ? {
            ...contrato.advogadoResponsavel,
            comissaoPadrao: Number(contrato.advogadoResponsavel.comissaoPadrao),
            comissaoAcaoGanha: Number(
              contrato.advogadoResponsavel.comissaoAcaoGanha,
            ),
            comissaoHonorarios: Number(
              contrato.advogadoResponsavel.comissaoHonorarios,
            ),
          }
        : null,
    };

    return {
      success: true,
      contrato: contratoSerializado,
    };
  } catch (error) {
    logger.error("Erro ao criar contrato:", error);

    return {
      success: false,
      error: "Erro ao criar contrato",
    };
  }
}

export async function createContratoComArquivo(formData: FormData) {
  const file = toPdfFile(formData.get("arquivoContrato"));
  let uploadedArquivoUrl: string | undefined;
  let uploadedArquivoPublicId: string | undefined;
  let uploaderUserId: string = "system";

  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    uploaderUserId = user.id;
    const titulo = getFormStringValue(formData.get("titulo"));
    const resumo = getFormStringValue(formData.get("resumo"));
    const observacoes = getFormStringValue(formData.get("observacoes"));
    const tipoContratoId = getFormStringValue(formData.get("tipoContratoId"));
    const modeloContratoId = getFormStringValue(formData.get("modeloContratoId"));
    const status = normalizeContratoStatus(
      getFormStringValue(formData.get("status")),
    );
    const clienteId = getFormStringValue(formData.get("clienteId"));
    const advogadoId = getFormStringValue(formData.get("advogadoId"));
    const processoId = getFormStringValue(formData.get("processoId"));
    const dadosBancariosId = getFormStringValue(formData.get("dadosBancariosId"));
    const valor = parseNumberFromText(getFormStringValue(formData.get("valor")));
    const dataInicio = normalizeDateFromForm(
      getFormStringValue(formData.get("dataInicio")),
    );
    const dataFim = normalizeDateFromForm(
      getFormStringValue(formData.get("dataFim")),
    );

    if (!titulo || !clienteId) {
      return { success: false, error: "Título e cliente são obrigatórios" };
    }

    if (file) {
      const mimeType = file.type?.toLowerCase() || "";
      const fileName = file.name || "contrato.pdf";
      const hasPdfMime = mimeType === "application/pdf";
      const hasPdfExtension = fileName.toLowerCase().endsWith(".pdf");

      if (!hasPdfMime && !hasPdfExtension) {
        return { success: false, error: "Apenas arquivos PDF são permitidos." };
      }

      const maxSize = 10 * 1024 * 1024;

      if (file.size > maxSize) {
        return {
          success: false,
          error: "Arquivo muito grande. Máximo permitido: 10MB",
        };
      }

      const tenantSlug =
        user.tenantSlug ||
        (await prisma.tenant
          .findUnique({ where: { id: user.tenantId }, select: { slug: true } })
          .then((tenant) => tenant?.slug)) ||
        "default";

      const uploadService = UploadService.getInstance();
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadResult = await uploadService.uploadDocumento(
        buffer,
        user.id,
        fileName,
        tenantSlug,
        {
          tipo: "contrato",
          identificador: clienteId,
          fileName: fileName,
        },
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || "Erro ao anexar PDF",
        };
      }

      uploadedArquivoUrl = uploadResult.url;
      uploadedArquivoPublicId = uploadResult.publicId;
    }

    const createData: ContratoCreateInput = {
      titulo,
      resumo,
      observacoes,
      tipoContratoId: tipoContratoId || undefined,
      modeloContratoId: modeloContratoId || undefined,
      status,
      valor,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      clienteId,
      advogadoId: advogadoId || undefined,
      processoId: processoId || undefined,
      dadosBancariosId: dadosBancariosId || undefined,
      arquivoUrl: uploadedArquivoUrl,
    };

    const result = await createContrato(createData);

    if (!result.success) {
      if (uploadedArquivoUrl) {
        const uploadService = UploadService.getInstance();

        const deleteResult = await uploadService.deleteDocumento(
          uploadedArquivoUrl,
          uploaderUserId,
        );

        if (!deleteResult.success) {
          logger.warn("Falha ao remover arquivo de contrato sem uso", {
            contratoArquivoUrl: uploadedArquivoUrl,
            publicId: uploadedArquivoPublicId,
          });
        }
      }

      return result;
    }

    if (result.contrato?.id) {
      revalidatePath("/contratos");
      revalidatePath(`/contratos/${result.contrato.id}`);
    }

    return result;
  } catch (error) {
    if (uploadedArquivoUrl) {
      try {
        const uploadService = UploadService.getInstance();
        const deleteResult = await uploadService.deleteDocumento(
          uploadedArquivoUrl,
          uploaderUserId,
        );

        if (!deleteResult.success) {
          logger.warn("Falha ao remover arquivo de contrato após erro crítico", {
            contratoArquivoUrl: uploadedArquivoUrl,
            publicId: uploadedArquivoPublicId,
          });
        }
      } catch (cleanupError) {
        logger.warn(
          "Falha extra ao limpar arquivo de contrato após erro crítico",
          cleanupError,
        );
      }
    }

    logger.error("Erro ao criar contrato com arquivo:", error);

    return {
      success: false,
      error: "Erro ao criar contrato",
    };
  }
}

// ============================================
// ACTIONS - LISTAR CONTRATOS
// ============================================

/**
 * Busca todos os contratos do tenant
 */
export async function getAllContratos(): Promise<{
  success: boolean;
  contratos?: any[];
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

    // Controlar acesso por role
    let whereClause: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isAdmin && user.role !== "CLIENTE") {
      // Staff vinculado ou ADVOGADO - usar advogados acessíveis
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros)
      if (accessibleAdvogados.length > 0) {
        whereClause.advogadoResponsavelId = {
          in: accessibleAdvogados,
        };
      }
    }

    const contratos = await prisma.contrato.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            nome: true,
          },
        },
        advogadoResponsavel: {
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
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            procuracoesVinculadas: {
              select: {
                procuracao: {
                  select: {
                    id: true,
                    numero: true,
                    ativa: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number
    const contratosFormatted = contratos.map((c: any) => ({
      ...c,
      valor: Number(c.valor),
      comissaoAdvogado: Number(c.comissaoAdvogado),
      percentualAcaoGanha: Number(c.percentualAcaoGanha),
      valorAcaoGanha: Number(c.valorAcaoGanha),
    }));

    return {
      success: true,
      contratos: contratosFormatted,
    };
  } catch (error) {
    logger.error("Erro ao buscar contratos:", error);

    return {
      success: false,
      error: "Erro ao buscar contratos",
    };
  }
}

// ============================================
// ACTIONS - EXCLUIR CONTRATO
// ============================================

export async function deleteContrato(contratoId: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
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

    const podeExcluir = await checkPermission("financeiro", "excluir");

    if (!podeExcluir) {
      return {
        success: false,
        error: "Você não tem permissão para excluir contratos",
      };
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, titulo: true },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    await prisma.contrato.update({
      where: { id: contratoId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/contratos");

    return {
      success: true,
      message: `Contrato ${contrato.titulo} removido com sucesso.`,
    };
  } catch (error) {
    logger.error("Erro ao excluir contrato:", error);

    return {
      success: false,
      error: "Erro ao excluir contrato",
    };
  }
}

/**
 * Busca um contrato específico por ID
 */
export async function getContratoById(contratoId: string): Promise<{
  success: boolean;
  contrato?: any;
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

    // Se for ADVOGADO, buscar apenas contratos onde ele é responsável
    let whereClause: any = {
      id: contratoId,
      tenantId: user.tenantId,
      deletedAt: null,
    };

    if (user.role === "ADVOGADO") {
      const advogadoId = await getAdvogadoIdFromSession(session);

      if (advogadoId) {
        whereClause.advogadoResponsavelId = advogadoId;
      }
    }

    const contrato = await prisma.contrato.findFirst({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
            email: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            id: true,
            nome: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            oabNumero: true,
            oabUf: true,
            usuario: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        processo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            status: true,
            procuracoesVinculadas: {
              select: {
                procuracao: {
                  select: {
                    id: true,
                    numero: true,
                    ativa: true,
                  },
                },
              },
            },
          },
        },
        faturas: {
          select: {
            id: true,
            numero: true,
            valor: true,
            vencimento: true,
            status: true,
          },
        },
      },
    });

    if (!contrato) {
      return { success: false, error: "Contrato não encontrado" };
    }

    // Converter Decimal para number
    const contratoFormatted = {
      ...contrato,
      valor: Number(contrato.valor),
      comissaoAdvogado: Number(contrato.comissaoAdvogado),
      percentualAcaoGanha: Number(contrato.percentualAcaoGanha),
      valorAcaoGanha: Number(contrato.valorAcaoGanha),
      faturas: contrato.faturas.map((f: any) => ({
        ...f,
        valor: Number(f.valor),
      })),
    };

    return {
      success: true,
      contrato: contratoFormatted,
    };
  } catch (error) {
    logger.error("Erro ao buscar contrato:", error);

    return {
      success: false,
      error: "Erro ao buscar contrato",
    };
  }
}

// ============================================
// ACTIONS - ATUALIZAR CONTRATO
// ============================================

export interface ContratoUpdateInput extends Partial<ContratoCreateInput> {
  id: string;
}

/**
 * Atualiza um contrato existente
 */
export async function updateContrato(
  contratoId: string,
  data: Partial<ContratoCreateInput>,
): Promise<{
  success: boolean;
  contrato?: any;
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

    // Verificar permissão para editar contratos
    const podeEditar = await checkPermission("financeiro", "editar");

    if (!podeEditar) {
      return {
        success: false,
        error: "Você não tem permissão para editar contratos",
      };
    }

    // Verificar se o contrato existe e o usuário tem permissão
    const contratoExistente = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!contratoExistente) {
      return { success: false, error: "Contrato não encontrado" };
    }

    if (
      user.role === "ADVOGADO" &&
      data.clienteId &&
      data.clienteId !== contratoExistente.clienteId
    ) {
      const advogadoIdSessao = await getAdvogadoIdFromSession(session);
      const possuiAcesso = await prisma.advogadoCliente.findFirst({
        where: {
          advogadoId: advogadoIdSessao || "",
          clienteId: data.clienteId,
          tenantId: user.tenantId,
        },
      });

      if (!possuiAcesso) {
        return {
          success: false,
          error: "Você não tem acesso ao cliente informado",
        };
      }
    }

    const validacaoRelacoes = await ensureContratoRelacoesValidas(
      session,
      {
        tenantId: user.tenantId,
        clienteId: data.clienteId || contratoExistente.clienteId,
        advogadoId:
          data.advogadoId === undefined
            ? contratoExistente.advogadoResponsavelId
            : data.advogadoId,
        processoId:
          data.processoId === undefined
            ? contratoExistente.processoId
            : data.processoId,
        dadosBancariosId:
          data.dadosBancariosId === undefined
            ? contratoExistente.dadosBancariosId
            : data.dadosBancariosId,
        tipoContratoId: data.tipoContratoId || null,
        modeloContratoId: data.modeloContratoId || null,
      },
      true,
    );

    if (validacaoRelacoes.error) {
      return {
        success: false,
        error: validacaoRelacoes.error,
      };
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.resumo !== undefined) updateData.resumo = data.resumo;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.valor !== undefined) updateData.valor = data.valor;
    if (data.dataInicio !== undefined) {
      updateData.dataInicio =
        data.dataInicio instanceof Date
          ? data.dataInicio
          : new Date(data.dataInicio);
    }
    if (data.dataFim !== undefined) {
      updateData.dataFim =
        data.dataFim instanceof Date ? data.dataFim : new Date(data.dataFim);
    }
    if (data.observacoes !== undefined)
      updateData.observacoes = data.observacoes;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.advogadoId !== undefined)
      updateData.advogadoResponsavelId = data.advogadoId;
    if (data.processoId !== undefined) updateData.processoId = data.processoId;
    if (data.tipoContratoId !== undefined)
      updateData.tipoId = data.tipoContratoId;
    if (data.modeloContratoId !== undefined)
      updateData.modeloId = data.modeloContratoId;
    if (data.dadosBancariosId !== undefined)
      updateData.dadosBancariosId = data.dadosBancariosId;

    // Detectar mudança de status para notificações
    const statusChanged =
      data.status !== undefined && data.status !== contratoExistente.status;
    const oldStatus = contratoExistente.status;
    const newStatus = data.status;

    // Atualizar contrato
    const contratoAtualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
          },
        },
        dadosBancarios: true,
        tipo: {
          select: {
            nome: true,
          },
        },
        advogadoResponsavel: {
          select: {
            id: true,
            usuario: {
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

    // Notificar mudança de status
    if (statusChanged && newStatus) {
      try {
        const { NotificationService } = await import(
          "@/app/lib/notifications/notification-service"
        );
        const { NotificationFactory } = await import(
          "@/app/lib/notifications/domain/notification-factory"
        );

        // Determinar tipo de evento baseado no novo status
        let eventType: string;

        if (newStatus === "ATIVO") {
          eventType = "contrato.signed";
        } else if (newStatus === "CANCELADO") {
          eventType = "contrato.cancelled";
        } else {
          eventType = "contrato.status_changed";
        }

        // Verificar expiração (se dataFim foi definida e passou)
        if (
          contratoAtualizado.dataFim &&
          new Date(contratoAtualizado.dataFim) < new Date()
        ) {
          eventType = "contrato.expired";
        }

        // Determinar destinatários
        const recipients: string[] = [];

        // Admin do tenant
        const admin = await prisma.usuario.findFirst({
          where: {
            tenantId: user.tenantId,
            role: "ADMIN",
          },
          select: { id: true },
        });

        if (admin) recipients.push(admin.id);

        // Advogado responsável
        if (contratoAtualizado.advogadoResponsavel?.usuario?.id) {
          recipients.push(contratoAtualizado.advogadoResponsavel.usuario.id);
        }

        // Cliente
        const clienteUsuario = await prisma.usuario.findFirst({
          where: {
            tenantId: user.tenantId,
            clientes: {
              some: { id: contratoAtualizado.clienteId },
            },
          },
          select: { id: true },
        });

        if (clienteUsuario) recipients.push(clienteUsuario.id);

        // Enviar notificação
        const basePayload = {
          contratoId: contratoAtualizado.id,
          clienteId: contratoAtualizado.clienteId,
          clienteNome: contratoAtualizado.cliente.nome,
        };

        for (const recipientId of recipients) {
          let payload: Record<string, any> = basePayload;

          if (eventType === "contrato.signed") {
            payload = {
              ...basePayload,
              dataAssinatura: (
                contratoAtualizado.dataAssinatura ?? new Date()
              ).toISOString(),
            };
          } else if (eventType === "contrato.cancelled") {
            payload = { ...basePayload };
          } else if (eventType === "contrato.expired") {
            payload = {
              ...basePayload,
              dataFim: contratoAtualizado.dataFim
                ? new Date(contratoAtualizado.dataFim).toISOString()
                : new Date().toISOString(),
            };
          } else {
            payload = {
              ...basePayload,
              oldStatus: oldStatus,
              newStatus: newStatus,
            };
          }

          const event = NotificationFactory.createEvent(
            eventType as any,
            user.tenantId,
            recipientId,
            payload,
          );

          await NotificationService.publishNotification(event);
        }
      } catch (notificationError) {
        console.error(
          "[Contrato] Erro ao enviar notificação de status:",
          notificationError,
        );
      }
    }

    // Converter Decimal para number
    const contratoSerializado = {
      ...contratoAtualizado,
      valor: Number(contratoAtualizado.valor),
      comissaoAdvogado: Number(contratoAtualizado.comissaoAdvogado),
      percentualAcaoGanha: Number(contratoAtualizado.percentualAcaoGanha),
      valorAcaoGanha: Number(contratoAtualizado.valorAcaoGanha),
    };

    return {
      success: true,
      contrato: contratoSerializado,
    };
  } catch (error) {
    logger.error("Erro ao atualizar contrato:", error);

    return {
      success: false,
      error: "Erro ao atualizar contrato",
    };
  }
}

// ============================================
// ACTIONS - CONTRATOS COM PARCELAS
// ============================================

export async function getContratosComParcelas(): Promise<{
  success: boolean;
  contratos?: any[];
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

    // Controlar acesso por role
    let whereClause: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isAdmin && user.role !== "CLIENTE") {
      // Staff vinculado ou ADVOGADO - usar advogados acessíveis
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros)
      if (accessibleAdvogados.length > 0) {
        whereClause.advogadoResponsavelId = {
          in: accessibleAdvogados,
        };
      }
    }

    const contratos = await prisma.contrato.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            tipoPessoa: true,
            documento: true,
          },
        },
        tipo: {
          select: {
            nome: true,
          },
        },
        parcelas: {
          select: {
            id: true,
            valor: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Converter Decimal para number e calcular informações de parcelas
    const convertedData = contratos.map((contrato) =>
      convertAllDecimalFields(contrato),
    );
    const contratosComParcelas = convertedData.map((contrato) => {
      const valorTotalContrato = Number(contrato.valor) || 0;
      const parcelasExistentes = contrato.parcelas || [];

      const valorTotalParcelas = parcelasExistentes.reduce(
        (total, parcela) => total + Number(parcela.valor),
        0,
      );

      // Calcular valor já comprometido (pendentes + em andamento)
      const parcelasComprometidas = parcelasExistentes.filter(
        (p) => p.status === "PENDENTE" || p.status === "ATRASADA",
      );

      const valorComprometido = parcelasComprometidas.reduce(
        (total, parcela) => total + Number(parcela.valor),
        0,
      );

      // Valor disponível = valor total - valor comprometido (não pago)
      const valorDisponivel = valorTotalContrato - valorComprometido;
      const parcelasPendentes = parcelasExistentes.filter(
        (p) => p.status === "PENDENTE",
      ).length;

      const parcelasPagas = parcelasExistentes.filter(
        (p) => p.status === "PAGA",
      ).length;

      return {
        ...contrato,
        valor: valorTotalContrato,
        valorTotalParcelas,
        valorComprometido,
        valorDisponivel,
        parcelasPendentes,
        parcelasPagas,
        totalParcelas: parcelasExistentes.length,
      };
    });

    // Serializar para garantir que não há objetos não serializáveis
    const serialized = JSON.parse(JSON.stringify(contratosComParcelas));

    return {
      success: true,
      contratos: serialized,
    };
  } catch (error) {
    logger.error("Erro ao buscar contratos com parcelas:", error);

    return {
      success: false,
      error: "Erro ao buscar contratos",
    };
  }
}
