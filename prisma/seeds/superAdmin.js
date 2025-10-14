const bcrypt = require("bcryptjs");

/**
 * Seed do Super Admin do sistema Magic Lawyer
 * Este usuário tem acesso total para gerenciar tenants e recursos globais
 */
async function seedSuperAdmin(prisma) {
  console.log("\n🔑 Criando Super Admins do sistema...\n");

  try {
    // Hash das senhas
    const robsonPasswordHash = await bcrypt.hash("Robson123!", 12);
    const talisiaPasswordHash = await bcrypt.hash("Talisia123!", 12);

    // Criar Super Admin - Robson
    const superAdminRobson = await prisma.superAdmin.upsert({
      where: { email: "robsonnonatoiii@gmail.com" },
      update: {
        // Atualizar dados se já existir
        firstName: "Robson",
        lastName: "Nonato",
        passwordHash: robsonPasswordHash,
        status: "ACTIVE",
      },
      create: {
        email: "robsonnonatoiii@gmail.com",
        firstName: "Robson",
        lastName: "Nonato",
        passwordHash: robsonPasswordHash,
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Super Admin Robson criado:");
    console.log(`   📧 Email: ${superAdminRobson.email}`);
    console.log(`   👤 Nome: ${superAdminRobson.firstName} ${superAdminRobson.lastName}`);
    console.log(`   🔑 Senha: Robson123!`);
    console.log(`   🆔 ID: ${superAdminRobson.id}`);

    // Criar Super Admin - Talisia
    const superAdminTalisia = await prisma.superAdmin.upsert({
      where: { email: "talisiavmatos@gmail.com" },
      update: {
        // Atualizar dados se já existir
        firstName: "Talisia",
        lastName: "Matos",
        passwordHash: talisiaPasswordHash,
        status: "ACTIVE",
      },
      create: {
        email: "talisiavmatos@gmail.com",
        firstName: "Talisia",
        lastName: "Matos",
        passwordHash: talisiaPasswordHash,
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Super Admin Talisia criada:");
    console.log(`   📧 Email: ${superAdminTalisia.email}`);
    console.log(`   👤 Nome: ${superAdminTalisia.firstName} ${superAdminTalisia.lastName}`);
    console.log(`   🔑 Senha: Talisia123!`);
    console.log(`   🆔 ID: ${superAdminTalisia.id}`);

    // Criar log de auditoria para Robson
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: superAdminRobson.id,
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

    // Criar log de auditoria para Talisia
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: superAdminTalisia.id,
        acao: "CREATE_SYSTEM",
        entidade: "SYSTEM",
        dadosNovos: {
          message: "Super Admin Talisia criada no sistema",
          superAdminCreated: true,
        },
        ipAddress: "127.0.0.1",
        userAgent: "Seed Script",
      },
    });

    console.log("✅ Logs de auditoria criados");

    return { superAdminRobson, superAdminTalisia };
  } catch (error) {
    console.error("❌ Erro ao criar Super Admins:", error);
    throw error;
  }
}

module.exports = { seedSuperAdmin };
