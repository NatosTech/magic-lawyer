import useSWR from "swr";
import { listarAssinaturas, verificarStatusAssinatura, verificarPeticaoAssinada, type AssinaturaInfo } from "@/app/actions/assinaturas";

/**
 * Hook para listar assinaturas de uma petição
 */
export function useAssinaturas(peticaoId: string | null) {
  return useSWR(peticaoId ? ["assinaturas", peticaoId] : null, () => (peticaoId ? listarAssinaturas(peticaoId) : null), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}

/**
 * Hook para verificar status de uma assinatura
 */
export function useStatusAssinatura(assinaturaId: string | null) {
  return useSWR(assinaturaId ? ["assinatura-status", assinaturaId] : null, () => (assinaturaId ? verificarStatusAssinatura(assinaturaId) : null), {
    refreshInterval: 5000, // Atualiza a cada 5 segundos
    revalidateOnFocus: true,
  });
}

/**
 * Hook para verificar se uma petição está assinada
 */
export function usePeticaoAssinada(peticaoId: string | null) {
  return useSWR(peticaoId ? ["peticao-assinada", peticaoId] : null, () => (peticaoId ? verificarPeticaoAssinada(peticaoId) : null), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
