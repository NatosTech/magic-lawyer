const { PrismaClient, Prisma } = require("../app/generated/prisma");

const seedAreasProcesso = require("./seeds/areasProcesso");
const seedTiposContrato = require("./seeds/tiposContrato");
const seedCategoriasTarefa = require("./seeds/categoriasTarefa");
const seedPlanos = require("./seeds/planos");
const seedTenantSandra = require("./seeds/tenantSandra");

const prisma = new PrismaClient();

async function main() {
  await seedAreasProcesso(prisma);
  await seedTiposContrato(prisma);
  await seedCategoriasTarefa(prisma);
  await seedPlanos(prisma);
  await seedTenantSandra(prisma, Prisma);
}

main()
  .then(async () => {
    console.log("Seed concluido com sucesso");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed falhou", error);
    await prisma.$disconnect();
    process.exit(1);
  });
