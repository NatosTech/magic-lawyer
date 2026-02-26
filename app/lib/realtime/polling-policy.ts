export const REALTIME_POLLING = {
  SESSION_GUARD_FALLBACK_MS: 180 * 1000,
  TENANT_STATUS_FALLBACK_MS: 5 * 60 * 1000,
  TENANT_MODULES_FALLBACK_MS: 5 * 60 * 1000,
  NOTIFICATION_FALLBACK_MS: 2 * 60 * 1000,
  ASSINATURA_STATUS_FALLBACK_MS: 2 * 60 * 1000,
  PAGAMENTO_POLLING_MS: 60 * 1000,
  PORTAL_SYNC_STATUS_POLLING_MS: 10 * 1000,
} as const;

export type PollingProfile = keyof typeof REALTIME_POLLING;

export function resolveFallbackInterval(
  isConnected: boolean,
  enabled: boolean,
  fallbackMs: number,
  minimumMs = 30 * 1000,
): number {
  if (!enabled || isConnected) {
    return 0;
  }

  return Math.max(minimumMs, fallbackMs);
}
