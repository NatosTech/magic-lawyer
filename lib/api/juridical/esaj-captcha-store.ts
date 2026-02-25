import { getRedisInstance } from "@/app/lib/notifications/redis-singleton";

export type EsajCaptchaChallenge = {
  createdAt: number;
  tribunalSigla: string;
  baseUrl: string;
  cookieHeader: string;
  csrfToken?: string;
  conversationId?: string;
  /** Params de busca (sem captcha) */
  params: Record<string, string>;
};

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildKey(id: string) {
  return `ml:esaj:captcha:${id}`;
}

function parseChallenge(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as EsajCaptchaChallenge;
    if (!parsed?.createdAt || !parsed?.baseUrl || !parsed?.cookieHeader) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createEsajCaptchaChallenge(
  challenge: Omit<EsajCaptchaChallenge, "createdAt">,
) {
  const redis = getRedisInstance();
  const id = randomId();
  const value: EsajCaptchaChallenge = {
    ...challenge,
    createdAt: Date.now(),
  };

  // Expiração padrão de 10 minutos
  await redis.set(buildKey(id), JSON.stringify(value), "EX", 10 * 60);
  return id;
}

export async function getEsajCaptchaChallenge(id: string) {
  const redis = getRedisInstance();
  const raw = await redis.get(buildKey(id));
  return parseChallenge(raw);
}

export async function consumeEsajCaptchaChallenge(id: string) {
  const redis = getRedisInstance();
  const key = buildKey(id);
  const [raw] = await redis
    .multi()
    .get(key)
    .del(key)
    .exec()
    .then((result) => {
      if (!result || result.length === 0) {
        return [null] as Array<string | null>;
      }
      return [result[0]?.[1] as string | null];
    });

  return parseChallenge(raw);
}

export async function cleanupOldEsajCaptchaChallenges(
  _maxAgeMs = 10 * 60 * 1000,
) {
  // Mantido por compatibilidade de chamada.
  // Com Redis + TTL, a limpeza é automática.
}
