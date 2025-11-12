const bcrypt = require("bcryptjs");

async function seedSalbaAdvocacia(prisma) {
  console.log("🌱 Criando tenant Salba Advocacia...");

  // Hash das senhas
  const [adminPasswordHash, advogado1PasswordHash, advogado2PasswordHash, cliente1PasswordHash, cliente2PasswordHash, cliente3PasswordHash] = await Promise.all([
    bcrypt.hash("Luciano@123", 10), // Admin: Luciano Salba
    bcrypt.hash("Mariana@123", 10), // Advogada: Mariana Costa
    bcrypt.hash("Pedro@123", 10), // Advogado: Pedro Santos
    bcrypt.hash("Cliente1@123", 10), // Cliente: João Silva
    bcrypt.hash("Cliente2@123", 10), // Cliente: Maria Oliveira
    bcrypt.hash("Cliente3@123", 10), // Cliente: Carlos Pereira
  ]);

  // 1. Criar o tenant Salba Advocacia
  const tenant = await prisma.tenant.upsert({
    where: { slug: "salba" },
    update: {},
    create: {
      slug: "salba",
      name: "Salba Advocacia",
      razaoSocial: "Salba Advocacia Ltda",
      documento: "12.345.678/0001-90",
      email: "contato@salbaadvocacia.com.br",
      telefone: "(11) 3456-7890",
      status: "ACTIVE",
      domain: "salbaadvocacia.com.br",
    },
  });

  console.log(`✅ Tenant criado: ${tenant.name} (${tenant.slug})`);

  // 2. Criar branding do tenant
  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#1E40AF", // Azul mais escuro para diferenciação
      secondaryColor: "#3B82F6",
      accentColor: "#F59E0B",
      logoUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop&crop=center",
      faviconUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=32&h=32&fit=crop&crop=center",
      emailFromName: "Salba Advocacia",
      emailFromAddress: "noreply@salbaadvocacia.com.br",
      customDomainText: "Portal Salba Advocacia",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#1E40AF", // Azul mais escuro para diferenciação
      secondaryColor: "#3B82F6",
      accentColor: "#F59E0B",
      logoUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop&crop=center",
      faviconUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=32&h=32&fit=crop&crop=center",
      emailFromName: "Salba Advocacia",
      emailFromAddress: "noreply@salbaadvocacia.com.br",
      customDomainText: "Portal Salba Advocacia",
    },
  });

  console.log("✅ Branding criado para Salba Advocacia");

  // 2.1. Criar endereço do tenant
  await prisma.tenantEndereco.upsert({
    where: {
      tenantId_apelido: {
        tenantId: tenant.id,
        apelido: "Matriz",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      apelido: "Matriz",
      tipo: "ESCRITORIO",
      principal: true,
      logradouro: "Av. Paulista",
      numero: "1000",
      complemento: "Conjunto 501",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-100",
      pais: "Brasil",
      telefone: "(11) 3456-7890",
    },
  });

  console.log("✅ Endereço criado para Salba Advocacia");

  // 3. Criar usuários do tenant
  const usuarios = [
    // Admin
    {
      email: "luciano@salbaadvocacia.com.br",
      passwordHash: adminPasswordHash,
      firstName: "Luciano",
      lastName: "Salba",
      role: "ADMIN",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    // Advogados
    {
      email: "mariana@salbaadvocacia.com.br",
      passwordHash: advogado1PasswordHash,
      firstName: "Mariana",
      lastName: "Costa",
      role: "ADVOGADO",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "pedro@salbaadvocacia.com.br",
      passwordHash: advogado2PasswordHash,
      firstName: "Pedro",
      lastName: "Santos",
      role: "ADVOGADO",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    // Clientes
    {
      email: "joao.silva@email.com",
      passwordHash: cliente1PasswordHash,
      firstName: "João",
      lastName: "Silva",
      role: "CLIENTE",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "maria.oliveira@email.com",
      passwordHash: cliente2PasswordHash,
      firstName: "Maria",
      lastName: "Oliveira",
      role: "CLIENTE",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      email: "carlos.pereira@email.com",
      passwordHash: cliente3PasswordHash,
      firstName: "Carlos",
      lastName: "Pereira",
      role: "CLIENTE",
      active: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
  ];

  for (const usuarioData of usuarios) {
    const usuario = await prisma.usuario.upsert({
      where: {
        email_tenantId: {
          email: usuarioData.email,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...usuarioData,
        tenantId: tenant.id,
      },
    });

    console.log(`✅ Usuário criado: ${usuario.firstName} ${usuario.lastName} (${usuario.role}) - ${usuario.email}`);
  }

  // 4. Função auxiliar para criar permissões
  async function ensurePermission(prisma, tenantId, usuarioId, permissao) {
    return prisma.usuarioPermissao.upsert({
      where: {
        tenantId_usuarioId_permissao: {
          tenantId,
          usuarioId,
          permissao,
        },
      },
      update: {},
      create: {
        tenantId,
        usuarioId,
        permissao,
      },
    });
  }

  // 5. Atribuir permissões aos usuários
  const usuariosCriados = await prisma.usuario.findMany({
    where: { tenantId: tenant.id },
  });

  // Admin tem todas as permissões
  const admin = usuariosCriados.find((u) => u.role === "ADMIN");
  if (admin) {
    await Promise.all([
      ensurePermission(prisma, tenant.id, admin.id, "CONFIGURACOES_ESCRITORIO"),
      ensurePermission(prisma, tenant.id, admin.id, "EQUIPE_GERENCIAR"),
      ensurePermission(prisma, tenant.id, admin.id, "FINANCEIRO_GERENCIAR"),
    ]);
    console.log("✅ Permissões atribuídas ao ADMIN");
  }

  // Advogados não têm permissões especiais (apenas acesso básico)
  console.log("✅ Advogados criados com acesso básico");

  // Clientes não têm permissões especiais (apenas acesso básico)
  console.log("✅ Clientes criados com acesso básico");

  // 6. Processos serão criados posteriormente quando necessário
  console.log("✅ Estrutura básica criada - processos podem ser adicionados via interface");

  // 7. Áreas de processo já são criadas no seed básico
  console.log("✅ Áreas de processo disponíveis via seed básico");

  console.log("🎉 Tenant Salba Advocacia criado com sucesso!");
  console.log("\n📋 Credenciais de teste:");
  console.log("👑 ADMIN: luciano@salbaadvocacia.com.br / Luciano@123");
  console.log("⚖️ ADVOGADO: mariana@salbaadvocacia.com.br / Mariana@123");
  console.log("⚖️ ADVOGADO: pedro@salbaadvocacia.com.br / Pedro@123");
  console.log("👤 CLIENTE: joao.silva@email.com / Cliente1@123");
  console.log("👤 CLIENTE: maria.oliveira@email.com / Cliente2@123");
  console.log("👤 CLIENTE: carlos.pereira@email.com / Cliente3@123");
  console.log("\n🔗 Acesso: http://localhost:9192/login");
  console.log("🏢 Slug do tenant: salba");

  return tenant;
}

module.exports = { seedSalbaAdvocacia };
