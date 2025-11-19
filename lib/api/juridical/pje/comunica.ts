import https from "https";
import fetch, { RequestInit } from "node-fetch";
import { decryptBuffer, decryptToString } from "@/lib/certificate-crypto";
import prisma from "@/lib/prisma";

type ComunicaLoginResponse = {
  token: string;
  expiresIn?: number;
};

type ComunicaItem = Record<string, unknown>;

const COMUNICA_BASE_URL =
  process.env.COMUNICA_API_BASE_URL || "https://comunicaapi.pje.jus.br";

function buildHttpsAgent(pfx: Buffer, passphrase: string) {
  return new https.Agent({
    pfx,
    passphrase,
    rejectUnauthorized: true,
  });
}

async function getActiveCertificate(tenantId: string) {
  return prisma.digitalCertificate.findFirst({
    where: {
      tenantId,
      tipo: "PJE",
      isActive: true,
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

async function loginComunica(agent: https.Agent): Promise<string> {
  const url = `${COMUNICA_BASE_URL}/api/v1/login`;
  const data = await doFetch(url, {
    method: "POST",
    agent,
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
  const token = await loginComunica(agent);

  const params = new URLSearchParams();
  if (hash) {
    params.set("hash", hash);
  }

  const url = `${COMUNICA_BASE_URL}/api/v1/comunicacao${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const data = await doFetch(url, {
    method: "GET",
    agent,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const items: ComunicaItem[] = Array.isArray(data)
    ? (data as ComunicaItem[])
    : [data as ComunicaItem];

  await prisma.digitalCertificate.update({
    where: { id: certificate.id },
    data: { lastUsedAt: new Date() },
  });

  await prisma.digitalCertificateLog.create({
    data: {
      tenantId,
      digitalCertificateId: certificate.id,
      action: "TESTED",
      message: `Consulta /comunicacao concluída${hash ? ` (hash=${hash})` : ""}.`,
    },
  });

  return { items, raw: data };
}
