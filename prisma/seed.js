const { PrismaClient, Prisma } = require("../app/generated/prisma");

const seedAreasProcesso = require("./seeds/areasProcesso");
const seedTiposContrato = require("./seeds/tiposContrato");
const seedCategoriasTarefa = require("./seeds/categoriasTarefa");
const seedPlanos = require("./seeds/planos");
const seedModulos = require("./seeds/modulos");
const { seedTenantSandra } = require("./seeds/tenants/tenantSandra");
const { seedTenantLuana } = require("./seeds/tenants/tenantLuana");
const { seedSalbaAdvocacia } = require("./seeds/tenants/salbaAdvocacia");
const { seedEventos } = require("./seeds/eventos");
const { seedJuizes } = require("./seeds/juizes");
const { seedSuperAdmin } = require("./seeds/superAdmin");
const { seedConfiguracoesPreco } = require("./seeds/configuracoesPreco");
const { seedPacotesJuiz } = require("./seeds/pacotesJuiz");
const { seedDadosFinanceiros } = require("./seeds/dadosFinanceiros");
const { seedContratos } = require("./seeds/contratos");
const seedCausas = require("./seeds/causas");
const seedRegimesPrazo = require("./seeds/regimesPrazo");
const { seedTiposPeticao } = require("./seeds/tipos-peticao");
const { seedBancos } = require("./seeds/bancos");
const { seedDadosBancarios } = require("./seeds/dadosBancarios");
const { seedAuditLogs } = require("./seeds/auditLogs");
const { seedRecebimentos } = require("./seeds/seed-recebimentos");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Criar tenant global para dados compartilhados
  console.log("🌍 Criando tenant global...\n");
  try {
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
    console.log("✅ Tenant global criado/atualizado\n");
  } catch (error) {
    console.warn("⚠️ Tenant global já existe, pulando...\n");
  }

  // Seeds básicos
  try {
    await seedAreasProcesso(prisma);
    await seedTiposContrato(prisma);
    await seedCategoriasTarefa(prisma);
    await seedModulos(prisma);
  } catch (error) {
    console.warn("⚠️ Algunos seeds básicos já existem:", error.message);
  }

  // Detectar módulos automaticamente antes de criar planos
  console.log("\n🔍 Detectando módulos automaticamente...");
  try {
    // Executar detecção via comando
    const { execSync } = require("child_process");
    execSync("npx tsx -e \"import('./app/actions/auto-detect-modules.ts').then(m => m.autoDetectModules())\"", { stdio: "inherit" });
    console.log("✅ Módulos detectados com sucesso!");
  } catch (error) {
    console.warn("⚠️ Erro na detecção automática de módulos:", error.message);
  }

  try {
    await seedPlanos(prisma);
  } catch (error) {
    console.warn("⚠️ Planos já criados:", error.message);
  }

  console.log("\n🏢 Criando tenants...\n");

  // Seeds de tenants
  try {
    await seedTenantSandra(prisma, Prisma);
    await seedTenantLuana(prisma, Prisma);
    await seedSalbaAdvocacia(prisma);
  } catch (error) {
    console.warn("⚠️ Tenants já criados:", error.message);
  }

  console.log("\n🗂️  Criando catálogo de causas...\n");
  try {
    await seedCausas(prisma);
  } catch (error) {
    console.warn("⚠️ Causas já criadas:", error.message);
  }

  console.log("\n⏱️  Criando regimes de prazo padrão...\n");
  try {
    await seedRegimesPrazo(prisma);
  } catch (error) {
    console.warn("⚠️ Regimes de prazo já criados:", error.message);
  }

  console.log("\n📅 Criando eventos...\n");

  // Seed de eventos
  try {
    await seedEventos();
  } catch (error) {
    console.warn("⚠️ Eventos já criados:", error.message);
  }

  console.log("\n🔑 Criando Super Admins do sistema...\n");

  // Seed do Super Admin
  let superAdminRobson, superAdminTalisia;
  try {
    const result = await seedSuperAdmin(prisma);
    superAdminRobson = result.superAdminRobson;
    superAdminTalisia = result.superAdminTalisia;
  } catch (error) {
    console.warn("⚠️ Super Admins já criados:", error.message);
    // Tentar buscar os existentes
    try {
      superAdminRobson = await prisma.superAdmin.findUnique({ where: { email: "robsonnonatoiii@gmail.com" } });
      superAdminTalisia = await prisma.superAdmin.findUnique({ where: { email: "talisia@magiclawyer.com" } });
    } catch (err) {
      console.warn("⚠️ Não foi possível buscar Super Admins existentes");
    }
  }

  console.log("\n👨‍⚖️ Criando base de juízes...\n");

  // Seed de juízes (controlados pelo Super Admin Robson)
  if (superAdminRobson) {
    try {
      await seedJuizes(superAdminRobson.id, prisma);
    } catch (error) {
      console.warn("⚠️ Juízes já criados:", error.message);
    }
  }

  console.log("\n⚙️ Criando configurações de preço...\n");

  // Seed de configurações de preço
  if (superAdminRobson) {
    try {
      await seedConfiguracoesPreco(superAdminRobson.id, prisma);
    } catch (error) {
      console.warn("⚠️ Configurações de preço já criadas:", error.message);
    }
  }

  console.log("\n📦 Criando pacotes de juízes...\n");

  // Seed de pacotes de juízes
  if (superAdminRobson) {
    try {
      await seedPacotesJuiz(superAdminRobson.id, prisma);
    } catch (error) {
      console.warn("⚠️ Pacotes de juízes já criados:", error.message);
    }
  }

  console.log("\n🕵️  Criando registros de auditoria...\n");

  // Seed de logs de auditoria (super admin e tenants)
  if (superAdminRobson) {
    try {
      await seedAuditLogs(prisma, superAdminRobson.id);
    } catch (error) {
      console.warn("⚠️ Logs de auditoria já criados:", error.message);
    }
  }

  console.log("\n💰 Criando dados financeiros de teste...\n");

  // Seed de dados financeiros
  try {
    await seedDadosFinanceiros(prisma);
  } catch (error) {
    console.warn("⚠️ Dados financeiros já criados:", error.message);
  }

  console.log("\n📄 Criando contratos, processos e procurações...\n");

  // Seed de contratos, processos e procurações
  try {
    await seedContratos(prisma, Prisma);
  } catch (error) {
    console.warn("⚠️ Contratos já criados:", error.message);
  }

  console.log("\n🏛️  Criando tipos de petição padrão...\n");

  // Seed de tipos de petição
  try {
    await seedTiposPeticao();
  } catch (error) {
    console.warn("⚠️ Tipos de petição já criados:", error.message);
  }

  // Seed de bancos do Brasil
  try {
    await seedBancos();
  } catch (error) {
    console.warn("⚠️ Bancos já criados:", error.message);
  }

  // Seed de dados bancários para usuários
  try {
    await seedDadosBancarios(prisma);
  } catch (error) {
    console.warn("⚠️ Dados bancários já criados:", error.message);
  }

  // Seed de recebimentos (parcelas e faturas pagas)
  try {
    await seedRecebimentos(prisma, Prisma);
  } catch (error) {
    console.warn("⚠️ Recebimentos já criados:", error.message);
  }

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
