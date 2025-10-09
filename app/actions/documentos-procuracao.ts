"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/auth";
import { UploadService, DocumentUploadOptions } from "@/lib/upload-service";
import { PrismaClient } from "@/app/generated/prisma";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface DocumentoProcuracaoCreateInput {
  procuracaoId: string;
  fileName: string;
  description?: string;
  tipo:
    | "documento_original"
    | "procuracao_assinada"
    | "comprovante_envio"
    | "certidao_cartorio"
    | "outros";
}

// ============================================
// HELPERS
// ============================================

async function getSession() {
  return await getServerSession(authOptions);
}

// ============================================
// ACTIONS - DOCUMENTOS DE PROCURAÇÃO
// ============================================

/**
 * Upload de documento para uma procuração
 */
export async function uploadDocumentoProcuracao(
  procuracaoId: string,
  formData: FormData,
  options: {
    fileName: string;
    description?: string;
    tipo: DocumentoProcuracaoCreateInput["tipo"];
  },
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Verificar se a procuração existe e pertence ao tenant
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId,
      },
      select: {
        id: true,
        numero: true,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Obter arquivo do FormData
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "Arquivo não fornecido" };
    }

    // Validar tipo de arquivo
    if (file.type !== "application/pdf") {
      return { success: false, error: "Apenas arquivos PDF são permitidos" };
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      return {
        success: false,
        error: "Arquivo muito grande. Máximo permitido: 10MB",
      };
    }

    // Converter arquivo para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Configurar upload
    const uploadService = UploadService.getInstance();

    // Criar identificador descritivo: nome-do-arquivo-id-da-procuracao
    const cleanFileName = options.fileName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\-_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    const uploadOptions: DocumentUploadOptions = {
      tipo: "procuracao",
      identificador: `${cleanFileName}-${procuracao.id}`,
      fileName: options.fileName,
      description: options.description,
    };

    // Fazer upload
    const uploadResult = await uploadService.uploadDocumento(
      buffer,
      user.id,
      file.name,
      user.tenantSlug || "default",
      uploadOptions,
    );

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || "Erro no upload" };
    }

    // Salvar registro no banco de dados
    const documento = await prisma.documentoProcuracao.create({
      data: {
        tenantId,
        procuracaoId: procuracao.id,
        fileName: options.fileName,
        originalName: file.name,
        description: options.description,
        tipo: options.tipo,
        url: uploadResult.url!,
        publicId: uploadResult.publicId!,
        size: file.size,
        mimeType: file.type,
        uploadedBy: user.id,
      },
    });

    // Revalidar cache
    revalidatePath(`/procuracoes/${procuracaoId}`);

    return {
      success: true,
      documento,
      message: "Documento enviado com sucesso",
    };
  } catch (error) {
    logger.error("Erro ao fazer upload do documento:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Listar documentos de uma procuração
 */
export async function getDocumentosProcuracao(procuracaoId: string) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Verificar se a procuração existe e pertence ao tenant
    const procuracao = await prisma.procuracao.findFirst({
      where: {
        id: procuracaoId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!procuracao) {
      return { success: false, error: "Procuração não encontrada" };
    }

    // Buscar documentos
    const documentos = await prisma.documentoProcuracao.findMany({
      where: {
        procuracaoId: procuracao.id,
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      documentos,
    };
  } catch (error) {
    logger.error("Erro ao buscar documentos:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Deletar documento de procuração
 */
export async function deleteDocumentoProcuracao(documentoId: string) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Buscar documento
    const documento = await prisma.documentoProcuracao.findFirst({
      where: {
        id: documentoId,
        tenantId,
      },
      select: {
        id: true,
        url: true,
        publicId: true,
        procuracaoId: true,
        uploadedBy: true,
      },
    });

    if (!documento) {
      return { success: false, error: "Documento não encontrado" };
    }

    // Verificar permissão (apenas quem fez upload ou admin pode deletar)
    if (documento.uploadedBy !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Sem permissão para deletar este documento",
      };
    }

    // Buscar dados completos para auditoria
    const documentoCompleto = await prisma.documentoProcuracao.findUnique({
      where: { id: documentoId },
      include: {
        procuracao: {
          select: { numero: true, cliente: { select: { nome: true } } },
        },
      },
    });

    // Deletar do Cloudinary
    const uploadService = UploadService.getInstance();
    const deleteResult = await uploadService.deleteDocumento(
      documento.url,
      user.id,
    );

    if (!deleteResult.success) {
      logger.warn("Erro ao deletar do Cloudinary:", deleteResult.error);
      // Continuar mesmo se falhar no Cloudinary
    }

    // TODO: Implementar log de auditoria quando modelo estiver disponível
    logger.info(
      `🗑️ Documento deletado: ${documentoCompleto?.fileName} por usuário ${user.id}`,
    );

    // Deletar registro do banco
    await prisma.documentoProcuracao.delete({
      where: {
        id: documentoId,
      },
    });

    // Revalidar cache
    revalidatePath(`/procuracoes/${documento.procuracaoId}`);

    return {
      success: true,
      message: "Documento deletado com sucesso",
    };
  } catch (error) {
    logger.error("Erro ao deletar documento:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Limpeza automática de documentos órfãos no Cloudinary
 * Esta função deve ser executada via cron job
 */
export async function cleanupOrphanedDocuments() {
  try {
    logger.info("🧹 Iniciando limpeza de documentos órfãos...");

    const uploadService = UploadService.getInstance();
    let totalProcessed = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    // Buscar todos os documentos no banco
    const documentos = await prisma.documentoProcuracao.findMany({
      select: {
        id: true,
        url: true,
        publicId: true,
        fileName: true,
        procuracaoId: true,
        tenantId: true,
      },
    });

    logger.info(`📊 Encontrados ${documentos.length} documentos no banco`);

    for (const documento of documentos) {
      try {
        totalProcessed++;

        // Verificar se o arquivo ainda existe no Cloudinary
        const existsResult = await uploadService.checkFileExists(documento.url);

        if (!existsResult.success || !existsResult.exists) {
          logger.info(
            `🗑️  Documento órfão encontrado: ${documento.fileName} (${documento.id})`,
          );

          // Deletar do banco
          await prisma.documentoProcuracao.delete({
            where: { id: documento.id },
          });

          totalDeleted++;
        }

        // Log de progresso a cada 10 documentos
        if (totalProcessed % 10 === 0) {
          logger.info(`⏳ Processados: ${totalProcessed}/${documentos.length}`);
        }
      } catch (error) {
        logger.error(`❌ Erro ao processar documento ${documento.id}:`, error);
        totalErrors++;
      }
    }

    const result = {
      totalProcessed,
      totalDeleted,
      totalErrors,
      success: true,
    };

    logger.info("✅ Limpeza concluída:", result);

    // TODO: Implementar log de auditoria quando modelo estiver disponível
    logger.info(
      `📊 Resumo da limpeza: ${totalProcessed} processados, ${totalDeleted} deletados, ${totalErrors} erros`,
    );

    return result;
  } catch (error) {
    logger.error("❌ Erro na limpeza de documentos órfãos:", error);

    // TODO: Implementar log de auditoria quando modelo estiver disponível
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Atualizar informações do documento
 */
export async function updateDocumentoProcuracao(
  documentoId: string,
  data: {
    fileName?: string;
    description?: string;
    tipo?: DocumentoProcuracaoCreateInput["tipo"];
  },
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Buscar documento
    const documento = await prisma.documentoProcuracao.findFirst({
      where: {
        id: documentoId,
        tenantId,
      },
      select: {
        id: true,
        uploadedBy: true,
        procuracaoId: true,
      },
    });

    if (!documento) {
      return { success: false, error: "Documento não encontrado" };
    }

    // Verificar permissão (apenas quem fez upload ou admin pode editar)
    if (documento.uploadedBy !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Sem permissão para editar este documento",
      };
    }

    // Atualizar documento
    const documentoAtualizado = await prisma.documentoProcuracao.update({
      where: {
        id: documentoId,
      },
      data: {
        ...(data.fileName && { fileName: data.fileName }),
        ...(data.description && { description: data.description }),
        ...(data.tipo && { tipo: data.tipo }),
        updatedAt: new Date(),
      },
    });

    // Revalidar cache
    revalidatePath(`/procuracoes/${documento.procuracaoId}`);

    return {
      success: true,
      documento: documentoAtualizado,
      message: "Documento atualizado com sucesso",
    };
  } catch (error) {
    logger.error("Erro ao atualizar documento:", error);

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
