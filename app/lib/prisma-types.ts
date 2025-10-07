import { Decimal } from "@prisma/client/runtime/library";

import { PrismaClient } from "../generated/prisma";

// Tipo base do Prisma Client
type BasePrismaClient = PrismaClient;

// Tipo para o Prisma Client estendido com conversões de Decimal
export type ExtendedPrismaClient = BasePrismaClient & {
  $extends: any; // Para manter compatibilidade com extensões
};

// Função para converter Decimal para number recursivamente
export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Decimal) {
    return Number(obj.toString()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalsToNumbers) as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const newObj: any = {};

    for (const key in obj) {
      newObj[key] = convertDecimalsToNumbers(obj[key]);
    }

    return newObj;
  }

  return obj;
}

// Função para converter resultados do Prisma
export function convertPrismaResult<T>(result: T): T {
  return convertDecimalsToNumbers(result);
}
