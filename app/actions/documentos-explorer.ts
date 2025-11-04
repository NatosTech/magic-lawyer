"use server";

import type {
  Prisma,
  Documento,
  DocumentoVersao,
} from "@/app/generated/prisma";

import { revalidatePath } from "next/cache";

import { getSession } from "@/app/lib/auth";
import { HybridNotificationService } from "@/app/lib/notifications/hybrid-notification-service";
import prisma from "@/app/lib/prisma";
import { UploadService, CloudinaryFolderNode } from "@/lib/upload-service";
import logger from "@/lib/logger";
import { DocumentNotifier } from "@/app/lib/notifications/document-notifier";

export interface DocumentExplorerFile {
  id: string;
  documentoId: string;
  versaoId?: string;
  nome: string;
  fileName: string;
  url: string;
  contentType: string | null;
  tamanhoBytes: number | null;
  uploadedAt: string;
  uploadedBy?: {
    id: string | null;
    nome: string | null;
    email?: string | null;
  };
  visivelParaCliente: boolean;
  cloudinaryPublicId?: string | null;
  folderSegments: string[];
  folderPath: string;
  versionNumber?: number;
  metadata?: Record<string, any> | null;
}

export interface DocumentExplorerProcess {
  id: string;
  numero: string;
  titulo: string | null;
  status: string;
  fase: string | null;
  createdAt: string;
  updatedAt: string;
  documentos: DocumentExplorerFile[];
  folderTree: CloudinaryFolderNode | null;
  causas: Array<{
    id: string;
    nome: string;
    principal: boolean;
  }>;
  counts: {
    documentos: number;
    arquivos: number;
  };
}

export interface DocumentExplorerContrato {
  id: string;
  titulo: string;
  status: string;
  processoId?: string | null;
}

export interface DocumentExplorerCatalogoCausa {
  id: string;
  nome: string;
  codigoCnj?: string | null;
}

export interface DocumentExplorerCatalogoRegime {
  id: string;
  nome: string;
  tipo: string;
  contarDiasUteis: boolean;
}

export interface DocumentExplorerCliente {
  id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  createdAt: string;
  processos: DocumentExplorerProcess[];
  documentosGerais: DocumentExplorerFile[];
  documentosGeraisTree: CloudinaryFolderNode | null;
  contratos: DocumentExplorerContrato[];
  counts: {
    processos: number;
    documentos: number;
    arquivos: number;
  };
}

export interface DocumentExplorerData {
  tenantId: string;
  tenantSlug: string;
  generatedAt: string;
  clientes: DocumentExplorerCliente[];
  catalogos: {
    causas: DocumentExplorerCatalogoCausa[];
    regimesPrazo: DocumentExplorerCatalogoRegime[];
  };
  totals: {
    clientes: number;
    processos: number;
    documentos: number;
    arquivos: number;
  };
}

interface SessionUser {
  id: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
}

interface CreateFolderInput {
  clienteId: string;
  processoId: string;
  parentSegments: string[];
  nomePasta: string;
}

interface RenameFolderInput {
  clienteId: string;
  processoId: string;
  currentSegments: string[];
  novoNome: string;
}

interface DeleteFolderInput {
  clienteId: string;
  processoId: string;
  targetSegments: string[];
}

interface DeleteFileInput {
  documentoId: string;
  versaoId?: string;
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function getFileNameFromUrl(url: string): string {
  try {
    const base = url.split("/").pop() || "";

    return decodeURIComponent(base.split("?")[0]);
  } catch {
    return url;
  }
}

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === "upload");

    if (uploadIndex === -1) return null;

    const publicIdSegments = segments.slice(uploadIndex + 2); // skip version

    if (!publicIdSegments.length) return null;

    const last = publicIdSegments[publicIdSegments.length - 1];
    const withoutExtension = last.split(".")[0];

    publicIdSegments[publicIdSegments.length - 1] = withoutExtension;

    return publicIdSegments.join("/");
  } catch (error) {
    logger.warn("Não foi possível extrair public_id da URL", { url, error });

    return null;
  }
}

function normalizeFolderSegments(
  tenantSlug: string,
  publicId: string | null | undefined,
): string[] {
  if (!publicId) return [];

  const segments = publicId.split("/");

  if (segments[0] === "magiclawyer") {
    segments.shift();
  }

  if (segments[0] === tenantSlug) {
    segments.shift();
  }

  // Remover nome de arquivo
  segments.pop();

  return segments;
}

async function getAdvogadoIdFromSession(session: { user: any } | null) {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const advogado = await prisma.advogado.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: { id: true },
  });

  return advogado?.id || null;
}

async function getClienteIdFromSession(session: { user: any } | null) {
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const cliente = await prisma.cliente.findFirst({
    where: {
      usuarioId: session.user.id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return cliente?.id || null;
}

function buildProcessFolderBase(
  tenantSlug: string,
  cliente: { id: string; nome: string },
  processo: { id: string; numero: string },
) {
  const clienteSegment = `${sanitizeSegment(cliente.nome)}-${cliente.id}`;
  const processoSegment = `${sanitizeSegment(processo.numero)}-${processo.id}`;

  return `magiclawyer/${tenantSlug}/clientes/${clienteSegment}/processos/${processoSegment}`;
}

function buildClienteDocumentFolder(
  tenantSlug: string,
  cliente: { id: string; nome: string },
) {
  const clienteSegment = `${sanitizeSegment(cliente.nome)}-${cliente.id}`;

  return `magiclawyer/${tenantSlug}/clientes/${clienteSegment}/documentos`;
}

function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const { hostname } = new URL(url);

    return (
      hostname.includes("cloudinary.com") ||
      hostname.includes("res.cloudinary.com")
    );
  } catch {
    return false;
  }
}

function mapDocumentoToFiles(
  documento: Documento & {
    versoes: DocumentoVersao[];
    uploadedBy?: {
      id: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
  },
  tenantSlug: string,
): DocumentExplorerFile[] {
  const versions =
    documento.versoes && documento.versoes.length > 0
      ? documento.versoes
      : [null];

  return versions.map((versao) => {
    const publicId =
      versao?.cloudinaryPublicId ||
      (documento.metadados as any)?.cloudinaryPublicId ||
      (isCloudinaryUrl(versao?.url || documento.url)
        ? extractPublicIdFromUrl(versao?.url || documento.url)
        : null);

    const folderSegments = normalizeFolderSegments(
      tenantSlug,
      publicId || undefined,
    );
    const fileUrl = versao?.url || documento.url;
    const fileName = versao
      ? getFileNameFromUrl(versao.url)
      : getFileNameFromUrl(documento.url);

    const nomeArquivo =
      versao?.numeroVersao && versao.numeroVersao > 1
        ? `${documento.nome} (v${versao.numeroVersao})`
        : documento.nome;

    return {
      id: versao?.id ?? documento.id,
      documentoId: documento.id,
      versaoId: versao?.id,
      nome: nomeArquivo,
      fileName,
      url: fileUrl,
      contentType: documento.contentType || null,
      tamanhoBytes: documento.tamanhoBytes ?? null,
      uploadedAt: (versao?.createdAt || documento.createdAt).toISOString(),
      uploadedBy: documento.uploadedBy
        ? {
            id: documento.uploadedBy.id,
            nome:
              [documento.uploadedBy.firstName, documento.uploadedBy.lastName]
                .filter(Boolean)
                .join(" ") || null,
            email: documento.uploadedBy.email,
          }
        : undefined,
      visivelParaCliente: documento.visivelParaCliente,
      cloudinaryPublicId: publicId,
      folderSegments,
      folderPath: folderSegments.join("/"),
      versionNumber: versao?.numeroVersao,
      metadata:
        typeof documento.metadados === "object"
          ? (documento.metadados as any)
          : null,
    } satisfies DocumentExplorerFile;
  });
}

export async function getDocumentExplorerData(): Promise<{
  success: boolean;
  data?: DocumentExplorerData;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any as SessionUser;

    if (!user.tenantId || !user.tenantSlug) {
      return { success: false, error: "Tenant não encontrado" };
    }

    let whereCliente: Prisma.ClienteWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
    };

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (user.role === "CLIENTE") {
      const clienteId = await getClienteIdFromSession(session);

      if (!clienteId) {
        return { success: false, error: "Cliente não encontrado" };
      }

      whereCliente = { ...whereCliente, id: clienteId };
    } else if (!isAdmin) {
      // Staff vinculado ou ADVOGADO - usar advogados acessíveis
      const { getAccessibleAdvogadoIds } = await import(
        "@/app/lib/advogado-access"
      );
      const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

      // Se não há vínculos, acesso total (sem filtros)
      if (accessibleAdvogados.length > 0) {
        whereCliente = {
          ...whereCliente,
          advogadoClientes: {
            some: {
              advogadoId: {
                in: accessibleAdvogados,
              },
            },
          },
        };
      }
    }

    const [clientes, causasCatalogo, regimesCatalogo] = await Promise.all([
      prisma.cliente.findMany({
        where: whereCliente,
        include: {
          processos: {
            where: { deletedAt: null },
            include: {
              documentos: {
                where: { deletedAt: null },
                include: {
                  versoes: {
                    orderBy: {
                      numeroVersao: "desc",
                    },
                  },
                  uploadedBy: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
              causasVinculadas: {
                include: {
                  causa: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          documentos: {
            where: {
              deletedAt: null,
              processoId: null,
            },
            include: {
              versoes: {
                orderBy: {
                  numeroVersao: "desc",
                },
              },
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          contratos: {
            where: { deletedAt: null },
            select: {
              id: true,
              titulo: true,
              status: true,
              processoId: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              processos: { where: { deletedAt: null } },
              documentos: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      }),
      prisma.causa.findMany({
        where: {
          tenantId: user.tenantId,
          ativo: true,
        },
        orderBy: {
          nome: "asc",
        },
      }),
      prisma.regimePrazo.findMany({
        where: {
          OR: [{ tenantId: user.tenantId }, { tenantId: null }],
        },
        orderBy: {
          nome: "asc",
        },
      }),
    ]);

    const uploadService = UploadService.getInstance();

    const clientesDto: DocumentExplorerCliente[] = [];

    let totalProcessos = 0;
    let totalDocumentos = 0;
    let totalArquivos = 0;

    for (const cliente of clientes) {
      const processosDto: DocumentExplorerProcess[] = [];
      let clienteArquivos = 0;
      let clienteDocumentos = cliente.documentos.length;

      for (const processo of cliente.processos) {
        const documentosProcesso = processo.documentos.flatMap((documento) =>
          mapDocumentoToFiles(documento as any, user.tenantSlug),
        );

        const baseFolder = buildProcessFolderBase(
          user.tenantSlug,
          { id: cliente.id, nome: cliente.nome },
          { id: processo.id, numero: processo.numero },
        );

        const folderTreeResult =
          await uploadService.buildFolderTree(baseFolder);

        const causasProcesso =
          processo.causasVinculadas?.map((processoCausa: any) => ({
            id: processoCausa.causa.id,
            nome: processoCausa.causa.nome,
            principal: processoCausa.principal,
          })) ?? [];

        processosDto.push({
          id: processo.id,
          numero: processo.numero,
          titulo: processo.titulo,
          status: processo.status,
          fase: processo.fase,
          createdAt: processo.createdAt.toISOString(),
          updatedAt: processo.updatedAt.toISOString(),
          documentos: documentosProcesso,
          folderTree: folderTreeResult.success ? folderTreeResult.tree : null,
          causas: causasProcesso,
          counts: {
            documentos: processo.documentos.length,
            arquivos: documentosProcesso.length,
          },
        });

        totalDocumentos += processo.documentos.length;
        totalArquivos += documentosProcesso.length;
        clienteArquivos += documentosProcesso.length;
        clienteDocumentos += processo.documentos.length;
      }

      totalProcessos += cliente.processos.length;

      const documentosGerais = cliente.documentos.flatMap((documento) =>
        mapDocumentoToFiles(documento as any, user.tenantSlug),
      );

      clienteArquivos += documentosGerais.length;
      totalArquivos += documentosGerais.length;
      totalDocumentos += cliente.documentos.length;

      let documentosGeraisTree: CloudinaryFolderNode | null = null;
      const baseFolderCliente = buildClienteDocumentFolder(user.tenantSlug, {
        id: cliente.id,
        nome: cliente.nome,
      });
      const treeResult = await uploadService.buildFolderTree(baseFolderCliente);

      if (treeResult.success) {
        documentosGeraisTree = treeResult.tree;
      }

      clientesDto.push({
        id: cliente.id,
        nome: cliente.nome,
        documento: cliente.documento,
        email: cliente.email,
        telefone: cliente.telefone,
        createdAt: cliente.createdAt.toISOString(),
        processos: processosDto,
        documentosGerais,
        documentosGeraisTree,
        contratos: cliente.contratos.map((contrato: any) => ({
          id: contrato.id,
          titulo: contrato.titulo,
          status: contrato.status,
          processoId: contrato.processoId,
        })),
        counts: {
          processos: cliente.processos.length,
          documentos: clienteDocumentos,
          arquivos: clienteArquivos,
        },
      });
    }

    const data: DocumentExplorerData = {
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      generatedAt: new Date().toISOString(),
      clientes: clientesDto,
      catalogos: {
        causas: causasCatalogo.map((causa) => ({
          id: causa.id,
          nome: causa.nome,
          codigoCnj: causa.codigoCnj ?? undefined,
        })),
        regimesPrazo: regimesCatalogo.map((regime) => ({
          id: regime.id,
          nome: regime.nome,
          tipo: regime.tipo,
          contarDiasUteis: regime.contarDiasUteis,
        })),
      },
      totals: {
        clientes: clientesDto.length,
        processos: totalProcessos,
        documentos: totalDocumentos,
        arquivos: totalArquivos,
      },
    };

    return { success: true, data };
  } catch (error) {
    logger.error("Erro ao carregar dados do explorador de documentos:", error);

    return {
      success: false,
      error: "Erro ao carregar documentos",
    };
  }
}

export async function uploadDocumentoExplorer(
  clienteId: string,
  processoId: string | null,
  formData: FormData,
  options: {
    folderSegments?: string[];
    description?: string;
    visivelParaCliente?: boolean;
  } = {},
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const rawSessionUser = session.user as any;
    const user = rawSessionUser as SessionUser;
    const uploaderDisplayName =
      `${rawSessionUser.firstName ?? ""} ${
        rawSessionUser.lastName ?? ""
      }`.trim() ||
      rawSessionUser.email ||
      rawSessionUser.id;

    if (!user.tenantId || !user.tenantSlug) {
      return { success: false, error: "Tenant não encontrado" };
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { success: false, error: "Arquivo não recebido" };
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, nome: true },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const processoIdsRaw = formData
      .getAll("processoIds")
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );

    if (processoId) {
      processoIdsRaw.push(processoId);
    }

    const processoIds = Array.from(new Set(processoIdsRaw));

    const processos = processoIds.length
      ? await prisma.processo.findMany({
          where: {
            id: { in: processoIds },
            tenantId: user.tenantId,
            clienteId,
            deletedAt: null,
          },
          select: {
            id: true,
            numero: true,
          },
        })
      : [];

    if (processoIds.length && processos.length !== processoIds.length) {
      return { success: false, error: "Processo selecionado inválido" };
    }

    const contratoIdsRaw = formData
      .getAll("contratoIds")
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );

    const contratos = contratoIdsRaw.length
      ? await prisma.contrato.findMany({
          where: {
            id: { in: contratoIdsRaw },
            tenantId: user.tenantId,
            clienteId,
            deletedAt: null,
          },
          select: {
            id: true,
            titulo: true,
            processoId: true,
          },
        })
      : [];

    if (contratoIdsRaw.length && contratos.length !== contratoIdsRaw.length) {
      return { success: false, error: "Contrato selecionado inválido" };
    }

    const causaId = (formData.get("causaId") as string | null) || null;
    const causa = causaId
      ? await prisma.causa.findFirst({
          where: {
            id: causaId,
            tenantId: user.tenantId,
            ativo: true,
          },
          select: { id: true },
        })
      : null;

    if (causaId && !causa) {
      return { success: false, error: "Causa selecionada inválida" };
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadService = UploadService.getInstance();

    const uploadResult = await uploadService.uploadStructuredDocument(
      bytes,
      user.id,
      file.name,
      {
        tenantSlug: user.tenantSlug,
        categoria: "processo",
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
        },
        processo: processos[0]
          ? {
              id: processos[0].id,
              numero: processos[0].numero,
            }
          : undefined,
        subpastas: options.folderSegments,
        fileName: file.name,
        contentType: file.type,
        resourceType: file.type.startsWith("image/") ? "image" : "raw",
        tags: [
          "processo",
          ...(processos.length ? processos.map((proc) => proc.id) : []),
          cliente.id,
        ],
      },
    );

    if (!uploadResult.success || !uploadResult.publicId || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || "Erro ao fazer upload",
      };
    }

    const uploadedUrl = uploadResult.url;
    const uploadedPublicId = uploadResult.publicId;
    const uploadedFolderPath = uploadResult.folderPath;

    const primaryProcessoId = processos[0]?.id ?? null;
    const primaryContratoId = contratos[0]?.id ?? null;

    const isVisibleToClient =
      typeof options.visivelParaCliente === "boolean"
        ? options.visivelParaCliente
        : true;

    const documento = await prisma.$transaction(async (tx) => {
      const createdDocumento = await tx.documento.create({
        data: {
          tenantId: user.tenantId,
          nome: file.name,
          tipo: "processo",
          descricao: options.description,
          url: uploadedUrl,
          tamanhoBytes: file.size,
          contentType: file.type,
          processoId: primaryProcessoId,
          clienteId: cliente.id,
          contratoId: primaryContratoId,
          uploadedById: user.id,
          visivelParaCliente: isVisibleToClient,
          visivelParaEquipe: true,
          metadados: {
            folderPath: uploadedFolderPath,
            subpastas: options.folderSegments || [],
            originalFileName: file.name,
            processos: processos.map((proc) => proc.id),
            contratos: contratos.map((contrato) => contrato.id),
            causaId: causa?.id ?? null,
          },
        },
      });

      await tx.documentoVersao.create({
        data: {
          tenantId: user.tenantId,
          documentoId: createdDocumento.id,
          numeroVersao: 1,
          cloudinaryPublicId: uploadedPublicId,
          url: uploadedUrl,
          uploadedById: user.id,
        },
      });

      if (processos.length) {
        await tx.processoDocumento.createMany({
          data: processos.map((proc) => ({
            tenantId: user.tenantId,
            processoId: proc.id,
            documentoId: createdDocumento.id,
            createdById: user.id,
            visivelParaCliente: isVisibleToClient,
          })),
          skipDuplicates: true,
        });
      }

      if (contratos.length) {
        await tx.contratoDocumento.createMany({
          data: contratos.map((contrato) => ({
            tenantId: user.tenantId,
            contratoId: contrato.id,
            documentoId: createdDocumento.id,
            processoId: primaryProcessoId ?? contrato.processoId ?? null,
            causaId: causa?.id ?? null,
          })),
          skipDuplicates: true,
        });
      }

      if (causa?.id && primaryProcessoId) {
        await tx.processoCausa.upsert({
          where: {
            processoId_causaId: {
              processoId: primaryProcessoId,
              causaId: causa.id,
            },
          },
          update: {},
          create: {
            tenantId: user.tenantId,
            processoId: primaryProcessoId,
            causaId: causa.id,
            principal: false,
          },
        });
      }

      return createdDocumento;
    });

    revalidatePath("/documentos");

    // Notificações: documento anexado em processo(s)
    try {
      if (processos.length) {
        const responsaveis = await prisma.processo.findMany({
          where: {
            id: { in: processos.map((p) => p.id) },
            tenantId: user.tenantId,
          },
          select: {
            id: true,
            numero: true,
            advogadoResponsavel: {
              select: { usuario: { select: { id: true } } },
            },
          },
        });

        for (const proc of responsaveis) {
          const targetUserId =
            (proc.advogadoResponsavel?.usuario as any)?.id ||
            (user.id as string);

          await HybridNotificationService.publishNotification({
            type: "processo.document_uploaded",
            tenantId: user.tenantId,
            userId: targetUserId,
            payload: {
              documentoId: documento.id,
              processoId: proc.id,
              numero: proc.numero,
              documentName: file.name,
              referenciaTipo: "documento",
              referenciaId: documento.id,
            },
            urgency: "MEDIUM",
            channels: ["REALTIME"],
          });
        }
      }
    } catch (e) {
      logger.warn("Falha ao emitir notificação de documento anexado", e);
    }

    try {
      await DocumentNotifier.notifyUploaded({
        tenantId: user.tenantId,
        documentoId: documento.id,
        nome: documento.nome,
        tipo: documento.tipo,
        tamanhoBytes: documento.tamanhoBytes,
        uploaderUserId: user.id,
        uploaderNome: uploaderDisplayName,
        processoIds: processos.map((proc) => proc.id),
        clienteId: cliente.id,
        visivelParaCliente: isVisibleToClient,
      });
    } catch (error) {
      logger.warn("Falha ao emitir notificações de documento.uploaded", error);
    }

    return {
      success: true,
      documentoId: documento.id,
      url: uploadResult.url,
    };
  } catch (error) {
    logger.error("Erro ao enviar documento pelo explorador:", error);

    return {
      success: false,
      error: "Erro ao enviar documento",
    };
  }
}

export async function createExplorerFolder(input: CreateFolderInput) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any as SessionUser;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: input.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, nome: true },
    });

    const processo = await prisma.processo.findFirst({
      where: {
        id: input.processoId,
        tenantId: user.tenantId,
        clienteId: input.clienteId,
        deletedAt: null,
      },
      select: { id: true, numero: true },
    });

    if (!cliente || !processo) {
      return { success: false, error: "Cliente ou processo não encontrado" };
    }

    const baseFolder = buildProcessFolderBase(
      user.tenantSlug,
      cliente,
      processo,
    );

    const fullPathSegments = [
      baseFolder,
      ...(input.parentSegments || []).map((segment) => segment.trim()),
      sanitizeSegment(input.nomePasta),
    ].filter(Boolean);

    const fullPath = fullPathSegments.join("/");

    const uploadService = UploadService.getInstance();
    const result = await uploadService.createFolder(fullPath);

    if (!result.success) {
      return { success: false, error: result.error || "Erro ao criar pasta" };
    }

    revalidatePath("/documentos");

    return {
      success: true,
      path: fullPath,
    };
  } catch (error) {
    logger.error("Erro ao criar pasta no explorador:", error);

    return {
      success: false,
      error: "Erro ao criar pasta",
    };
  }
}

export async function renameExplorerFolder(input: RenameFolderInput) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any as SessionUser;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: input.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, nome: true },
    });

    const processo = await prisma.processo.findFirst({
      where: {
        id: input.processoId,
        tenantId: user.tenantId,
        clienteId: input.clienteId,
        deletedAt: null,
      },
      select: { id: true, numero: true },
    });

    if (!cliente || !processo) {
      return { success: false, error: "Cliente ou processo não encontrado" };
    }

    const baseFolder = buildProcessFolderBase(
      user.tenantSlug,
      cliente,
      processo,
    );

    if (!input.currentSegments.length) {
      return { success: false, error: "Selecione uma pasta para renomear" };
    }

    const oldPath = [baseFolder, ...input.currentSegments].join("/");
    const newPathSegments = [...input.currentSegments];

    newPathSegments[newPathSegments.length - 1] = sanitizeSegment(
      input.novoNome,
    );
    const newPath = [baseFolder, ...newPathSegments].join("/");

    const uploadService = UploadService.getInstance();
    const renameResult = await uploadService.renameFolder(oldPath, newPath);

    if (!renameResult.success) {
      return {
        success: false,
        error: renameResult.error || "Erro ao renomear pasta",
      };
    }

    // Atualizar registros de documentos que contenham o prefixo antigo
    const publicIdPrefix = `${oldPath}/`;

    const versoesParaAtualizar = await prisma.documentoVersao.findMany({
      where: {
        tenantId: user.tenantId,
        cloudinaryPublicId: {
          startsWith: publicIdPrefix,
        },
      },
    });

    const documentosSemVersao = await prisma.documento.findMany({
      where: {
        tenantId: user.tenantId,
        processoId: processo.id,
        deletedAt: null,
        versoes: {
          none: {},
        },
        metadados: {
          path: ["cloudinaryPublicId"],
          string_starts_with: publicIdPrefix,
        },
      },
    });

    for (const versao of versoesParaAtualizar) {
      const novoPublicId = versao.cloudinaryPublicId.replace(oldPath, newPath);
      const novaUrl = versao.url.replace(oldPath, newPath);

      await prisma.documentoVersao.update({
        where: { id: versao.id },
        data: {
          cloudinaryPublicId: novoPublicId,
          url: novaUrl,
        },
      });
    }

    for (const documento of documentosSemVersao) {
      const metadados = (documento.metadados as Record<string, any>) || {};
      const antigoPublicId = metadados.cloudinaryPublicId as string | undefined;

      if (!antigoPublicId) continue;

      const novoPublicId = antigoPublicId.replace(oldPath, newPath);
      const novaUrl = documento.url.replace(oldPath, newPath);

      await prisma.documento.update({
        where: { id: documento.id },
        data: {
          url: novaUrl,
          metadados: {
            ...metadados,
            cloudinaryPublicId: novoPublicId,
          },
        },
      });
    }

    revalidatePath("/documentos");

    return {
      success: true,
      path: newPath,
    };
  } catch (error) {
    logger.error("Erro ao renomear pasta no explorador:", error);

    return {
      success: false,
      error: "Erro ao renomear pasta",
    };
  }
}

export async function deleteExplorerFolder(input: DeleteFolderInput) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any as SessionUser;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: input.clienteId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: { id: true, nome: true },
    });

    const processo = await prisma.processo.findFirst({
      where: {
        id: input.processoId,
        tenantId: user.tenantId,
        clienteId: input.clienteId,
        deletedAt: null,
      },
      select: { id: true, numero: true },
    });

    if (!cliente || !processo) {
      return { success: false, error: "Cliente ou processo não encontrado" };
    }

    const baseFolder = buildProcessFolderBase(
      user.tenantSlug,
      cliente,
      processo,
    );

    const targetPath = [baseFolder, ...input.targetSegments].join("/");

    const versoesParaDeletar = await prisma.documentoVersao.findMany({
      where: {
        tenantId: user.tenantId,
        cloudinaryPublicId: {
          startsWith: `${targetPath}/`,
        },
      },
      select: {
        id: true,
        documentoId: true,
        cloudinaryPublicId: true,
      },
    });

    const documentosSemVersao = await prisma.documento.findMany({
      where: {
        tenantId: user.tenantId,
        processoId: processo.id,
        deletedAt: null,
        versoes: {
          none: {},
        },
        metadados: {
          path: ["cloudinaryPublicId"],
          string_starts_with: `${targetPath}/`,
        },
      },
      select: {
        id: true,
      },
    });

    const versaoIds = versoesParaDeletar.map((versao) => versao.id);
    const documentoIds = Array.from(
      new Set([
        ...versoesParaDeletar.map((versao) => versao.documentoId),
        ...documentosSemVersao.map((doc) => doc.id),
      ]),
    );

    const uploadService = UploadService.getInstance();

    await uploadService.deleteFolderRecursive(targetPath);

    if (versaoIds.length) {
      await prisma.documentoVersao.deleteMany({
        where: { id: { in: versaoIds } },
      });
    }

    if (documentoIds.length) {
      await prisma.documento.updateMany({
        where: { id: { in: documentoIds } },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    revalidatePath("/documentos");

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Erro ao deletar pasta no explorador:", error);

    return {
      success: false,
      error: "Erro ao deletar pasta",
    };
  }
}

export async function deleteExplorerFile(input: DeleteFileInput) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any as SessionUser;

    const documento = await prisma.documento.findFirst({
      where: {
        id: input.documentoId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        versoes: true,
      },
    });

    if (!documento) {
      return { success: false, error: "Documento não encontrado" };
    }

    const versaoAlvo = input.versaoId
      ? documento.versoes.find((versao) => versao.id === input.versaoId)
      : documento.versoes[0];

    const uploadService = UploadService.getInstance();

    const publicId =
      versaoAlvo?.cloudinaryPublicId ||
      ((documento.metadados as any)?.cloudinaryPublicId as
        | string
        | undefined) ||
      (isCloudinaryUrl(documento.url)
        ? (extractPublicIdFromUrl(documento.url) ?? undefined)
        : undefined);

    if (publicId) {
      const resourceType = documento.contentType?.startsWith("image/")
        ? "image"
        : "raw";

      await uploadService.deleteResources([publicId], resourceType);
    }

    if (versaoAlvo) {
      await prisma.documentoVersao.delete({ where: { id: versaoAlvo.id } });
    }

    const versoesRestantes = await prisma.documentoVersao.findMany({
      where: {
        documentoId: documento.id,
      },
    });

    if (!versoesRestantes.length) {
      await prisma.documento.update({
        where: { id: documento.id },
        data: { deletedAt: new Date() },
      });
    }

    revalidatePath("/documentos");

    return { success: true };
  } catch (error) {
    logger.error("Erro ao deletar arquivo no explorador:", error);

    return {
      success: false,
      error: "Erro ao deletar arquivo",
    };
  }
}
