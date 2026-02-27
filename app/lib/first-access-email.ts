import { headers } from "next/headers";

import { emailService } from "@/app/lib/email-service";
import { gerarTokenPrimeiroAcesso } from "@/app/lib/first-access-token";

export function maskEmail(email: string) {
  const [localPartRaw, domainRaw = ""] = email.split("@");
  const localPart = localPartRaw ?? "";
  const domainParts = domainRaw.split(".");
  const domainName = domainParts[0] ?? "";
  const tld = domainParts.length > 1 ? domainParts.slice(1).join(".") : "";

  const visibleLocal = localPart.slice(0, 2);
  const maskedLocal = `${visibleLocal}${"*".repeat(Math.max(localPart.length - 2, 2))}`;

  const visibleDomain = domainName.slice(0, 1);
  const maskedDomain = `${visibleDomain}${"*".repeat(Math.max(domainName.length - 1, 2))}`;

  return tld
    ? `${maskedLocal}@${maskedDomain}.${tld}`
    : `${maskedLocal}@${maskedDomain}`;
}

export async function buildPublicBaseUrlFromRequest() {
  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") || hdrs.get("host") || process.env.NEXTAUTH_URL;
  const forwardedProto = hdrs.get("x-forwarded-proto");

  if (!host) {
    return process.env.NEXTAUTH_URL || "http://localhost:9192";
  }

  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host;
  }

  const proto =
    forwardedProto || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

export async function enviarEmailPrimeiroAcesso(params: {
  userId: string;
  tenantId: string;
  email: string;
  nome?: string | null;
  tenantNome: string;
  credentialType?: "DEFAULT" | "ADMIN";
  expiresInHours?: number;
  baseUrl?: string;
}) {
  const token = gerarTokenPrimeiroAcesso({
    userId: params.userId,
    tenantId: params.tenantId,
    email: params.email,
    expiresInHours: params.expiresInHours,
  });

  const baseUrl = params.baseUrl || (await buildPublicBaseUrlFromRequest());
  const linkPrimeiroAcesso = `${baseUrl}/primeiro-acesso/${token}`;
  const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiracaoFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiraEm);

  const subject = `Primeiro acesso ao ${params.tenantNome}`;
  const saudacaoNome = params.nome?.trim() || "usuário";
  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <body style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;padding:24px;color:#111827;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
          <h1 style="font-size:20px;margin:0 0 12px;">Primeiro acesso ao sistema</h1>
          <p style="margin:0 0 12px;">Olá, ${saudacaoNome}.</p>
          <p style="margin:0 0 16px;">
            Seu acesso ao <strong>${params.tenantNome}</strong> foi criado.
            Para definir sua senha e entrar no sistema, use o botão abaixo.
          </p>
          <p style="margin:24px 0;">
            <a href="${linkPrimeiroAcesso}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;display:inline-block;">
              Definir senha de acesso
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">
            Este link expira em <strong>${expiracaoFormatada}</strong>.
          </p>
          <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
            Se o botão não funcionar, copie este link: ${linkPrimeiroAcesso}
          </p>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Olá, ${saudacaoNome}.`,
    `Seu acesso ao ${params.tenantNome} foi criado.`,
    `Use o link para definir sua senha: ${linkPrimeiroAcesso}`,
    `Expiração: ${expiracaoFormatada}.`,
  ].join("\n");

  const envio = await emailService.sendEmailPerTenant(params.tenantId, {
    to: params.email,
    subject,
    html,
    text,
    credentialType: params.credentialType || "ADMIN",
    fromNameFallback: params.tenantNome,
  });

  return {
    success: envio.success,
    error: envio.error,
    token,
    linkPrimeiroAcesso,
  };
}
