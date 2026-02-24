import forge from "node-forge";

const PKCS12_PEM_HEADER = "-----BEGIN PKCS12-----";
const PKCS12_PEM_FOOTER = "-----END PKCS12-----";

function bufferLooksText(buffer: Buffer) {
  if (buffer.length === 0) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let nonPrintable = 0;

  for (const byte of sample) {
    if (byte === 0) {
      nonPrintable += 1;
      continue;
    }
    if (byte === 0x09 || byte === 0x0a || byte === 0x0d) {
      continue;
    }
    if (byte < 0x20 || byte > 0x7e) {
      nonPrintable += 1;
    }
  }

  return nonPrintable / sample.length < 0.08;
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

export function normalizePkcs12Buffer(input: Buffer): Buffer {
  if (!bufferLooksText(input)) {
    return input;
  }

  const text = input.toString("utf8");
  const headerIndex = text.indexOf(PKCS12_PEM_HEADER);

  if (headerIndex >= 0) {
    const footerIndex = text.indexOf(PKCS12_PEM_FOOTER, headerIndex);
    if (footerIndex > headerIndex) {
      const body = text.slice(headerIndex + PKCS12_PEM_HEADER.length, footerIndex);
      const decoded = decodeBase64Payload(body);
      if (decoded) {
        return decoded;
      }
    }
  }

  const decoded = decodeBase64Payload(text);
  if (decoded) {
    return decoded;
  }

  return input;
}

export function parsePkcs12ToPem(buffer: Buffer, passphrase: string) {
  const normalized = normalizePkcs12Buffer(buffer);
  const binary = forge.util.createBuffer(normalized.toString("binary"), "raw");
  const asn1 = forge.asn1.fromDer(binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, passphrase);

  const keyBags = p12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  })[forge.pki.oids.pkcs8ShroudedKeyBag];
  const legacyKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
  const keyBag = keyBags?.[0] ?? legacyKeyBags?.[0];

  if (!keyBag?.key) {
    throw new Error("Chave privada nao encontrada no certificado.");
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];

  if (!certBags || certBags.length === 0) {
    throw new Error("Certificado nao encontrado no arquivo.");
  }

  const leafCert = certBags[0]?.cert;
  if (!leafCert) {
    throw new Error("Certificado principal nao encontrado no arquivo.");
  }

  const certPem = forge.pki.certificateToPem(leafCert);
  const caPem = certBags
    .slice(1)
    .map((bag) => bag.cert)
    .filter((cert): cert is forge.pki.Certificate => Boolean(cert))
    .map((cert) => forge.pki.certificateToPem(cert));

  return {
    keyPem: forge.pki.privateKeyToPem(keyBag.key),
    certPem,
    caPem,
  };
}
