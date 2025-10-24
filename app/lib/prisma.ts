import { Prisma, PrismaClient } from "../generated/prisma";

const { Decimal } = Prisma;

// Evita criar múltiplas instâncias no hot-reload do Next.js (dev)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  consolePatched?: boolean;
};

// Bloquear logs verbosos do Prisma - EXECUTAR APENAS UMA VEZ
if (!globalForPrisma.consolePatched) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  console.error = (...args: any[]) => {
    const str = args.join(" ");

    // Bloquear logs verbosos do Prisma
    if (
      str.includes("checkPlatformCaching") ||
      str.includes("prisma:info") ||
      str.includes("Prisma has detected") ||
      str.includes("This leads to an outdated Prisma Client") ||
      str.includes("make sure to run") ||
      str.includes("prisma generate") ||
      str.includes("build process") ||
      str.includes("clientVersion") ||
      str.includes("clientVersion: '6.17.1'") ||
      str.length > 1000 // Mensagens muito longas
    ) {
      return;
    }

    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const str = args.join(" ");

    if (
      str.includes("checkPlatformCaching") ||
      str.includes("Prisma has detected") ||
      str.includes("prisma:info")
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  console.log = (...args: any[]) => {
    const str = args.join(" ");

    // Bloquear logs de desenvolvimento do Prisma
    if (
      str.includes("prisma:info") ||
      str.includes("clientVersion") ||
      str.includes("Prisma has detected")
    ) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  globalForPrisma.consolePatched = true;
}

// Criar Prisma Client com logs desabilitados
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [], // Desabilita todos os logs do Prisma
    errorFormat: "minimal", // Formato mínimo de erro
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Converte um valor Decimal do Prisma para number
 * Type-safe e otimizado para serialização
 */
export function toNumber(
  value: Prisma.Decimal | null | undefined,
): number | null {
  if (!value) return null;

  // Handle different Decimal representations
  let num: number;

  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    num = Number(value);
  } else if (value && typeof value === "object") {
    // Handle Decimal objects
    if (value.toString) {
      num = Number(value.toString());
    } else if (value.d && value.e !== undefined && value.s !== undefined) {
      // Handle Decimal internal structure: {d: [digits], e: exponent, s: sign}
      const digits = Array.isArray(value.d)
        ? value.d.join("")
        : String(value.d);
      const exponent = value.e || 0;
      const sign = value.s || 1;
      const numStr = sign === -1 ? "-" : "";

      if (exponent >= 0) {
        num = Number(numStr + digits + "0".repeat(exponent));
      } else {
        const pos = digits.length + exponent;

        if (pos <= 0) {
          num = Number(numStr + "0." + "0".repeat(-pos) + digits);
        } else {
          num = Number(numStr + digits.slice(0, pos) + "." + digits.slice(pos));
        }
      }
    } else {
      num = Number(value);
    }
  } else {
    num = Number(value);
  }

  return isNaN(num) ? null : num;
}

/**
 * Converte campos Decimal de um objeto para number
 * Use este helper nos Server Actions antes de retornar dados para Client Components
 * Suporta objetos aninhados e arrays
 */
export function convertDecimalFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
): T {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj } as any;

  // Converter campos especificados
  for (const field of fields) {
    const value = result[field];

    if (value instanceof Decimal) {
      result[field] = toNumber(value);
    }
  }

  // Converter recursivamente objetos aninhados
  for (const key in result) {
    const value = result[key];

    if (value instanceof Decimal) {
      // Se for um Decimal não especificado nos campos, converter também
      result[key] = toNumber(value);
    } else if (Array.isArray(value)) {
      // Converter arrays recursivamente
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? convertDecimalFields(item, fields)
          : item instanceof Decimal
            ? toNumber(item)
            : item,
      );
    } else if (typeof value === "object" && value !== null) {
      // Converter objetos aninhados recursivamente
      result[key] = convertDecimalFields(value, fields);
    }
  }

  return result as T;
}

/**
 * Converte automaticamente TODOS os campos Decimal de um objeto para number
 * e Date objects para strings ISO
 * Use este helper quando quiser converter todos os Decimals sem especificar campos
 */
export function convertAllDecimalFields<T extends Record<string, any>>(
  obj: T,
): T {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj } as any;

  for (const key in result) {
    const value = result[key];

    // Check for Decimal objects more robustly
    if (
      value &&
      typeof value === "object" &&
      (value instanceof Decimal ||
        (value.constructor && value.constructor.name === "Decimal") ||
        (value.d && value.e !== undefined && value.s !== undefined)) // Decimal internal structure
    ) {
      result[key] = toNumber(value);
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return convertAllDecimalFields(item);
        } else if (
          item &&
          typeof item === "object" &&
          (item instanceof Decimal ||
            (item.constructor && item.constructor.name === "Decimal") ||
            (item.d && item.e !== undefined && item.s !== undefined))
        ) {
          return toNumber(item);
        } else if (item instanceof Date) {
          return item.toISOString();
        }

        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      result[key] = convertAllDecimalFields(value);
    }
  }

  return result as T;
}

export default prisma;
