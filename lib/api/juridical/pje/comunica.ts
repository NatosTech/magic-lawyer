import fs from "fs";
import https from "https";
import tls from "tls";
import fetch, { RequestInit } from "node-fetch";
import { decryptBuffer, decryptToString } from "@/lib/certificate-crypto";
import prisma from "@/lib/prisma";
import { DigitalCertificateScope } from "@/generated/prisma";
import { normalizePkcs12Buffer, parsePkcs12ToPem } from "@/lib/pkcs12-utils";
import logger from "@/lib/logger";

type ComunicaLoginResponse = {
  token: string;
  expiresIn?: number;
};

type ComunicaItem = Record<string, unknown>;

const COMUNICA_BASE_URL =
  process.env.COMUNICA_API_BASE_URL || "https://comunicaapi.pje.jus.br";
const COMUNICA_LOGIN = process.env.COMUNICA_LOGIN;
const COMUNICA_PASSWORD =
  process.env.COMUNICA_PASSWORD || process.env.COMUNICA_SENHA;
const COMUNICA_ALLOW_ANON_TEST =
  process.env.COMUNICA_ALLOW_ANON_TEST === "true" ||
  process.env.COMUNICA_ALLOW_ANON_TEST === "1";
const COMUNICA_TLS_INSECURE =
  process.env.COMUNICA_TLS_INSECURE === "true" ||
  process.env.COMUNICA_TLS_INSECURE === "1";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const AUTH_REQUIRED_STATUSES = new Set([401, 403, 422]);

let cachedExtraCa: string[] | undefined;
let cachedExtraCaLoaded = false;
let warnedInsecure = false;

function normalizeEscapedNewlines(value: string) {
  if (value.includes("\\n") && !value.includes("\n")) {
    return value.replace(/\\n/g, "\n");
  }
  return value;
}

function decodeBase64Payload(payload: string): Buffer | null {
  const normalized = payload.replace(/\s+/g, "");
  if (!normalized) return null;
  if (normalized.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) return null;

  const decoded = Buffer.from(normalized, "base64");
  if (!decoded.length) return null;

  const reencoded = decoded.toString("base64").replace(/=+$/, "");
  const cleaned = normalized.replace(/=+$/, "");

  if (reencoded !== cleaned) return null;

  return decoded;
}

function wrapCertificatePem(base64: string) {
  const normalized = base64.replace(/\s+/g, "");
  const lines = normalized.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

function normalizeCaValue(value: string, label: string) {
  const trimmed = normalizeEscapedNewlines(value).trim();
  if (!trimmed) {
    throw new Error(`${label} esta vazio.`);
  }
  if (trimmed.includes("BEGIN CERTIFICATE")) {
    return trimmed;
  }

  const decoded = decodeBase64Payload(trimmed);
  if (decoded) {
    const decodedText = decoded.toString("utf8").trim();
    if (decodedText.includes("BEGIN CERTIFICATE")) {
      return decodedText;
    }
    return wrapCertificatePem(decoded.toString("base64"));
  }

  throw new Error(`${label} precisa ser PEM ou base64.`);
}

function normalizeCaBuffer(buffer: Buffer) {
  const text = buffer.toString("utf8").trim();
  if (text.includes("BEGIN CERTIFICATE")) {
    return text;
  }

  const decoded = text ? decodeBase64Payload(text) : null;
  if (decoded) {
    const decodedText = decoded.toString("utf8").trim();
    if (decodedText.includes("BEGIN CERTIFICATE")) {
      return decodedText;
    }
    return wrapCertificatePem(decoded.toString("base64"));
  }

  return wrapCertificatePem(buffer.toString("base64"));
}

function getExtraCa(): string[] | undefined {
  if (cachedExtraCaLoaded) {
    return cachedExtraCa;
  }
  cachedExtraCaLoaded = true;

  const extraCa: string[] = [];
  const inline = process.env.COMUNICA_CA_CERT;
  if (inline) {
    extraCa.push(normalizeCaValue(inline, "COMUNICA_CA_CERT"));
  }

  const caPath = process.env.COMUNICA_CA_CERT_PATH;
  if (caPath) {
    const file = fs.readFileSync(caPath);
    extraCa.push(normalizeCaBuffer(file));
  }

  cachedExtraCa = extraCa.length ? extraCa : undefined;
  return cachedExtraCa;
}

function shouldRejectUnauthorized() {
  if (!COMUNICA_TLS_INSECURE) {
    return true;
  }
  if (!warnedInsecure) {
    logger.warn(
      "[Comunica] COMUNICA_TLS_INSECURE ativo; validacao TLS desabilitada.",
    );
    warnedInsecure = true;
  }
  return false;
}

function mergeCa(extraCa?: string[], certificateCa?: string[]) {
  const merged = [
    ...(extraCa ?? []),
    ...(certificateCa ?? []),
  ].filter(Boolean);
  return merged.length ? merged : undefined;
}

function hasComunicaCredentials() {
  return Boolean(COMUNICA_LOGIN && COMUNICA_PASSWORD);
}

function getComunicaCredentials() {
  if (!COMUNICA_LOGIN || !COMUNICA_PASSWORD) {
    throw new Error(
      "Credenciais do Comunica nao configuradas. Defina COMUNICA_LOGIN e COMUNICA_PASSWORD.",
    );
  }
  return {
    login: COMUNICA_LOGIN,
    senha: COMUNICA_PASSWORD,
  };
}

function buildHttpsAgent(pfx: Buffer, passphrase: string) {
  const normalized = normalizePkcs12Buffer(pfx);
  const extraCa = getExtraCa();
  const rejectUnauthorized = shouldRejectUnauthorized();

  try {
    tls.createSecureContext({
      pfx: normalized,
      passphrase,
      ca: extraCa,
    });

    return new https.Agent({
      pfx: normalized,
      passphrase,
      ca: extraCa,
      rejectUnauthorized,
    });
  } catch (error) {
    const parsed = parsePkcs12ToPem(normalized, passphrase);
    const ca = mergeCa(extraCa, parsed.caPem);

    return new https.Agent({
      key: parsed.keyPem,
      cert: parsed.certPem,
      ca,
      rejectUnauthorized,
    });
  }
}

async function getActiveCertificate(tenantId: string) {
  return prisma.digitalCertificate.findFirst({
    where: {
      tenantId,
      tipo: "PJE",
      isActive: true,
      scope: DigitalCertificateScope.OFFICE,
    },
    select: {
      id: true,
      encryptedData: true,
      iv: true,
      encryptedPassword: true,
      passwordIv: true,
    },
  });
}

async function decodeCertificate(cert: {
  encryptedData: Uint8Array | Buffer;
  iv: Uint8Array | Buffer;
  encryptedPassword: Uint8Array | Buffer;
  passwordIv: Uint8Array | Buffer;
}) {
  const pfx = decryptBuffer(
    new Uint8Array(cert.encryptedData),
    new Uint8Array(cert.iv),
  );
  const passphrase = decryptToString(
    new Uint8Array(cert.encryptedPassword),
    new Uint8Array(cert.passwordIv),
  );
  return { pfx, passphrase };
}

async function doFetch(
  url: string,
  init: RequestInit & { agent?: https.Agent },
) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} - ${body}`);
  }
  return response.json();
}

function parseResponseBody(text: string, contentType: string | null) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const looksJson =
    contentType?.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");
  if (looksJson) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch (error) {
      return trimmed;
    }
  }
  return trimmed;
}

async function fetchComunicaWithoutAuth(
  url: string,
  agent: https.Agent,
): Promise<{
  data: unknown;
  status: number;
  authRequired: boolean;
}> {
  const response = await fetch(url, {
    method: "GET",
    agent,
  });
  const bodyText = await response.text();
  const parsedBody = parseResponseBody(
    bodyText,
    response.headers.get("content-type"),
  );

  if (response.ok) {
    return {
      data: parsedBody,
      status: response.status,
      authRequired: false,
    };
  }

  if (AUTH_REQUIRED_STATUSES.has(response.status)) {
    return {
      data: {
        status: "auth_required",
        httpStatus: response.status,
        body: parsedBody,
      },
      status: response.status,
      authRequired: true,
    };
  }

  throw new Error(`HTTP ${response.status} - ${bodyText}`);
}

async function loginComunica(agent: https.Agent): Promise<string> {
  const url = `${COMUNICA_BASE_URL}/api/v1/login`;
  const credentials = getComunicaCredentials();
  const data = await doFetch(url, {
    method: "POST",
    agent,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  const parsed = data as ComunicaLoginResponse;
  if (!parsed?.token) {
    throw new Error("Token não retornado pelo /login");
  }
  return parsed.token;
}

export async function fetchComunica({
  tenantId,
  hash,
}: {
  tenantId: string;
  hash?: string;
}): Promise<{ items: ComunicaItem[]; raw: unknown }> {
  const certificate = await getActiveCertificate(tenantId);
  if (!certificate) {
    throw new Error("Nenhum certificado ativo PJE encontrado para o tenant.");
  }

  const { pfx, passphrase } = await decodeCertificate({
    encryptedData: certificate.encryptedData as unknown as Uint8Array,
    iv: certificate.iv as unknown as Uint8Array,
    encryptedPassword: certificate.encryptedPassword as unknown as Uint8Array,
    passwordIv: certificate.passwordIv as unknown as Uint8Array,
  });
  const agent = buildHttpsAgent(pfx, passphrase);

  const params = new URLSearchParams();
  if (hash) {
    params.set("hash", hash);
  }

  const url = `${COMUNICA_BASE_URL}/api/v1/comunicacao${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const canUseAnonymous = !IS_PRODUCTION || COMUNICA_ALLOW_ANON_TEST;
  let data: unknown;
  let logMessage: string;
  let items: ComunicaItem[] = [];

  if (hasComunicaCredentials()) {
    const token = await loginComunica(agent);
    data = await doFetch(url, {
      method: "GET",
      agent,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    logMessage = `Consulta /comunicacao concluida${
      hash ? ` (hash=${hash})` : ""
    }.`;
    items = Array.isArray(data)
      ? (data as ComunicaItem[])
      : [data as ComunicaItem];
  } else if (canUseAnonymous) {
    const anonResult = await fetchComunicaWithoutAuth(url, agent);
    data = anonResult.data;
    logMessage = anonResult.authRequired
      ? `Conexao mTLS ok; Comunica exigiu login (HTTP ${anonResult.status}).`
      : `Consulta /comunicacao concluida sem login (HTTP ${anonResult.status}).`;
    if (!anonResult.authRequired) {
      items = Array.isArray(data)
        ? (data as ComunicaItem[])
        : [data as ComunicaItem];
    }
  } else {
    throw new Error(
      "Credenciais do Comunica nao configuradas. Defina COMUNICA_LOGIN e COMUNICA_PASSWORD.",
    );
  }

  await prisma.digitalCertificate.update({
    where: { id: certificate.id },
    data: { lastUsedAt: new Date() },
  });

  await prisma.digitalCertificateLog.create({
    data: {
      tenantId,
      digitalCertificateId: certificate.id,
      action: "TESTED",
      message: logMessage,
    },
  });

  return { items, raw: data };
}

export async function testComunicaMtlsConnection({
  pfx,
  passphrase,
}: {
  pfx: Buffer;
  passphrase: string;
}): Promise<{ ok: boolean; message: string }> {
  const agent = buildHttpsAgent(pfx, passphrase);

  const url = `${COMUNICA_BASE_URL}/api/v1/comunicacao`;
  const canUseAnonymous = !IS_PRODUCTION || COMUNICA_ALLOW_ANON_TEST;

  if (hasComunicaCredentials()) {
    await loginComunica(agent);
    return {
      ok: true,
      message:
        "Conexão mTLS ok e login no Comunica validado com as credenciais configuradas.",
    };
  }

  if (!canUseAnonymous) {
    return {
      ok: false,
      message:
        "Conexão mTLS não foi testada: credenciais do Comunica não configuradas. Defina COMUNICA_LOGIN e COMUNICA_PASSWORD.",
    };
  }

  const anonResult = await fetchComunicaWithoutAuth(url, agent);
  if (anonResult.authRequired) {
    return {
      ok: true,
      message: `Conexão mTLS ok; o Comunica exigiu login (HTTP ${anonResult.status}).`,
    };
  }

  return {
    ok: true,
    message: `Conexão mTLS ok; consulta /comunicacao respondeu sem login (HTTP ${anonResult.status}).`,
  };
}
