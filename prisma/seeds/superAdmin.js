const bcrypt = require("bcryptjs");

/**
 * Seed do Super Admin do sistema Magic Lawyer
 * Este usuário tem acesso total para gerenciar tenants e recursos globais
 */
async function seedSuperAdmin(prisma) {
  console.log("\n🔑 Criando Super Admin do sistema...\n");

  try {
    // Hash da senha
    const passwordHash = await bcrypt.hash("Robson123!", 12);

    // Criar Super Admin
    const superAdmin = await prisma.superAdmin.upsert({
      where: { email: "robsonnonatoiii@gmail.com" },
      update: {
        // Atualizar dados se já existir
        firstName: "Robson",
        lastName: "Nonato",
        passwordHash,
        status: "ACTIVE",
      },
      create: {
        email: "robsonnonatoiii@gmail.com",
        firstName: "Robson",
        lastName: "Nonato",
        passwordHash,
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Super Admin criado:");
    console.log(`   📧 Email: ${superAdmin.email}`);
    console.log(`   👤 Nome: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   🔑 Senha: Robson123!`);
    console.log(`   🆔 ID: ${superAdmin.id}`);

    // Criar log de auditoria
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: superAdmin.id,
        acao: "CREATE_SYSTEM",
        entidade: "SYSTEM",
        dadosNovos: {
          message: "Sistema Magic Lawyer inicializado",
          superAdminCreated: true,
        },
        ipAddress: "127.0.0.1",
        userAgent: "Seed Script",
      },
    });

    console.log("✅ Log de auditoria criado");

    return superAdmin;
  } catch (error) {
    console.error("❌ Erro ao criar Super Admin:", error);
    throw error;
  }
}

module.exports = { seedSuperAdmin };
