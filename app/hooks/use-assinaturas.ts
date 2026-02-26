import useSWR from "swr";

import {
  listarAssinaturas,
  verificarStatusAssinatura,
  verificarPeticaoAssinada,
  type ActionResponse,
  type AssinaturaInfo,
} from "@/app/actions/assinaturas";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";
import { useEffect, useState } from "react";

/**
 * Hook para listar assinaturas de uma petição
 */
export function useAssinaturas(peticaoId: string | null) {
  const fetchAssinaturas = async () => {
    if (!peticaoId) {
      return {
        success: false,
        error: "Petição não especificada",
      } satisfies ActionResponse<AssinaturaInfo[]>;
    }

    return listarAssinaturas(peticaoId);
  };

  return useSWR(
    peticaoId ? ["assinaturas", peticaoId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "useAssinaturas",
          endpoint: peticaoId ? `/peticao/${peticaoId}/assinaturas` : "list-assinaturas",
          source: "swr",
        },
        fetchAssinaturas,
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}

/**
 * Hook para verificar status de uma assinatura
 */
export function useStatusAssinatura(assinaturaId: string | null) {
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const fetchStatus = async () => {
    if (!assinaturaId) {
      return {
        success: false,
        error: "Assinatura não especificada",
      };
    }

    return verificarStatusAssinatura(assinaturaId);
  };

  useEffect(() => {
    return subscribePollingControl(setIsPollingEnabled);
  }, []);

  return useSWR(
    assinaturaId ? ["assinatura-status", assinaturaId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "useStatusAssinatura",
          endpoint: assinaturaId
            ? `/assinatura/${assinaturaId}/status`
            : "assinatura-status",
          source: "swr",
        },
        fetchStatus,
      ),
    {
      // Fallback inteligente: só consulta enquanto o status estiver pendente.
      refreshInterval: (latestData) => {
        if (!isPollingEnabled) {
          return 0;
        }

        if (!latestData?.success || !latestData.data) {
          return REALTIME_POLLING.ASSINATURA_STATUS_FALLBACK_MS;
        }

        return latestData.data.status === "PENDENTE"
          ? REALTIME_POLLING.ASSINATURA_STATUS_FALLBACK_MS
          : 0;
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}

/**
 * Hook para verificar se uma petição está assinada
 */
export function usePeticaoAssinada(peticaoId: string | null) {
  const fetchPeticaoAssinada = async () => {
    if (!peticaoId) {
      return {
        success: false,
        error: "Petição não especificada",
      };
    }

    return verificarPeticaoAssinada(peticaoId);
  };

  return useSWR(
    peticaoId ? ["peticao-assinada", peticaoId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "usePeticaoAssinada",
          endpoint: peticaoId ? `/peticao/${peticaoId}/assinada` : "peticao-assinada",
          source: "swr",
        },
        fetchPeticaoAssinada,
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}
