import useSWR from "swr";

import {
  listarAssinaturas,
  verificarStatusAssinatura,
  verificarPeticaoAssinada,
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
  return useSWR(
    peticaoId ? ["assinaturas", peticaoId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "useAssinaturas",
          endpoint: peticaoId ? `/peticao/${peticaoId}/assinaturas` : "list-assinaturas",
          source: "swr",
        },
        () => (peticaoId ? listarAssinaturas(peticaoId) : null),
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
        () => (assinaturaId ? verificarStatusAssinatura(assinaturaId) : null),
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
  return useSWR(
    peticaoId ? ["peticao-assinada", peticaoId] : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "usePeticaoAssinada",
          endpoint: peticaoId ? `/peticao/${peticaoId}/assinada` : "peticao-assinada",
          source: "swr",
        },
        () => (peticaoId ? verificarPeticaoAssinada(peticaoId) : null),
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}
