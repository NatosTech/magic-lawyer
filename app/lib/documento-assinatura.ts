import prisma from "./prisma";
import { emailTemplates } from "./email";
import { emailService } from "@/app/lib/email-service";
import { sendDocumentForSigning, checkDocumentStatus } from "./clicksign";

import logger from "@/lib/logger";

// Interface para criar assinatura de documento
export interface CreateDocumentoAssinaturaData {
  documentoId: string;
  processoId?: string;
  clienteId: string;
  advogadoResponsavelId?: string;
  titulo: string;
  descricao?: string;
  urlDocumento: string;
  dataExpiracao?: Date;
  observacoes?: string;
  criadoPorId: string;
}

// Interface para atualizar assinatura
export interface UpdateDocumentoAssinaturaData
  extends Partial<CreateDocumentoAssinaturaData> {
  id: string;
}

// Função para criar assinatura de documento
export const createDocumentoAssinatura = async (
  data: CreateDocumentoAssinaturaData,
) => {
  try {
    // Verificar se o documento existe
    const documento = await prisma.documento.findUnique({
      where: { id: data.documentoId },
    });

    if (!documento) {
      return { success: false, error: "Documento não encontrado" };
    }

    // Verificar se o cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
    });

    if (!cliente) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const documentoAssinatura = await prisma.documentoAssinatura.create({
      data: {
        tenantId: data.criadoPorId, // Assumindo que o tenantId vem do usuário logado
        documentoId: data.documentoId,
        processoId: data.processoId,
        clienteId: data.clienteId,
        advogadoResponsavelId: data.advogadoResponsavelId,
        titulo: data.titulo,
        descricao: data.descricao,
        urlDocumento: data.urlDocumento,
        dataExpiracao: data.dataExpiracao,
        observacoes: data.observacoes,
        criadoPorId: data.criadoPorId,
      },
      include: {
        documento: true,
        processo: true,
        cliente: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
        criadoPor: true,
      },
    });

    return { success: true, data: documentoAssinatura };
  } catch (error) {
    logger.error("Erro ao criar assinatura de documento:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para enviar documento para assinatura via ClickSign
export const enviarDocumentoParaAssinatura = async (
  documentoAssinaturaId: string,
  fileContent: Buffer,
  filename: string,
) => {
  try {
    const documentoAssinatura = await prisma.documentoAssinatura.findUnique({
      where: { id: documentoAssinaturaId },
      include: {
        cliente: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!documentoAssinatura) {
      return {
        success: false,
        error: "Documento de assinatura não encontrado",
      };
    }

    if (documentoAssinatura.status !== "PENDENTE") {
      return { success: false, error: "Documento já foi processado" };
    }

    // Enviar para ClickSign
    const clicksignResult = await sendDocumentForSigning({
      filename,
      fileContent,
      signer: {
        email: documentoAssinatura.cliente.email || "",
        name: documentoAssinatura.cliente.nome,
        document: documentoAssinatura.cliente.documento || "",
        birthday: "1990-01-01", // Data padrão, deveria ser coletada do cliente
        phone: documentoAssinatura.cliente.telefone || undefined,
      },
      deadlineAt: documentoAssinatura.dataExpiracao ?? undefined,
      message: documentoAssinatura.observacoes ?? undefined,
    });

    if (!clicksignResult.success || !clicksignResult.data) {
      return {
        success: false,
        error:
          clicksignResult.error || "Erro ao enviar documento para ClickSign",
      };
    }

    const { document: clicksignDoc, signer, signingUrl } = clicksignResult.data;

    // Atualizar o documento de assinatura com os dados do ClickSign
    const updatedDocumentoAssinatura = await prisma.documentoAssinatura.update({
      where: { id: documentoAssinaturaId },
      data: {
        status: "PENDENTE",
        clicksignDocumentId: clicksignDoc.key,
        clicksignSignerId: signer.key,
        dataEnvio: new Date(),
      },
      include: {
        documento: true,
        processo: true,
        cliente: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
        criadoPor: true,
      },
    });

    // Enviar email para o cliente com o link de assinatura
    if (documentoAssinatura.cliente.email) {
      try {
        const template = emailTemplates.documentoAssinatura({
          titulo: documentoAssinatura.titulo,
          urlAssinatura: signingUrl,
          dataExpiracao:
            documentoAssinatura.dataExpiracao?.toLocaleDateString("pt-BR"),
          descricao: documentoAssinatura.descricao ?? undefined,
        });

        await emailService.sendEmailPerTenant(documentoAssinatura.tenantId, {
          to: documentoAssinatura.cliente.email,
          subject: template.subject,
          html: template.html,
          credentialType: "DEFAULT",
        });
      } catch (error) {
        logger.error("Erro ao enviar email de assinatura:", error);
        // Não falha o processo se o email falhar
      }
    }

    return {
      success: true,
      data: {
        documentoAssinatura: updatedDocumentoAssinatura,
        signingUrl,
      },
    };
  } catch (error) {
    logger.error("Erro ao enviar documento para assinatura:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para verificar status da assinatura
export const verificarStatusAssinatura = async (
  documentoAssinaturaId: string,
) => {
  try {
    const documentoAssinatura = await prisma.documentoAssinatura.findUnique({
      where: { id: documentoAssinaturaId },
    });

    if (!documentoAssinatura) {
      return {
        success: false,
        error: "Documento de assinatura não encontrado",
      };
    }

    if (!documentoAssinatura.clicksignDocumentId) {
      return {
        success: false,
        error: "Documento não foi enviado para ClickSign",
      };
    }

    // Verificar status no ClickSign
    const statusResult = await checkDocumentStatus(
      documentoAssinatura.clicksignDocumentId,
    );

    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        error: statusResult.error || "Erro ao verificar status no ClickSign",
      };
    }

    const { status, signedAt, downloadUrl } = statusResult.data;

    // Mapear status do ClickSign para nosso enum
    let novoStatus:
      | "PENDENTE"
      | "ASSINADO"
      | "REJEITADO"
      | "EXPIRADO"
      | "CANCELADO";

    switch (status) {
      case "signed":
        novoStatus = "ASSINADO";
        break;
      case "rejected":
        novoStatus = "REJEITADO";
        break;
      case "expired":
        novoStatus = "EXPIRADO";
        break;
      case "cancelled":
        novoStatus = "CANCELADO";
        break;
      default:
        novoStatus = "PENDENTE";
    }

    // Atualizar status no banco se mudou
    if (novoStatus !== documentoAssinatura.status) {
      await prisma.documentoAssinatura.update({
        where: { id: documentoAssinaturaId },
        data: {
          status: novoStatus,
          dataAssinatura: signedAt ? new Date(signedAt) : null,
          urlAssinado: downloadUrl,
        },
      });
    }

    return {
      success: true,
      data: {
        status: novoStatus,
        signedAt,
        downloadUrl,
      },
    };
  } catch (error) {
    logger.error("Erro ao verificar status da assinatura:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para listar assinaturas de documento
export const listDocumentoAssinaturas = async (
  tenantId: string,
  filtros?: {
    processoId?: string;
    clienteId?: string;
    advogadoResponsavelId?: string;
    status?: "PENDENTE" | "ASSINADO" | "REJEITADO" | "EXPIRADO" | "CANCELADO";
  },
) => {
  try {
    const assinaturas = await prisma.documentoAssinatura.findMany({
      where: {
        tenantId,
        ...(filtros?.processoId && { processoId: filtros.processoId }),
        ...(filtros?.clienteId && { clienteId: filtros.clienteId }),
        ...(filtros?.advogadoResponsavelId && {
          advogadoResponsavelId: filtros.advogadoResponsavelId,
        }),
        ...(filtros?.status && { status: filtros.status }),
      },
      include: {
        documento: true,
        processo: true,
        cliente: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
        criadoPor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: assinaturas };
  } catch (error) {
    logger.error("Erro ao listar assinaturas de documento:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para obter assinatura por ID
export const getDocumentoAssinaturaById = async (id: string) => {
  try {
    const assinatura = await prisma.documentoAssinatura.findUnique({
      where: { id },
      include: {
        documento: true,
        processo: true,
        cliente: true,
        advogadoResponsavel: {
          include: {
            usuario: true,
          },
        },
        criadoPor: true,
      },
    });

    if (!assinatura) {
      return {
        success: false,
        error: "Assinatura de documento não encontrada",
      };
    }

    return { success: true, data: assinatura };
  } catch (error) {
    logger.error("Erro ao obter assinatura de documento:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para cancelar assinatura
export const cancelarAssinatura = async (documentoAssinaturaId: string) => {
  try {
    const documentoAssinatura = await prisma.documentoAssinatura.findUnique({
      where: { id: documentoAssinaturaId },
    });

    if (!documentoAssinatura) {
      return {
        success: false,
        error: "Documento de assinatura não encontrado",
      };
    }

    if (documentoAssinatura.status === "ASSINADO") {
      return {
        success: false,
        error: "Não é possível cancelar documento já assinado",
      };
    }

    // Cancelar no ClickSign se existir
    if (documentoAssinatura.clicksignDocumentId) {
      try {
        const { cancelDocument } = await import("./clicksign");

        await cancelDocument(documentoAssinatura.clicksignDocumentId);
      } catch (error) {
        logger.error("Erro ao cancelar documento no ClickSign:", error);
        // Continua com o cancelamento local mesmo se falhar no ClickSign
      }
    }

    // Atualizar status no banco
    const updatedAssinatura = await prisma.documentoAssinatura.update({
      where: { id: documentoAssinaturaId },
      data: {
        status: "CANCELADO",
      },
    });

    return { success: true, data: updatedAssinatura };
  } catch (error) {
    logger.error("Erro ao cancelar assinatura:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para reenviar link de assinatura
export const reenviarLinkAssinatura = async (documentoAssinaturaId: string) => {
  try {
    const documentoAssinatura = await prisma.documentoAssinatura.findUnique({
      where: { id: documentoAssinaturaId },
      include: {
        cliente: true,
      },
    });

    if (!documentoAssinatura) {
      return {
        success: false,
        error: "Documento de assinatura não encontrado",
      };
    }

    if (documentoAssinatura.status !== "PENDENTE") {
      return {
        success: false,
        error: "Apenas documentos pendentes podem ter o link reenviado",
      };
    }

    if (!documentoAssinatura.clicksignSignerId) {
      return {
        success: false,
        error: "Signatário não encontrado no ClickSign",
      };
    }

    // Obter nova URL de assinatura
    const { getSigningUrl } = await import("./clicksign");
    const urlResult = await getSigningUrl(
      documentoAssinatura.clicksignDocumentId!,
      documentoAssinatura.clicksignSignerId,
    );

    if (!urlResult.success || !urlResult.data) {
      return {
        success: false,
        error: urlResult.error || "Erro ao obter URL de assinatura",
      };
    }

    // Enviar email com novo link
    if (documentoAssinatura.cliente.email) {
      try {
        const template = emailTemplates.documentoAssinatura({
          titulo: documentoAssinatura.titulo,
          urlAssinatura: urlResult.data.url,
          dataExpiracao:
            documentoAssinatura.dataExpiracao?.toLocaleDateString("pt-BR"),
          descricao: documentoAssinatura.descricao ?? undefined,
        });

        await emailService.sendEmailPerTenant(documentoAssinatura.tenantId, {
          to: documentoAssinatura.cliente.email,
          subject: `Reenvio: ${template.subject}`,
          html: template.html,
          credentialType: "DEFAULT",
        });
      } catch (error) {
        logger.error("Erro ao reenviar email de assinatura:", error);

        return {
          success: false,
          error: "Erro ao enviar email, mas a URL foi gerada com sucesso",
        };
      }
    }

    return {
      success: true,
      data: {
        signingUrl: urlResult.data.url,
      },
    };
  } catch (error) {
    logger.error("Erro ao reenviar link de assinatura:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
