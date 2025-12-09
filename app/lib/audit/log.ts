import { Prisma } from "@/app/generated/prisma";
import prisma from "@/app/lib/prisma";

export type AuditLogParams = {
  tenantId: string;
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  dados?: Prisma.InputJsonValue | null;
  previousValues?: Prisma.InputJsonValue | null;
  changedFields?: string[];
  ip?: string | null;
  userAgent?: string | null;
};

export function toAuditJson(
  value: unknown,
): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export function extractChangedFieldsFromDiff(
  items: Array<{ field?: string }> | null | undefined,
): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  const fields = items
    .map((item) => item.field)
    .filter((field): field is string => Boolean(field));

  return Array.from(new Set(fields));
}

export async function logAudit({
  tenantId,
  usuarioId,
  acao,
  entidade,
  entidadeId,
  dados,
  previousValues,
  changedFields,
  ip,
  userAgent,
}: AuditLogParams) {
  const normalizedDados =
    dados === null ? Prisma.JsonNull : (dados as Prisma.InputJsonValue | undefined);
  const normalizedPrevious =
    previousValues === null
      ? Prisma.JsonNull
      : (previousValues as Prisma.InputJsonValue | undefined);

  return prisma.auditLog.create({
    data: {
      tenantId,
      usuarioId: usuarioId ?? null,
      acao,
      entidade,
      entidadeId: entidadeId ?? null,
      dados: normalizedDados,
      previousValues: normalizedPrevious,
      changedFields: changedFields ?? [],
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    },
  });
}
