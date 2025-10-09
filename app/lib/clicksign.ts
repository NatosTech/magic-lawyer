import axios from "axios";

import logger from "@/lib/logger";

// Configuração da API do ClickSign
const CLICKSIGN_API_BASE =
  process.env.CLICKSIGN_API_BASE || "https://sandbox.clicksign.com/api/v1";
const CLICKSIGN_ACCESS_TOKEN = process.env.CLICKSIGN_ACCESS_TOKEN;

// Interface para documento ClickSign
export interface ClickSignDocument {
  key: string;
  filename: string;
  upload_at: string;
  updated_at: string;
  finished_at?: string;
  deadline_at?: string;
  status: "pending" | "signed" | "rejected" | "expired" | "cancelled";
  downloads: {
    signed_file_url?: string;
    original_file_url: string;
  };
  signers: ClickSignSigner[];
}

// Interface para signatário ClickSign
export interface ClickSignSigner {
  key: string;
  email: string;
  auths: string[];
  name: string;
  documentation: string;
  birthday: string;
  has_documentation: boolean;
  selfie_enabled: boolean;
  handwritten_enabled: boolean;
  official_document_enabled: boolean;
  liveness_enabled: boolean;
  facial_biometrics_enabled: boolean;
  status: "pending" | "signed" | "rejected" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
  signed_at?: string;
  rejected_at?: string;
  message?: string;
}

// Interface para criar documento
export interface CreateDocumentRequest {
  document: {
    path: string;
    content_base64: string;
    deadline_at?: string;
    auto_close?: boolean;
    locale?: string;
    sequence_enabled?: boolean;
    remind_interval?: number;
  };
}

// Interface para adicionar signatário
export interface AddSignerRequest {
  signer: {
    email: string;
    phone_number?: string;
    auths: string[];
    name: string;
    documentation: string;
    birthday: string;
    delivery: string;
    message?: string;
  };
}

// Interface para resposta da API
export interface ClickSignApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Função para fazer requisições autenticadas
const makeAuthenticatedRequest = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data?: any,
): Promise<ClickSignApiResponse<T>> => {
  try {
    if (!CLICKSIGN_ACCESS_TOKEN) {
      throw new Error("ClickSign access token não configurado");
    }

    const response = await axios({
      method,
      url: `${CLICKSIGN_API_BASE}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${CLICKSIGN_ACCESS_TOKEN}`,
      },
      data,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Erro na requisição ClickSign:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Função para criar documento no ClickSign
export const createDocument = async (
  filename: string,
  fileContent: Buffer,
  deadlineAt?: Date,
  autoClose: boolean = true,
): Promise<ClickSignApiResponse<ClickSignDocument>> => {
  const contentBase64 = fileContent.toString("base64");

  const requestData: CreateDocumentRequest = {
    document: {
      path: `/${filename}`,
      content_base64: contentBase64,
      auto_close: autoClose,
      locale: "pt-BR",
      sequence_enabled: false,
    },
  };

  if (deadlineAt) {
    requestData.document.deadline_at = deadlineAt.toISOString();
  }

  return makeAuthenticatedRequest<ClickSignDocument>(
    "POST",
    "/documents",
    requestData,
  );
};

// Função para adicionar signatário ao documento
export const addSignerToDocument = async (
  documentKey: string,
  signerData: {
    email: string;
    name: string;
    document: string; // CPF/CNPJ
    birthday: string; // YYYY-MM-DD
    phone?: string;
    message?: string;
  },
): Promise<ClickSignApiResponse<ClickSignSigner>> => {
  const requestData: AddSignerRequest = {
    signer: {
      email: signerData.email,
      phone_number: signerData.phone,
      auths: ["email"], // Autenticação por email
      name: signerData.name,
      documentation: signerData.document,
      birthday: signerData.birthday,
      delivery: "email", // Entrega por email
      message: signerData.message,
    },
  };

  return makeAuthenticatedRequest<ClickSignSigner>(
    "POST",
    `/documents/${documentKey}/signers`,
    requestData,
  );
};

// Função para obter documento
export const getDocument = async (
  documentKey: string,
): Promise<ClickSignApiResponse<ClickSignDocument>> => {
  return makeAuthenticatedRequest<ClickSignDocument>(
    "GET",
    `/documents/${documentKey}`,
  );
};

// Função para obter signatário
export const getSigner = async (
  documentKey: string,
  signerKey: string,
): Promise<ClickSignApiResponse<ClickSignSigner>> => {
  return makeAuthenticatedRequest<ClickSignSigner>(
    "GET",
    `/documents/${documentKey}/signers/${signerKey}`,
  );
};

// Função para cancelar documento
export const cancelDocument = async (
  documentKey: string,
): Promise<ClickSignApiResponse> => {
  return makeAuthenticatedRequest("DELETE", `/documents/${documentKey}`);
};

// Função para listar documentos
export const listDocuments = async (
  page: number = 1,
  perPage: number = 20,
): Promise<ClickSignApiResponse<{ documents: ClickSignDocument[] }>> => {
  return makeAuthenticatedRequest<{ documents: ClickSignDocument[] }>(
    "GET",
    `/documents?page=${page}&per_page=${perPage}`,
  );
};

// Função para obter URL de assinatura
export const getSigningUrl = async (
  documentKey: string,
  signerKey: string,
): Promise<ClickSignApiResponse<{ url: string }>> => {
  return makeAuthenticatedRequest<{ url: string }>(
    "GET",
    `/documents/${documentKey}/signers/${signerKey}/signing_url`,
  );
};

// Função para enviar documento para assinatura
export const sendDocumentForSigning = async (documentData: {
  filename: string;
  fileContent: Buffer;
  signer: {
    email: string;
    name: string;
    document: string;
    birthday: string;
    phone?: string;
  };
  deadlineAt?: Date;
  message?: string;
}): Promise<
  ClickSignApiResponse<{
    document: ClickSignDocument;
    signer: ClickSignSigner;
    signingUrl: string;
  }>
> => {
  try {
    // 1. Criar documento
    const documentResult = await createDocument(
      documentData.filename,
      documentData.fileContent,
      documentData.deadlineAt,
    );

    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: documentResult.error || "Erro ao criar documento",
      };
    }

    const document = documentResult.data;

    // 2. Adicionar signatário
    const signerResult = await addSignerToDocument(document.key, {
      ...documentData.signer,
      message: documentData.message,
    });

    if (!signerResult.success || !signerResult.data) {
      return {
        success: false,
        error: signerResult.error || "Erro ao adicionar signatário",
      };
    }

    const signer = signerResult.data;

    // 3. Obter URL de assinatura
    const urlResult = await getSigningUrl(document.key, signer.key);

    if (!urlResult.success || !urlResult.data) {
      return {
        success: false,
        error: urlResult.error || "Erro ao obter URL de assinatura",
      };
    }

    return {
      success: true,
      data: {
        document,
        signer,
        signingUrl: urlResult.data.url,
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

// Função para verificar status do documento
export const checkDocumentStatus = async (
  documentKey: string,
): Promise<
  ClickSignApiResponse<{
    status: string;
    signedAt?: string;
    downloadUrl?: string;
  }>
> => {
  try {
    const result = await getDocument(documentKey);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Erro ao obter documento",
      };
    }

    const document = result.data;

    return {
      success: true,
      data: {
        status: document.status,
        signedAt: document.finished_at,
        downloadUrl: document.downloads.signed_file_url,
      },
    };
  } catch (error) {
    logger.error("Erro ao verificar status do documento:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
