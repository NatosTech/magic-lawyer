const { PrismaClient, Prisma } = require("../app/generated/prisma");

const seedAreasProcesso = require("./seeds/areasProcesso");
const seedTiposContrato = require("./seeds/tiposContrato");
const seedCategoriasTarefa = require("./seeds/categoriasTarefa");
const seedPlanos = require("./seeds/planos");
const { seedTenantSandra } = require("./seeds/tenants/tenantSandra");
const { seedSalbaAdvocacia } = require("./seeds/tenants/salbaAdvocacia");
const { seedEventos } = require("./seeds/eventos");
const { seedJuizes } = require("./seeds/juizes");
const { seedSuperAdmin } = require("./seeds/superAdmin");
const { seedConfiguracoesPreco } = require("./seeds/configuracoesPreco");
const { seedPacotesJuiz } = require("./seeds/pacotesJuiz");
const { seedDadosFinanceiros } = require("./seeds/dadosFinanceiros");
const { seedContratos } = require("./seeds/contratos");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Criar tenant global para dados compartilhados
  console.log("🌍 Criando tenant global...\n");
  await prisma.tenant.upsert({
    where: { slug: "global" },
    update: {},
    create: {
      id: "GLOBAL",
      name: "Sistema Global",
      slug: "global",
      status: "ACTIVE",
      timezone: "America/Sao_Paulo",
      tipoPessoa: "JURIDICA",
    },
  });

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

  console.log("\n🔑 Criando Super Admin do sistema...\n");

  // Seed do Super Admin
  const superAdmin = await seedSuperAdmin(prisma);

  console.log("\n👨‍⚖️ Criando base de juízes...\n");

  // Seed de juízes (controlados pelo Super Admin)
  await seedJuizes(superAdmin.id, prisma);

  console.log("\n⚙️ Criando configurações de preço...\n");

  // Seed de configurações de preço
  await seedConfiguracoesPreco(superAdmin.id, prisma);

  console.log("\n📦 Criando pacotes de juízes...\n");

  // Seed de pacotes de juízes
  await seedPacotesJuiz(superAdmin.id, prisma);

  console.log("\n💰 Criando dados financeiros de teste...\n");

  // Seed de dados financeiros
  await seedDadosFinanceiros(prisma);

  console.log("\n📄 Criando contratos, processos e procurações...\n");

  // Seed de contratos, processos e procurações
  await seedContratos(prisma, Prisma);

  console.log("\n🚀 Aplicando otimizações enterprise...\n");

  // Apply enterprise optimizations (constraints, indexes, full-text search)
  try {
    const fs = require("fs");
    const path = require("path");

    const optimizationScript = fs.readFileSync(path.join(__dirname, "../scripts/enterprise-optimizations.sql"), "utf8");

    // Split the script into individual commands and execute them
    const commands = optimizationScript
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    for (const command of commands) {
      if (command.trim()) {
        await prisma.$executeRawUnsafe(command);
      }
    }

    console.log("✅ Otimizações enterprise aplicadas com sucesso!");
    console.log("   - Constraints de integridade temporal");
    console.log("   - Constraints de valores positivos");
    console.log("   - Full-text search em português");
    console.log("   - Índices GIN para arrays");
    console.log("   - Índices de performance otimizados");
  } catch (error) {
    console.error("⚠️  Erro ao aplicar otimizações enterprise:", error.message);
    console.log("   As otimizações serão aplicadas na próxima execução do seed");
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("🚀 Sistema enterprise-grade pronto para produção!");
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
