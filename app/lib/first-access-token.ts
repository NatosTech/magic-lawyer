import { createHmac, timingSafeEqual } from "crypto";

const FIRST_ACCESS_TOKEN_EXPIRY_HOURS = 24;

interface FirstAccessTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  iat: number;
  exp: number;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getFirstAccessTokenSecret() {
  const secret =
    process.env.FIRST_ACCESS_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret || secret.trim() === "") {
    throw new Error(
      "FIRST_ACCESS_TOKEN_SECRET ou NEXTAUTH_SECRET precisa estar configurado.",
    );
  }

  return secret;
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", getFirstAccessTokenSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export function gerarTokenPrimeiroAcesso(input: {
  userId: string;
  tenantId: string;
  email: string;
  expiresInHours?: number;
}) {
  const now = Date.now();
  const expiresInHours =
    input.expiresInHours && input.expiresInHours > 0
      ? input.expiresInHours
      : FIRST_ACCESS_TOKEN_EXPIRY_HOURS;
  const exp = now + expiresInHours * 60 * 60 * 1000;

  const payload: FirstAccessTokenPayload = {
    userId: input.userId,
    tenantId: input.tenantId,
    email: input.email.toLowerCase(),
    iat: now,
    exp,
  };

  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

export type ValidarTokenPrimeiroAcessoResult =
  | { success: true; payload: FirstAccessTokenPayload }
  | {
      success: false;
      reason: "INVALID_FORMAT" | "INVALID_SIGNATURE" | "EXPIRED" | "MALFORMED";
    };

export function validarTokenPrimeiroAcesso(
  token: string,
): ValidarTokenPrimeiroAcessoResult {
  const [payloadBase64, signature] = token.split(".");

  if (!payloadBase64 || !signature) {
    return { success: false, reason: "INVALID_FORMAT" };
  }

  const expectedSignature = signPayload(payloadBase64);
  const providedBuffer = new Uint8Array(Buffer.from(signature));
  const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature));

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { success: false, reason: "INVALID_SIGNATURE" };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadBase64)) as Partial<
      FirstAccessTokenPayload
    >;

    if (
      !parsed.userId ||
      !parsed.tenantId ||
      !parsed.email ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return { success: false, reason: "MALFORMED" };
    }

    if (Date.now() > parsed.exp) {
      return { success: false, reason: "EXPIRED" };
    }

    return {
      success: true,
      payload: {
        userId: parsed.userId,
        tenantId: parsed.tenantId,
        email: parsed.email,
        iat: parsed.iat,
        exp: parsed.exp,
      },
    };
  } catch {
    return { success: false, reason: "MALFORMED" };
  }
}
