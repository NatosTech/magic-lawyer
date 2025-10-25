const { PrismaClient } = require("../../app/generated/prisma");

const prisma = new PrismaClient();

async function seedModuloCategorias() {
  console.log("🌱 Iniciando seed de categorias de módulos...");

  const categorias = [
    {
      slug: "core",
      nome: "Core",
      descricao: "Funcionalidades essenciais do sistema",
      icone: "Shield",
      cor: "#3B82F6",
      ordem: 1,
    },
    {
      slug: "produtividade",
      nome: "Produtividade",
      descricao: "Ferramentas para aumentar a produtividade",
      icone: "Zap",
      cor: "#10B981",
      ordem: 2,
    },
    {
      slug: "juridico",
      nome: "Jurídico",
      descricao: "Módulos específicos para atividades jurídicas",
      icone: "Scale",
      cor: "#8B5CF6",
      ordem: 3,
    },
    {
      slug: "financeiro",
      nome: "Financeiro",
      descricao: "Gestão financeira e cobrança",
      icone: "DollarSign",
      cor: "#F59E0B",
      ordem: 4,
    },
    {
      slug: "documentos",
      nome: "Documentos",
      descricao: "Gestão de documentos e contratos",
      icone: "FileText",
      cor: "#EF4444",
      ordem: 5,
    },
    {
      slug: "administrativo",
      nome: "Administrativo",
      descricao: "Ferramentas administrativas e configurações",
      icone: "Settings",
      cor: "#6B7280",
      ordem: 6,
    },
  ];

  try {
    // Limpar categorias existentes
    await prisma.moduloCategoria.deleteMany({});
    console.log("🗑️ Categorias existentes removidas");

    // Criar categorias
    for (const categoria of categorias) {
      await prisma.moduloCategoria.create({
        data: categoria,
      });
      console.log(`✅ Categoria criada: ${categoria.nome}`);
    }

    console.log(`🎉 Seed de categorias concluído! ${categorias.length} categorias criadas.`);
  } catch (error) {
    console.error("❌ Erro no seed de categorias:", error);
    throw error;
  }
}

module.exports = { seedModuloCategorias };

// Executar se chamado diretamente
if (require.main === module) {
  seedModuloCategorias()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
