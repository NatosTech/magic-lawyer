// @ts-nocheck
import crypto from "crypto";

const DEFAULT_KEY_ENV_VARS = [
  "CERT_ENCRYPTION_KEY",
  "CERT_SECRET_KEY",
  "ENCRYPTION_KEY",
];

const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;

function resolveEncryptionKey(): Buffer {
  const rawKey =
    DEFAULT_KEY_ENV_VARS.map((key) => process.env[key]).find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) ?? "";

  if (!rawKey) {
    throw new Error(
      "Nenhuma chave de criptografia definida. Configure CERT_ENCRYPTION_KEY com 32 bytes (hex/base64).",
    );
  }

  const normalized = rawKey.trim();

  if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length === 64) {
    return Buffer.from(normalized, "hex");
  }

  try {
    const decoded = Buffer.from(normalized, "base64");

    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // ignorar, vamos tentar hash abaixo
  }

  const key = crypto.createHash("sha256").update(normalized).digest();

  if (key.length !== 32) {
    throw new Error(
      "Falha ao derivar chave de 32 bytes. Verifique CERT_ENCRYPTION_KEY.",
    );
  }

  return key;
}

function appendAuthTag(encrypted: Uint8Array, authTag: Uint8Array): Buffer {
  return Buffer.concat([Buffer.from(encrypted), Buffer.from(authTag)]);
}

function splitAuthTag(payload: Buffer): { data: Buffer; authTag: Buffer } {
  if (payload.length <= AUTH_TAG_LENGTH) {
    throw new Error("Payload criptografado inválido: muito pequeno.");
  }

  const authTag = payload.subarray(payload.length - AUTH_TAG_LENGTH);
  const data = payload.subarray(0, payload.length - AUTH_TAG_LENGTH);

  return { data, authTag };
}

export interface EncryptedPayload {
  encrypted: Uint8Array;
  iv: Uint8Array;
}

export function encryptBuffer(buffer: Buffer): EncryptedPayload {
  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer) as Buffer,
    cipher.final() as Buffer,
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: new Uint8Array(appendAuthTag(encrypted, authTag)),
    iv: new Uint8Array(iv),
  };
}

export function decryptBuffer(
  encryptedPayload: Uint8Array,
  iv: Uint8Array,
): Buffer {
  const key = resolveEncryptionKey();
  const { data, authTag } = splitAuthTag(Buffer.from(encryptedPayload));
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key as crypto.CipherKey,
    Buffer.from(iv),
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(data) as Buffer,
    decipher.final() as Buffer,
  ]);
}

export function encryptString(value: string): EncryptedPayload {
  return encryptBuffer(Buffer.from(value, "utf8"));
}

export function decryptToString(
  encryptedPayload: Uint8Array,
  iv: Uint8Array,
): string {
  return decryptBuffer(encryptedPayload, iv).toString("utf8");
}
