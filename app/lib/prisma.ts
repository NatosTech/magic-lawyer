import { PrismaClient } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Evita criar múltiplas instâncias no hot-reload do Next.js (dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Função para converter Decimal para number recursivamente
function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Decimal) {
    return Number(obj.toString());
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalsToNumbers);
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

// Criar Prisma Client com extensão que converte Decimais
const basePrisma = new PrismaClient({
  log: [
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
});

// Aplicar extensão que converte todos os campos Decimal
const prismaWithDecimalConversion = basePrisma.$extends({
  result: {
    advogado: {
      comissaoPadrao: {
        needs: { comissaoPadrao: true },
        compute(advogado) {
          return advogado.comissaoPadrao ? Number(advogado.comissaoPadrao.toString()) : 0;
        },
      },
      comissaoAcaoGanha: {
        needs: { comissaoAcaoGanha: true },
        compute(advogado) {
          return advogado.comissaoAcaoGanha ? Number(advogado.comissaoAcaoGanha.toString()) : 0;
        },
      },
      comissaoHonorarios: {
        needs: { comissaoHonorarios: true },
        compute(advogado) {
          return advogado.comissaoHonorarios ? Number(advogado.comissaoHonorarios.toString()) : 0;
        },
      },
    },
    // Adicionar outros modelos que tenham campos Decimal conforme necessário
    processo: {
      valorCausa: {
        needs: { valorCausa: true },
        compute(processo) {
          return processo.valorCausa ? Number(processo.valorCausa.toString()) : 0;
        },
      },
    },
    contrato: {
      valor: {
        needs: { valor: true },
        compute(contrato) {
          return contrato.valor ? Number(contrato.valor.toString()) : 0;
        },
      },
    },
  },
});

export const prisma = globalForPrisma.prisma ?? prismaWithDecimalConversion;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
