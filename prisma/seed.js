const { PrismaClient, Prisma } = require("../app/generated/prisma");

const seedAreasProcesso = require("./seeds/areasProcesso");
const seedTiposContrato = require("./seeds/tiposContrato");
const seedCategoriasTarefa = require("./seeds/categoriasTarefa");
const seedPlanos = require("./seeds/planos");
const { seedTenantSandra } = require("./seeds/tenants/tenantSandra");
const { seedSalbaAdvocacia } = require("./seeds/tenants/salbaAdvocacia");
const { seedEventos } = require("./seeds/eventos");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Seeds básicos
  await seedAreasProcesso(prisma);
  await seedTiposContrato(prisma);
  await seedCategoriasTarefa(prisma);
  await seedPlanos(prisma);

  console.log("\n🏢 Criando tenants...\n");

  // Seeds de tenants
  await seedTenantSandra(prisma, Prisma);
  await seedSalbaAdvocacia(prisma);

  console.log("\n📅 Criando eventos...\n");

  // Seed de eventos
  await seedEventos();

  console.log("\n🎉 Seed concluído com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed falhou:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
