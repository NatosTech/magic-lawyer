import "dotenv/config";

import { performance } from "node:perf_hooks";

import prisma from "../app/lib/prisma";

type Mode = "smoke" | "load";

type SessionProfile = {
  tenantId: string;
  userId: string;
  tenantVersion: number;
  userVersion: number;
};

type Stats = {
  startedAt: number;
  totalRequests: number;
  successful: number;
  failed: number;
  totalLatenciesMs: number;
  latenciesMs: number[];
  statusCodeCount: Record<number, number>;
  errors: Record<string, number>;
};

type ScriptArgs = {
  baseUrl: string;
  endpoint: string;
  internalToken: string;
  durationMs: number;
  sessionCount: number;
  intervalMs: number;
  maxInflight: number;
  reportEveryMs: number;
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
  const [key, value] = cleanArg.split("=", 2);
  const normalizedKey = key.toLowerCase();

  if (key && value) {
    argValueMap.set(normalizedKey, value);
    continue;
  }

  const next = args[index + 1];
  if (typeof next === "string" && !next.startsWith("--")) {
    argValueMap.set(normalizedKey, next);
    index += 1;
    continue;
  }

  argFlags.add(normalizedKey);
}

function resolveMode(): Mode {
  if (argFlags.has("smoke")) {
    return "smoke";
  }

  if (argFlags.has("load")) {
    return "load";
  }

  const modeEnv = process.env.POLLING_LOAD_MODE?.toLowerCase();
  return modeEnv === "smoke" ? "smoke" : "load";
}

function getNumberArg(name: string, fallback: number): number {
  const normalized = name.toLowerCase();
  const dashed = normalized.replace(/_/g, "-");
  const underscored = normalized.replace(/-/g, "_");
  const raw =
    process.env[name] ??
    process.env[normalized.toUpperCase()] ??
    process.env[underscored.toUpperCase()] ??
    argValueMap.get(dashed) ??
    argValueMap.get(underscored) ??
    argValueMap.get(normalized);

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
}

function parseHelpMode() {
  return argFlags.has("help") || argFlags.has("h");
}

function printHelp() {
  console.log(`
🧪 Polling Load Test (10k Sessões)

Uso:
  npx tsx scripts/load-test-10k-sessoes.ts [--smoke|--load]

Variáveis de ambiente:
  POLLING_LOAD_MODE=smoke|load
  POLLING_LOAD_BASE_URL=http://localhost:9192
  POLLING_LOAD_ENDPOINT=/api/internal/session/validate
  POLLING_LOAD_DURATION_SECONDS=60
  POLLING_LOAD_SESSION_COUNT=10000
  POLLING_LOAD_INTERVAL_MS=30000
  POLLING_LOAD_MAX_INFLIGHT=600
  POLLING_LOAD_REPORT_EVERY_MS=5000
  REALTIME_INTERNAL_TOKEN=<token interno>

Exemplos:
  POLLING_LOAD_MODE=smoke POLLING_LOAD_SESSION_COUNT=240 POLLING_LOAD_DURATION_SECONDS=20 npx tsx scripts/load-test-10k-sessoes.ts --smoke
  POLLING_LOAD_MODE=load  POLLING_LOAD_SESSION_COUNT=10000 POLLING_LOAD_DURATION_SECONDS=60 npx tsx scripts/load-test-10k-sessoes.ts --load
`);
}

function percentile(values: number[], percent: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percent / 100) * sorted.length) - 1,
  );
  return sorted[index] ?? 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchActiveProfiles(): Promise<SessionProfile[]> {
  const rawProfiles = await prisma.usuario.findMany({
    where: {
      active: true,
      tenant: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      sessionVersion: true,
      tenantId: true,
      tenant: {
        select: {
          sessionVersion: true,
        },
      },
    },
    take: 500,
  });

  return rawProfiles
    .filter((profile) => Boolean(profile.tenantId) && profile.tenant !== null)
    .map((profile) => ({
      tenantId: profile.tenantId,
      userId: profile.id,
      tenantVersion: profile.tenant.sessionVersion,
      userVersion: profile.sessionVersion ?? 0,
    }));
}

function createStats(): Stats {
  return {
    startedAt: performance.now(),
    totalRequests: 0,
    successful: 0,
    failed: 0,
    totalLatenciesMs: 0,
    latenciesMs: [],
    statusCodeCount: {},
    errors: {},
  };
}

function recordStats(
  stats: Stats,
  isSuccess: boolean,
  latencyMs: number,
  status: number,
) {
  stats.totalRequests += 1;
  stats.totalLatenciesMs += latencyMs;
  stats.latenciesMs.push(latencyMs);
  stats.statusCodeCount[status] = (stats.statusCodeCount[status] ?? 0) + 1;

  if (isSuccess) {
    stats.successful += 1;
  } else {
    stats.failed += 1;
  }
}

function registerError(stats: Stats, reason: string) {
  stats.errors[reason] = (stats.errors[reason] ?? 0) + 1;
}

async function runLoadTest(config: ScriptArgs) {
  const { baseUrl, endpoint, internalToken, durationMs, sessionCount, intervalMs, maxInflight, reportEveryMs } =
    config;

  const profiles = await fetchActiveProfiles();
  if (profiles.length === 0) {
    console.error(
      "❌ Não há usuários ativos com tenant ativo para simular sessões.",
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const sessions = Array.from({ length: sessionCount }, (_, index) => {
    return {
      profile: profiles[index % profiles.length],
      nextRunAt: Date.now() + Math.random() * intervalMs,
      intervalMs:
        intervalMs +
        Math.floor((Math.random() - 0.5) * (intervalMs * 0.3)),
    };
  });

  const stopAt = Date.now() + durationMs;
  const stats = createStats();
  const semQueue: Array<() => void> = [];
  let inFlight = 0;
  let maxObservedInflight = 0;

  const normalizePayload = (profile: SessionProfile) => ({
    tenantId: profile.tenantId,
    userId: profile.userId,
    tenantVersion: profile.tenantVersion,
    userVersion: profile.userVersion,
  });

  const acquire = async () => {
    if (inFlight < maxInflight) {
      inFlight += 1;
      maxObservedInflight = Math.max(maxObservedInflight, inFlight);
      return;
    }

    await new Promise<void>((resolve) => {
      semQueue.push(resolve);
    });
    inFlight += 1;
    maxObservedInflight = Math.max(maxObservedInflight, inFlight);
  };

  const release = () => {
    inFlight -= 1;
    const next = semQueue.shift();
    if (next) {
      next();
    }
  };

  const invokeValidate = async (profile: SessionProfile) => {
    const startedAt = performance.now();
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": internalToken,
        },
        body: JSON.stringify(normalizePayload(profile)),
      });

      const elapsed = performance.now() - startedAt;
      const isSuccess = response.ok;
      const status = response.status;
      recordStats(stats, isSuccess, elapsed, status);
      if (!isSuccess) {
        registerError(stats, `HTTP_${status}`);
      }
    } catch (error) {
      const elapsed = performance.now() - startedAt;
      registerError(stats, String(error));
      recordStats(stats, false, elapsed, 0);
    }
  };

  const tickReport = async () => {
    const now = performance.now();
    const elapsed = now - stats.startedAt;
    const intervalElapsedSeconds = elapsed / 1000;
    const rps = intervalElapsedSeconds > 0 ? stats.totalRequests / intervalElapsedSeconds : 0;
    const avgLatency =
      stats.totalRequests > 0 ? stats.totalLatenciesMs / stats.totalRequests : 0;

    const p50 = percentile(stats.latenciesMs, 50);
    const p95 = percentile(stats.latenciesMs, 95);
    const p99 = percentile(stats.latenciesMs, 99);

    const errorRate =
      stats.totalRequests > 0 ? (stats.failed / stats.totalRequests) * 100 : 0;

    console.log(`\n⏱️  Resumo parcial`);
    console.log(`   Tempo: ${Math.round(intervalElapsedSeconds)}s`);
    console.log(`   Requests: ${stats.totalRequests}`);
    console.log(`   RPS: ${rps.toFixed(2)} | Sucesso: ${stats.successful} | Falha: ${stats.failed} (${errorRate.toFixed(2)}%)`);
    console.log(`   Latência p50/p95/p99: ${p50.toFixed(1)} / ${p95.toFixed(1)} / ${p99.toFixed(1)} ms`);
  };

  let nextReport = Date.now() + reportEveryMs;

  const sessionWorkers = sessions.map(async (session) => {
    let nextRun = session.nextRunAt;
    let interval = Math.max(200, session.intervalMs);

    while (Date.now() < stopAt) {
      const now = Date.now();
      if (now < nextRun) {
        await sleep(nextRun - now);
      }

      if (Date.now() >= stopAt) {
        break;
      }

      await acquire();
      try {
        await invokeValidate(session.profile);
      } finally {
        release();
      }

      if (Date.now() >= nextReport) {
        await tickReport();
        nextReport = Date.now() + reportEveryMs;
      }

      nextRun += interval;
      interval = Math.max(
        200,
        Math.floor(interval + (Math.random() - 0.5) * interval * 0.2),
      );
    }
  });

  await Promise.all(sessionWorkers);

  const durationSeconds = (performance.now() - stats.startedAt) / 1000;
  const successRate =
    stats.totalRequests > 0 ? (stats.successful / stats.totalRequests) * 100 : 0;
  const avgLatency =
    stats.totalRequests > 0 ? stats.totalLatenciesMs / stats.totalRequests : 0;
  const p50 = percentile(stats.latenciesMs, 50);
  const p95 = percentile(stats.latenciesMs, 95);
  const p99 = percentile(stats.latenciesMs, 99);

  console.log(`\n✅ Teste concluído`);
  console.log(`Tempo total: ${durationSeconds.toFixed(1)}s`);
  console.log(`Requests totais: ${stats.totalRequests}`);
  console.log(
    `Sucesso: ${stats.successful} | Falha: ${stats.failed} (${successRate.toFixed(2)}%)`,
  );
  console.log(`RPS médio: ${stats.totalRequests > 0 ? (stats.totalRequests / durationSeconds).toFixed(2) : "0.00"}`);
  console.log(`Latência média: ${avgLatency.toFixed(2)}ms`);
  console.log(`Latência p50/p95/p99: ${p50.toFixed(1)} / ${p95.toFixed(1)} / ${p99.toFixed(1)} ms`);
  console.log(`Inflight máximo observado: ${maxObservedInflight}`);
  console.log(`Top status:`);
  Object.entries(stats.statusCodeCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`   HTTP ${status}: ${count}`);
    });

  const topErrors = Object.entries(stats.errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (topErrors.length > 0) {
    console.log("Top erros:");
    for (const [reason, count] of topErrors) {
      console.log(`   ${reason}: ${count}`);
    }
  }

  await prisma.$disconnect();
}

async function main() {
  if (parseHelpMode()) {
    printHelp();
    process.exit(0);
  }

  const mode = resolveMode();
  const baseUrl = normalizeBaseUrl(process.env.POLLING_LOAD_BASE_URL ?? "http://localhost:9192");
  const endpoint = process.env.POLLING_LOAD_ENDPOINT ?? "/api/internal/session/validate";
  const internalToken =
    process.env.POLLING_LOAD_INTERNAL_TOKEN ?? process.env.REALTIME_INTERNAL_TOKEN;

  if (!internalToken) {
    console.error(
      "❌ REALTIME_INTERNAL_TOKEN não definido. Configure no .env o token interno para endpoint /api/internal/session/validate.",
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const durationSeconds = getNumberArg(
    "POLLING_LOAD_DURATION_SECONDS",
    mode === "smoke" ? 20 : 60,
  );
  const sessionCount = getNumberArg(
    "POLLING_LOAD_SESSION_COUNT",
    mode === "smoke" ? 150 : 10_000,
  );
  const intervalMs = getNumberArg(
    "POLLING_LOAD_INTERVAL_MS",
    mode === "smoke" ? 700 : 30_000,
  );
  const maxInflight = getNumberArg(
    "POLLING_LOAD_MAX_INFLIGHT",
    mode === "smoke" ? 120 : 800,
  );
  const reportEveryMs = getNumberArg("POLLING_LOAD_REPORT_EVERY_MS", 5_000);

  console.log("🧪 Iniciando polling load test");
  console.log(`Mode: ${mode}`);
  console.log(`Sessões: ${sessionCount}`);
  console.log(`Duração: ${durationSeconds}s`);
  console.log(`Intervalo por sessão: ${intervalMs}ms`);
  console.log(`Endpoint: ${baseUrl}${endpoint}`);

  const config: ScriptArgs = {
    baseUrl,
    endpoint,
    internalToken,
    durationMs: durationSeconds * 1000,
    sessionCount,
    intervalMs,
    maxInflight,
    reportEveryMs,
  };

  await runLoadTest(config);
}

main().catch(async (error) => {
  console.error("❌ Falha no load test:", error);
  await prisma.$disconnect();
  process.exit(1);
});
