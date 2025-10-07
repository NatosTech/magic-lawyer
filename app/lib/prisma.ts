import { PrismaClient } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Evita criar múltiplas instâncias no hot-reload do Next.js (dev)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Criar Prisma Client
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Converte um valor Decimal do Prisma para number
 * Type-safe e otimizado para serialização
 */
export function toNumber(value: Decimal | null | undefined): number | null {
  if (!value) return null;
  return Number(value.toString());
}

/**
 * Converte campos Decimal de um objeto para number
 * Use este helper nos Server Actions antes de retornar dados para Client Components
 */
export function convertDecimalFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj } as any;
  for (const field of fields) {
    const value = result[field];
    if (value instanceof Decimal) {
      result[field] = toNumber(value);
    }
  }
  return result as T;
}

export default prisma;
