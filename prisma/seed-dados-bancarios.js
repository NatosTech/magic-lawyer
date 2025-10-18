const { PrismaClient } = require("../app/generated/prisma");
const { seedDadosBancarios } = require("./seeds/dadosBancarios");

const prisma = new PrismaClient();

async function main() {
  console.log("🏦 Executando seed de dados bancários...");

  try {
    await seedDadosBancarios(prisma);
    console.log("✅ Seed de dados bancários concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed de dados bancários:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
