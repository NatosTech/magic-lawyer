"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { getDocumentosProcuracao, uploadDocumentoProcuracao, deleteDocumentoProcuracao, updateDocumentoProcuracao, type DocumentoProcuracaoCreateInput } from "@/app/actions/documentos-procuracao";

/**
 * Hook para buscar documentos de uma procuração
 */
export function useDocumentosProcuracao(procuracaoId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    procuracaoId ? `documentos-procuracao-${procuracaoId}` : null,
    async () => {
      if (!procuracaoId) return null;

      const result = await getDocumentosProcuracao(procuracaoId);

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar documentos");
      }

      return result.documentos || [];
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Não fazer refresh automático
      dedupingInterval: 2000, // Cache por 2 segundos
    }
  );

  return {
    documentos: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook para upload de documento
 */
export function useUploadDocumentoProcuracao() {
  const { trigger, isMutating } = useSWRMutation(
    "upload-documento-procuracao",
    async (url: string, { arg }: { arg: { procuracaoId: string; formData: FormData; options: { fileName: string; description?: string; tipo: DocumentoProcuracaoCreateInput["tipo"] } } }) => {
      const result = await uploadDocumentoProcuracao(arg.procuracaoId, arg.formData, arg.options);

      if (!result.success) {
        throw new Error(result.error || "Erro ao fazer upload");
      }

      return result;
    }
  );

  return {
    upload: trigger,
    isUploading: isMutating,
  };
}

/**
 * Hook para deletar documento
 */
export function useDeleteDocumentoProcuracao() {
  const { trigger, isMutating } = useSWRMutation("delete-documento-procuracao", async (url: string, { arg }: { arg: string }) => {
    const result = await deleteDocumentoProcuracao(arg);

    if (!result.success) {
      throw new Error(result.error || "Erro ao deletar documento");
    }

    return result;
  });

  return {
    deleteDocumento: trigger,
    isDeleting: isMutating,
  };
}

/**
 * Hook para atualizar documento
 */
export function useUpdateDocumentoProcuracao() {
  const { trigger, isMutating } = useSWRMutation(
    "update-documento-procuracao",
    async (url: string, { arg }: { arg: { documentoId: string; data: { fileName?: string; description?: string; tipo?: DocumentoProcuracaoCreateInput["tipo"] } } }) => {
      const result = await updateDocumentoProcuracao(arg.documentoId, arg.data);

      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar documento");
      }

      return result;
    }
  );

  return {
    updateDocumento: trigger,
    isUpdating: isMutating,
  };
}

/**
 * Tipos de documentos disponíveis
 */
export const TIPOS_DOCUMENTO = [
  { value: "documento_original", label: "Documento Original", description: "Documento original da procuração" },
  { value: "procuracao_assinada", label: "Procuração Assinada", description: "Procuração com assinaturas" },
  { value: "comprovante_envio", label: "Comprovante de Envio", description: "Comprovante de envio/entrega" },
  { value: "certidao_cartorio", label: "Certidão do Cartório", description: "Certidão do cartório" },
  { value: "outros", label: "Outros", description: "Outros documentos relacionados" },
] as const;

/**
 * Formatar tamanho do arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Obter ícone do tipo de documento
 */
export function getDocumentIcon(tipo: string): string {
  switch (tipo) {
    case "documento_original":
      return "📄";
    case "procuracao_assinada":
      return "✍️";
    case "comprovante_envio":
      return "📮";
    case "certidao_cartorio":
      return "🏛️";
    case "outros":
      return "📎";
    default:
      return "📄";
  }
}
