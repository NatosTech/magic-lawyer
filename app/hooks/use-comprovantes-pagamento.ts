"use client";

import useSWR from "swr";
import { 
  getComprovantesParcela, 
  uploadComprovantePagamento,
  deleteComprovantePagamento,
  alterarStatusComprovante,
  type ComprovantePagamento 
} from "@/app/actions/comprovantes-pagamento";

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar comprovantes de pagamento de uma parcela
 */
export function useComprovantesPagamento(parcelaId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    parcelaId ? `comprovantes-pagamento-${parcelaId}` : null,
    async () => {
      if (!parcelaId) return null;
      
      const result = await getComprovantesParcela(parcelaId);
      if (!result.success) throw new Error(result.error || 'Erro ao buscar comprovantes');
      
      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    }
  );

  return {
    comprovantes: data?.comprovantes as ComprovantePagamento[] || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook para gerenciar comprovantes de pagamento
 */
export function useComprovantesActions(parcelaId: string) {
  const { mutate } = useComprovantesPagamento(parcelaId);

  const uploadComprovante = async (file: File) => {
    const result = await uploadComprovantePagamento(parcelaId, file);
    if (result.success) {
      mutate();
    }
    return result;
  };

  const deleteComprovante = async (comprovanteId: string) => {
    const result = await deleteComprovantePagamento(comprovanteId);
    if (result.success) {
      mutate();
    }
    return result;
  };

  const alterarStatus = async (
    comprovanteId: string, 
    status: "pendente" | "aprovado" | "rejeitado"
  ) => {
    const result = await alterarStatusComprovante(comprovanteId, status);
    if (result.success) {
      mutate();
    }
    return result;
  };

  const downloadComprovante = async (comprovanteId: string) => {
    // Implementar download do arquivo
    const comprovantes = await getComprovantesParcela(parcelaId);
    if (comprovantes.success) {
      const comprovante = comprovantes.comprovantes?.find(c => c.id === comprovanteId);
      if (comprovante) {
        window.open(comprovante.url, '_blank');
        return { success: true };
      }
    }
    return { success: false, error: 'Comprovante não encontrado' };
  };

  return {
    uploadComprovante,
    deleteComprovante,
    alterarStatus,
    downloadComprovante,
  };
}
