import { PrismaClient } from "../generated/prisma";

// Evita criar múltiplas instâncias no hot-reload do Next.js (dev)
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

// Função para criar o Prisma Client com extensões type-safe
function createPrismaClient() {
  const basePrisma = new PrismaClient({
    log: [
      { level: "error", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
  });

  // Extensão que converte campos Decimal automaticamente com type safety
  return basePrisma.$extends({
    result: {
      advogado: {
        comissaoPadrao: {
          needs: { comissaoPadrao: true },
          compute(advogado) {
            return advogado.comissaoPadrao ? Number(advogado.comissaoPadrao.toString()) : null;
          },
        },
        comissaoAcaoGanha: {
          needs: { comissaoAcaoGanha: true },
          compute(advogado) {
            return advogado.comissaoAcaoGanha ? Number(advogado.comissaoAcaoGanha.toString()) : null;
          },
        },
        comissaoHonorarios: {
          needs: { comissaoHonorarios: true },
          compute(advogado) {
            return advogado.comissaoHonorarios ? Number(advogado.comissaoHonorarios.toString()) : null;
          },
        },
      },
      processo: {
        valorCausa: {
          needs: { valorCausa: true },
          compute(processo) {
            return processo.valorCausa ? Number(processo.valorCausa.toString()) : null;
          },
        },
      },
      contrato: {
        valor: {
          needs: { valor: true },
          compute(contrato) {
            return contrato.valor ? Number(contrato.valor.toString()) : null;
          },
        },
        comissaoAdvogado: {
          needs: { comissaoAdvogado: true },
          compute(contrato) {
            return contrato.comissaoAdvogado ? Number(contrato.comissaoAdvogado.toString()) : null;
          },
        },
        percentualAcaoGanha: {
          needs: { percentualAcaoGanha: true },
          compute(contrato) {
            return contrato.percentualAcaoGanha ? Number(contrato.percentualAcaoGanha.toString()) : null;
          },
        },
        valorAcaoGanha: {
          needs: { valorAcaoGanha: true },
          compute(contrato) {
            return contrato.valorAcaoGanha ? Number(contrato.valorAcaoGanha.toString()) : null;
          },
        },
      },
    },
  });
}

// Exportar o Prisma Client com conversão automática de Decimal
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
