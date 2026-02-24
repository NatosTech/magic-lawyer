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

declare global {
  // eslint-disable-next-line no-var
  var __esajCaptchaStore: Map<string, EsajCaptchaChallenge> | undefined;
}

function getStore() {
  if (!globalThis.__esajCaptchaStore) {
    globalThis.__esajCaptchaStore = new Map<string, EsajCaptchaChallenge>();
  }
  return globalThis.__esajCaptchaStore;
}

function randomId() {
  // Suficiente para fluxo de teste (não é token de segurança).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEsajCaptchaChallenge(challenge: Omit<EsajCaptchaChallenge, "createdAt">) {
  const store = getStore();
  const id = randomId();
  store.set(id, { ...challenge, createdAt: Date.now() });
  return id;
}

export function getEsajCaptchaChallenge(id: string) {
  return getStore().get(id) ?? null;
}

export function consumeEsajCaptchaChallenge(id: string) {
  const store = getStore();
  const value = store.get(id) ?? null;
  if (value) store.delete(id);
  return value;
}

export function cleanupOldEsajCaptchaChallenges(maxAgeMs = 10 * 60 * 1000) {
  const store = getStore();
  const now = Date.now();
  for (const [id, challenge] of store.entries()) {
    if (now - challenge.createdAt > maxAgeMs) {
      store.delete(id);
    }
  }
}

