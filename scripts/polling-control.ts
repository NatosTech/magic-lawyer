import "dotenv/config";

type PollingMode = "on" | "off" | "status";

type PollingControlResponse = {
  enabled: boolean;
  source?: "env" | "redis" | "default";
  runtimeMs?: number;
  ttlSeconds?: number;
  error?: string;
  success?: boolean;
};

type PollingControlPostResponse = {
  success: boolean;
  enabled?: boolean;
  source?: string;
  error?: string;
  ttlSeconds?: number;
};

const args = process.argv.slice(2);
const argValueMap = new Map<string, string>();
const argFlags = new Set<string>();

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (!arg.startsWith("--")) {
    continue;
  }

  const cleanArg = arg.slice(2);
  const [keyRaw, valueRaw] = cleanArg.split("=", 2);
  const key = keyRaw.toLowerCase();

  if (valueRaw !== undefined) {
    argValueMap.set(key, valueRaw);
    continue;
  }

  const next = args[index + 1];
  if (typeof next === "string" && !next.startsWith("--")) {
    argValueMap.set(key, next);
    index += 1;
    continue;
  }

  argFlags.add(key);
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function resolveMode(): PollingMode {
  if (argFlags.has("off")) {
    return "off";
  }

  if (argFlags.has("on")) {
    return "on";
  }

  if (argFlags.has("status")) {
    return "status";
  }

  return "status";
}

function getSecret() {
  return (
    argValueMap.get("secret") ??
    process.env.POLLING_CONTROL_SECRET ??
    process.env.NEXT_PUBLIC_POLLING_CONTROL_SECRET ??
    ""
  );
}

function getBaseUrl() {
  return normalizeBaseUrl(
    process.env.POLLING_CONTROL_BASE_URL ??
      process.env.POLLING_LOAD_BASE_URL ??
      "http://localhost:9192",
  );
}

function getNumberArg(name: string, fallback: number) {
  const raw =
    process.env[name] ??
    process.env[name.toUpperCase()] ??
    argValueMap.get(name.toLowerCase()) ??
    argValueMap.get(name.toLowerCase().replace(/_/g, "-"));

  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function parseHelp() {
  if (argFlags.has("help") || argFlags.has("h")) {
    console.log(`
Controle operacional de polling global:

Uso:
  npx tsx scripts/polling-control.ts --status
  npx tsx scripts/polling-control.ts --on [--ttl-seconds 300] [--secret meu-token]
  npx tsx scripts/polling-control.ts --off

Variáveis:
  POLLING_CONTROL_BASE_URL=http://localhost:9192
  POLLING_CONTROL_SECRET=<token>
  --ttl-seconds 300
`);
    process.exit(0);
  }
}

async function callPollingControl() {
  parseHelp();

  const mode = resolveMode();
  const baseUrl = getBaseUrl();
  const secret = getSecret();
  const headers = {
    Accept: "application/json",
    ...(secret ? { "x-polling-control-secret": secret } : {}),
  };
  const endpoint = `${baseUrl}/api/internal/polling-control`;

  if (mode === "status") {
    const response = await fetch(endpoint, {
      headers,
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Falha ao consultar controle: HTTP ${response.status} ${response.statusText}`,
      );
      const text = await response.text();
      if (text) {
        console.error(text);
      }

      process.exit(1);
    }

    const payload = (await response.json()) as PollingControlResponse;
    console.log(
      `Polling global está ${payload.enabled ? "ATIVO" : "DESATIVADO"} (fonte: ${payload.source ?? "desconhecida"})`,
    );
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const enabled = mode === "on";
  const payload = {
    enabled,
    ...(mode === "on"
      ? argValueMap.has("ttl-seconds") || argValueMap.has("ttl_seconds")
        ? { ttlSeconds: getNumberArg("ttl-seconds", 0) }
        : {}
      : {}),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as PollingControlPostResponse;
  if (!response.ok || result.success === false) {
    console.error(
      `Falha ao ${enabled ? "ativar" : "desativar"} polling:`,
      result.error || `HTTP ${response.status}`,
    );
    process.exit(1);
  }

  console.log(`Polling global ${enabled ? "ATIVADO" : "DESATIVADO"}`);
  console.log(JSON.stringify(result, null, 2));
}

void callPollingControl();
