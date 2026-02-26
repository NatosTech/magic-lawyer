import { resolveFallbackInterval } from "./polling-policy";

export type PollingSource =
  | "swr"
  | "interval"
  | "manual"
  | "visibility"
  | "other";

type PollingControlListener = (enabled: boolean) => void;

type PollingControlState = {
  enabled: boolean;
  source: "env" | "localStorage" | "cookie" | "runtime" | "server" | "default";
};

type PollingMetricRow = {
  hookName: string;
  endpoint: string;
  source: PollingSource;
  calls: number;
  success: number;
  errors: number;
  totalDurationMs: number;
  maxDurationMs: number;
  avgDurationMs: number;
  lastAttemptAt: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastError?: string;
  lastStatus?: number;
  lastConfiguredIntervalMs?: number;
};

type PollingTraceOptions = {
  hookName: string;
  endpoint: string;
  source?: PollingSource;
  intervalMs?: number;
};

type ResolvePollingOptions = {
  isConnected: boolean;
  enabled: boolean;
  fallbackMs: number;
  minimumMs?: number;
};

type SetPollingControlOptions = {
  persist?: boolean;
  source?: PollingControlState["source"];
};

const CONTROL_STORAGE_KEY = "__magic-lawyer-polling-enabled";
const CONTROL_COOKIE_KEY = "__magic-lawyer-polling-enabled";
const CONTROL_SERVER_ENDPOINT = "/api/internal/polling-control";
const DEFAULT_INTERVAL_MIN_MS = 30 * 1000;
const DEFAULT_CONTROL_SYNC_INTERVAL_MS = 30 * 1000;

const metricsByKey = new Map<string, PollingMetricRow>();
const controlListeners = new Set<PollingControlListener>();
let pollingEnabledRuntimeOverride: boolean | null = null;
let controlSyncTimer: ReturnType<typeof setInterval> | null = null;
let controlSyncInFlight = false;

function parseBoolean(raw: string | undefined | null): boolean | undefined {
  if (raw === null || raw === undefined) {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();

  if (["1", "true", "on", "enabled", "sim", "yes"].includes(normalized)) {
    return true;
  }

  if (
    ["0", "false", "off", "disabled", "nao", "não", "no"].includes(
      normalized,
    )
  ) {
    return false;
  }

  return undefined;
}

function readCookieValue(key: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const search = `${key}=`;
  const cookies = decodeURIComponent(document.cookie || "");
  const segments = cookies.split(";");

  for (const segment of segments) {
    const [cookieKey, ...cookieValue] = segment.trim().split("=");

    if (cookieKey === key) {
      return cookieValue.join("=");
    }
  }

  return null;
}

function getTimestampMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function buildMetricKey(
  hookName: string,
  endpoint: string,
  source: PollingSource,
) {
  return `${hookName}::${source}::${endpoint}`;
}

function normalizeEndpoint(endpoint: string) {
  const cleaned = endpoint.trim() || "unknown";
  const withoutQuery = cleaned.split("?", 2)[0];
  const segments = withoutQuery.split("/");
  const normalizedSegments = segments.map((segment) => {
    if (!segment) {
      return segment;
    }

    if (segment === "latest") {
      return ":scope";
    }

    if (/^[0-9a-fA-F-]{8,}$/.test(segment)) {
      return ":id";
    }

    if (/^\d+$/.test(segment)) {
      return ":id";
    }

    return segment;
  });

  return normalizedSegments.join("/");
}

function readControlFromEnv(): PollingControlState | null {
  const explicitState = parseBoolean(process.env.NEXT_PUBLIC_POLLING_ENABLED);
  const legacyState = parseBoolean(process.env.NEXT_PUBLIC_POLLING_OFF);
  const hasEnvState =
    explicitState !== undefined || legacyState !== undefined;

  if (!hasEnvState) {
    return null;
  }

  if (explicitState !== undefined) {
    return {
      enabled: explicitState,
      source: "env",
    };
  }

  return {
    enabled: !legacyState,
    source: "env",
  };
}

function readControlFromStorage(): PollingControlState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cookieValue = parseBoolean(readCookieValue(CONTROL_COOKIE_KEY));
  if (cookieValue !== undefined) {
    return {
      enabled: cookieValue,
      source: "cookie",
    };
  }

  const storageValue = parseBoolean(
    window.localStorage.getItem(CONTROL_STORAGE_KEY),
  );
  if (storageValue !== undefined) {
    return {
      enabled: storageValue,
      source: "localStorage",
    };
  }

  return null;
}

function readControlState(): PollingControlState {
  const envState = readControlFromEnv();
  if (envState !== null) {
    return envState;
  }

  if (pollingEnabledRuntimeOverride !== null) {
    return {
      enabled: pollingEnabledRuntimeOverride,
      source: "runtime",
    };
  }

  const localState = readControlFromStorage();
  if (localState !== null) {
    return localState;
  }

  return {
    enabled: true,
    source: "default",
  };
}

function applyPollingRuntimeValue(value: boolean, options: SetPollingControlOptions = {}) {
  pollingEnabledRuntimeOverride = value;

  if (options.persist !== false) {
    persistControl(value);
  }

  notifyControlListeners();
}

function notifyControlListeners() {
  const state = readControlState();
  controlListeners.forEach((listener) => {
    listener(state.enabled);
  });
}

function persistControl(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CONTROL_STORAGE_KEY,
    enabled ? "true" : "false",
  );

  const maxAgeSeconds = 60 * 60 * 24 * 30;
  document.cookie = `${CONTROL_COOKIE_KEY}=${enabled ? "true" : "false"}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearPersistedControl() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CONTROL_STORAGE_KEY);
  document.cookie = `${CONTROL_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function createMetricRow(
  hookName: string,
  endpoint: string,
  source: PollingSource,
): PollingMetricRow {
  const key = buildMetricKey(hookName, endpoint, source);
  const existingRow = metricsByKey.get(key);

  if (existingRow) {
    return existingRow;
  }

  const newRow: PollingMetricRow = {
    hookName,
    endpoint,
    source,
    calls: 0,
    success: 0,
    errors: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    avgDurationMs: 0,
    lastAttemptAt: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
  };

  metricsByKey.set(key, newRow);

  return newRow;
}

function updateRow(row: PollingMetricRow, durationMs: number, success: boolean) {
  row.calls += 1;
  row.totalDurationMs += durationMs;
  row.avgDurationMs = row.totalDurationMs / row.calls;
  row.maxDurationMs = Math.max(row.maxDurationMs, durationMs);
  row.lastAttemptAt = Date.now();

  if (success) {
    row.success += 1;
    row.lastSuccessAt = row.lastAttemptAt;
    row.lastStatus = 200;
  } else {
    row.errors += 1;
    row.lastFailureAt = row.lastAttemptAt;
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parseControlFromServerPayload(payload: unknown): boolean | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("enabled" in payload && typeof (payload as any).enabled === "boolean") {
    return (payload as { enabled: boolean }).enabled;
  }

  return null;
}

export function isPollingGloballyEnabled(): boolean {
  return readControlState().enabled;
}

export function getPollingControlState(): PollingControlState {
  return readControlState();
}

export function setPollingGloballyEnabled(
  enabled: boolean,
  options: SetPollingControlOptions = {},
) {
  const envState = readControlFromEnv();
  if (envState && envState.enabled === false && enabled) {
    console.warn(
      "[polling-telemetry] NEXT_PUBLIC_POLLING_ENABLED (ou LEGACY OFF) inibiu override em runtime",
    );
    return;
  }

  applyPollingRuntimeValue(enabled, options);
}

export function clearPollingOverride() {
  pollingEnabledRuntimeOverride = null;
  clearPersistedControl();
  notifyControlListeners();
}

export async function refreshPollingControlFromServer(): Promise<boolean | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (controlSyncInFlight) {
    return null;
  }

  controlSyncInFlight = true;

  try {
    const response = await fetch(CONTROL_SERVER_ENDPOINT, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const serverEnabled = parseControlFromServerPayload(payload);

    if (typeof serverEnabled !== "boolean") {
      return null;
    }

    applyPollingRuntimeValue(serverEnabled, { persist: false });

    return serverEnabled;
  } catch {
    return null;
  } finally {
    controlSyncInFlight = false;
  }
}

export function startPollingControlSync(
  intervalMs: number = DEFAULT_CONTROL_SYNC_INTERVAL_MS,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (controlSyncTimer) {
    return;
  }

  void refreshPollingControlFromServer();

  controlSyncTimer = setInterval(() => {
    void refreshPollingControlFromServer();
  }, Math.max(1000, intervalMs));
}

export function stopPollingControlSync() {
  if (controlSyncTimer) {
    clearInterval(controlSyncTimer);
    controlSyncTimer = null;
  }
}

export function subscribePollingControl(listener: PollingControlListener) {
  controlListeners.add(listener);
  listener(isPollingGloballyEnabled());

  return () => {
    controlListeners.delete(listener);
  };
}

export function resolvePollingInterval({
  isConnected,
  enabled,
  fallbackMs,
  minimumMs = DEFAULT_INTERVAL_MIN_MS,
}: ResolvePollingOptions): number {
  if (!isPollingGloballyEnabled()) {
    return 0;
  }

  return resolveFallbackInterval(isConnected, enabled, fallbackMs, minimumMs);
}

export async function tracePollingAttempt<T>(
  {
    hookName,
    endpoint,
    source = "other",
    intervalMs,
  }: PollingTraceOptions,
  action: () => Promise<T>,
): Promise<T> {
  const row = createMetricRow(
    hookName,
    normalizeEndpoint(endpoint),
    source,
  );

  row.lastConfiguredIntervalMs = intervalMs;
  const started = getTimestampMs();

  try {
    const result = await action();
    const durationMs = getTimestampMs() - started;
    updateRow(row, durationMs, true);

    return result;
  } catch (error) {
    const durationMs = getTimestampMs() - started;
    updateRow(row, durationMs, false);
    row.lastError = toErrorMessage(error);

    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[polling-telemetry] Falha ao coletar ${endpoint} (${hookName})`,
        error,
      );
    }

    throw error;
  }
}

export function getPollingMetricsSnapshot() {
  const rows = Array.from(metricsByKey.values());
  const totals = rows.reduce(
    (acc, row) => {
      acc.totalCalls += row.calls;
      acc.totalSuccess += row.success;
      acc.totalErrors += row.errors;
      acc.totalDurationMs += row.totalDurationMs;

      return acc;
    },
    { totalCalls: 0, totalSuccess: 0, totalErrors: 0, totalDurationMs: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    enabled: isPollingGloballyEnabled(),
    controlState: getPollingControlState(),
    totals: {
      calls: totals.totalCalls,
      success: totals.totalSuccess,
      errors: totals.totalErrors,
      successRate:
        totals.totalCalls > 0
          ? (totals.totalSuccess / totals.totalCalls) * 100
          : 0,
      avgDurationMs:
        totals.totalCalls > 0 ? totals.totalDurationMs / totals.totalCalls : 0,
    },
    byHookEndpoint: rows.map((row) => ({
      hookName: row.hookName,
      endpoint: row.endpoint,
      source: row.source,
      calls: row.calls,
      success: row.success,
      errors: row.errors,
      avgDurationMs: row.avgDurationMs,
      maxDurationMs: row.maxDurationMs,
      lastStatus: row.lastStatus,
      lastAttemptAt: row.lastAttemptAt,
      lastSuccessAt: row.lastSuccessAt,
      lastFailureAt: row.lastFailureAt,
      lastError: row.lastError,
      lastConfiguredIntervalMs: row.lastConfiguredIntervalMs,
    })),
  };
}

type PollingTelemetryWindow = Window & {
  __pollingTelemetry?: {
    setEnabled: (value: boolean) => void;
    clearOverride: () => void;
    isEnabled: () => boolean;
    snapshot: () => ReturnType<typeof getPollingMetricsSnapshot>;
    subscribe: (
      listener: PollingControlListener,
    ) => () => void;
    refreshFromServer: () => Promise<boolean | null>;
    startSync: (intervalMs?: number) => void;
    stopSync: () => void;
  };
};

function installPollingTelemetryWindowBridge() {
  const pollingWindow = window as PollingTelemetryWindow;

  pollingWindow.addEventListener("storage", (event) => {
    if (
      event.key === CONTROL_STORAGE_KEY ||
      event.key === CONTROL_COOKIE_KEY
    ) {
      notifyControlListeners();
    }
  });

  pollingWindow.__pollingTelemetry = {
    setEnabled: (value: boolean) =>
      setPollingGloballyEnabled(value, { persist: true }),
    clearOverride: clearPollingOverride,
    isEnabled: isPollingGloballyEnabled,
    snapshot: getPollingMetricsSnapshot,
    subscribe: subscribePollingControl,
    refreshFromServer: refreshPollingControlFromServer,
    startSync: startPollingControlSync,
    stopSync: stopPollingControlSync,
  };
}

if (typeof window !== "undefined") {
  installPollingTelemetryWindowBridge();
}
