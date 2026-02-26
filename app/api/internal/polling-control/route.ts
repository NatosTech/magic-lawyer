import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import { getRedisInstance } from "@/app/lib/notifications/redis-singleton";

type PollingControlPayload = {
  enabled: boolean;
  source: "env" | "redis" | "default";
  runtimeMs?: number;
  error?: string;
};

const CONTROL_KEY = "magic-lawyer:polling:enabled";
const POLLING_CONTROL_SECRET = process.env.POLLING_CONTROL_SECRET;

function parseBoolean(raw: unknown): boolean | undefined {
  if (raw === null || raw === undefined) {
    return undefined;
  }

  if (typeof raw === "boolean") {
    return raw;
  }

  if (typeof raw === "number") {
    if (raw === 1) {
      return true;
    }

    if (raw === 0) {
      return false;
    }

    return undefined;
  }

  const normalized = String(raw).trim().toLowerCase();

  if (["1", "true", "on", "enabled", "sim", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "off", "disabled", "nao", "não", "no"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function getEnvControl(): { enabled: boolean; source: "env" | "default" } {
  const explicitState = parseBoolean(process.env.NEXT_PUBLIC_POLLING_ENABLED);
  const legacyState = parseBoolean(process.env.NEXT_PUBLIC_POLLING_OFF);

  if (explicitState !== undefined) {
    return { enabled: explicitState, source: "env" };
  }

  if (legacyState !== undefined) {
    return { enabled: !legacyState, source: "env" };
  }

  return { enabled: true, source: "default" };
}

function isAuthorizedForPollingControl(session: any, secretHeader: string | null) {
  const hasHeaderSecret =
    Boolean(POLLING_CONTROL_SECRET) &&
    Boolean(secretHeader) &&
    secretHeader === POLLING_CONTROL_SECRET;

  if (hasHeaderSecret) {
    return true;
  }

  const role = session?.user?.role as string | undefined;
  return role === "SUPER_ADMIN";
}

async function getRedisInstanceSafe() {
  try {
    return getRedisInstance();
  } catch (error) {
    console.error("[polling-control] Falha ao inicializar redis:", error);
    return null;
  }
}

async function getServerControlState(): Promise<
  { enabled: boolean; source: "env" | "redis" | "default" }
> {
  const envState = getEnvControl();
  if (envState.source !== "default") {
    return { enabled: envState.enabled, source: envState.source };
  }

  const redis = await getRedisInstanceSafe();
  if (!redis) {
    return { enabled: true, source: "default" };
  }

  const redisValue = await redis.get(CONTROL_KEY);
  if (redisValue === null) {
    return { enabled: true, source: "default" };
  }

  const parsed = parseBoolean(redisValue);
  if (parsed === undefined) {
    return { enabled: true, source: "default" };
  }

  return { enabled: parsed, source: "redis" };
}

async function setServerControl(enabled: boolean, ttlSeconds?: number | null) {
  const redis = await getRedisInstanceSafe();

  if (!redis) {
    return {
      success: false,
      error: "Redis indisponível. Defina NEXT_PUBLIC_POLLING_ENABLED para fallback imediato.",
    };
  }

  if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
    await redis.set(CONTROL_KEY, enabled ? "1" : "0", "EX", ttlSeconds);
  } else if (typeof ttlSeconds === "number" && ttlSeconds <= 0) {
    await redis.del(CONTROL_KEY);
  } else {
    await redis.set(CONTROL_KEY, enabled ? "1" : "0");
  }

  return { success: true as const };
}

export async function GET() {
  try {
    const { enabled, source } = await getServerControlState();

    const payload: PollingControlPayload = {
      enabled,
      source,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json(
      { enabled: false, source: "default", error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const secretHeader = request.headers.get("x-polling-control-secret");
    const secretAllowed = isAuthorizedForPollingControl(session, secretHeader);

    if (!secretAllowed) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const envControl = getEnvControl();
    if (envControl.source !== "default") {
      return NextResponse.json(
        {
          success: false,
          error: `Controle travado por variável de ambiente (source=${envControl.source}). Ajuste NEXT_PUBLIC_POLLING_ENABLED/NEXT_PUBLIC_POLLING_OFF para liberar controle runtime.`,
        },
        { status: 409 },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Payload inválido" },
        { status: 400 },
      );
    }

    const enabled = parseBoolean(payload.enabled);
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Campo 'enabled' obrigatório (true|false)" },
        { status: 400 },
      );
    }

    const ttl =
      typeof payload.ttlSeconds === "number" && Number.isFinite(payload.ttlSeconds)
        ? Math.max(0, Math.round(payload.ttlSeconds))
        : undefined;

    const applied = await setServerControl(enabled, ttl);
    if (!applied.success) {
      return NextResponse.json(
        { success: false, error: applied.error },
        { status: 503 },
      );
    }

    const current = await getServerControlState();

    return NextResponse.json({
      success: true,
      enabled: current.enabled,
      source: current.source,
      ttlSeconds: ttl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 },
    );
  }
}
