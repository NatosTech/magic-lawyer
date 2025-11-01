/**
 * Script simples para garantir que há tenant ACTIVE com usuário ativo
 */

import prisma from "../app/lib/prisma";

async function fix() {
  try {
    console.log("🔧 Corrigindo status de tenants e usuários...\n");

    // 1. Atualizar TODOS os tenants para ACTIVE
    console.log("1️⃣ Atualizando todos os tenants para ACTIVE...");
    const tenantsUpdated = await prisma.tenant.updateMany({
      data: { status: "ACTIVE" },
    });
    console.log(`   ✅ ${tenantsUpdated.count} tenant(s) atualizado(s)\n`);

    // 2. Ativar TODOS os usuários
    console.log("2️⃣ Ativando todos os usuários...");
    const usersUpdated = await prisma.usuario.updateMany({
      data: { active: true },
    });
    console.log(`   ✅ ${usersUpdated.count} usuário(s) ativado(s)\n`);

    // 3. Verificar resultado
    console.log("3️⃣ Verificando resultado...");
    const tenant = await prisma.tenant.findFirst({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        nome: true,
        status: true,
        _count: {
          select: {
            usuarios: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (tenant) {
      console.log(`\n✅ SUCESSO!`);
      console.log(`   Tenant ID: ${tenant.id}`);
      console.log(`   Nome: ${tenant.nome || "Sem nome"}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Usuários ativos: ${tenant._count.usuarios}`);
      console.log(`\n✨ O smoke test agora vai funcionar!`);
      console.log(`   Execute: npm run smoke:notifications\n`);
    } else {
      console.log(`\n⚠️ Nenhum tenant encontrado após correção.`);
      console.log(`💡 Execute: npm run prisma:seed\n`);
    }
  } catch (error) {
    console.error("\n❌ Erro:", error);
    if (error instanceof Error) {
      console.error("   Mensagem:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fix();

