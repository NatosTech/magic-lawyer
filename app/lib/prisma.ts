import { PrismaClient } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Evita criar múltiplas instâncias no hot-reload do Next.js (dev)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Função recursiva para sanitizar objetos para serialização
function sanitizeForSerialization<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Decimal) {
    return Number(obj.toString()) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  if (typeof obj === "function") {
    // Remover funções - não podem ser serializadas
    return undefined as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForSerialization).filter((item) => item !== undefined) as T;
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};

    // Usar Object.getOwnPropertyNames para evitar propriedades de símbolo
    const keys = Object.getOwnPropertyNames(obj);

    for (const key of keys) {
      const value = (obj as Record<string, unknown>)[key];
      const sanitizedValue = sanitizeForSerialization(value);

      // Só incluir se não for undefined (funções removidas)
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }

    return sanitized as T;
  }

  return obj;
}

// Criar Prisma Client básico
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: "error", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Exportar função utilitária para sanitização manual quando necessário
export { sanitizeForSerialization };
