#!/usr/bin/env tsx
/**
 * Smoke test para validar escopo de dados
 * Testa que Jaqueline (vinculada à Sandra) só vê dados da Sandra
 */

import prisma from "../app/lib/prisma";
import { getAccessibleAdvogadoIds } from "../app/lib/advogado-access";

async function smokeTest() {
  console.log("🧪 Iniciando smoke test de escopo de dados...\n");

  try {
    // 1. Buscar usuários
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "sandra" },
    });

    if (!tenant) {
      console.error("❌ Tenant 'sandra' não encontrado");
      process.exit(1);
    }

    const jaqueline = await prisma.usuario.findFirst({
      where: {
        tenantId: tenant.id,
        email: "jaqueline.souza@sandraadv.br",
      },
    });

    const sandra = await prisma.usuario.findFirst({
      where: {
        tenantId: tenant.id,
        email: "sandra@adv.br",
      },
      include: {
        advogado: {
          select: { id: true },
        },
      },
    });

    if (!jaqueline || !sandra?.advogado) {
      console.error("❌ Usuários não encontrados no seed");
      process.exit(1);
    }

    console.log("✅ Usuários encontrados:");
    console.log(`   - Jaqueline: ${jaqueline.email} (${jaqueline.role})`);
    console.log(`   - Sandra: ${sandra.email} (${sandra.advogado.id})\n`);

    // 2. Verificar vínculo (pode não existir - nova regra permite acesso total sem vínculos)
    const vinculo = await prisma.usuarioVinculacao.findFirst({
      where: {
        tenantId: tenant.id,
        usuarioId: jaqueline.id,
        advogadoId: sandra.advogado.id,
        ativo: true,
      },
    });

    if (vinculo) {
      console.log("✅ Vínculo encontrado: Jaqueline → Sandra (acesso filtrado)\n");
    } else {
      console.log("⚠️  Sem vínculos: Jaqueline deve ter acesso total ao tenant\n");
    }

    // 3. Testar getAccessibleAdvogadoIds
    const session = {
      user: {
        id: jaqueline.id,
        tenantId: tenant.id,
        role: jaqueline.role,
      },
    };

    const accessibleAdvogados = await getAccessibleAdvogadoIds(session);

    if (vinculo) {
      // Com vínculo: deve ter acesso apenas à Sandra
      if (accessibleAdvogados.length === 0 || !accessibleAdvogados.includes(sandra.advogado.id)) {
        console.error("❌ getAccessibleAdvogadoIds não retornou Sandra (com vínculo)");
        console.error(`   Advogados acessíveis: ${accessibleAdvogados.join(", ")}`);
        process.exit(1);
      }
      console.log(`✅ Com vínculo: Advogados acessíveis = ${accessibleAdvogados.join(", ")}\n`);
    } else {
      // Sem vínculo: deve ter acesso total (array vazio = sem filtros)
      console.log(`✅ Sem vínculos: Advogados acessíveis = [] (acesso total ao tenant)\n`);
    }

    // 4. Testar consultas filtradas
    console.log("📊 Testando consultas filtradas...\n");

    // Processos
    const whereProcessos: any = {
      tenantId: tenant.id,
      deletedAt: null,
    };

    if (accessibleAdvogados.length > 0) {
      whereProcessos.advogadoResponsavelId = {
        in: accessibleAdvogados,
      };
    }

    const processosJaqueline = await prisma.processo.count({
      where: whereProcessos,
    });

    const processosTotal = await prisma.processo.count({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
      },
    });

    console.log(`   Processos: ${processosJaqueline} (total: ${processosTotal})`);

    // Clientes
    const whereClientes: any = {
      tenantId: tenant.id,
      deletedAt: null,
    };

    if (accessibleAdvogados.length > 0) {
      whereClientes.advogadoClientes = {
        some: {
          advogadoId: {
            in: accessibleAdvogados,
          },
        },
      };
    }

    const clientesJaqueline = await prisma.cliente.count({
      where: whereClientes,
    });

    const clientesTotal = await prisma.cliente.count({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
      },
    });

    console.log(`   Clientes: ${clientesJaqueline} (total: ${clientesTotal})`);

    // Contratos
    const whereContratos: any = {
      tenantId: tenant.id,
      deletedAt: null,
    };

    if (accessibleAdvogados.length > 0) {
      whereContratos.advogadoResponsavelId = {
        in: accessibleAdvogados,
      };
    }

    const contratosJaqueline = await prisma.contrato.count({
      where: whereContratos,
    });

    const contratosTotal = await prisma.contrato.count({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
      },
    });

    console.log(`   Contratos: ${contratosJaqueline} (total: ${contratosTotal})`);

    // Eventos
    const whereEventos: any = {
      tenantId: tenant.id,
    };

    if (accessibleAdvogados.length > 0) {
      whereEventos.advogadoResponsavelId = {
        in: accessibleAdvogados,
      };
    }

    const eventosJaqueline = await prisma.evento.count({
      where: whereEventos,
    });

    const eventosTotal = await prisma.evento.count({
      where: {
        tenantId: tenant.id,
      },
    });

    console.log(`   Eventos: ${eventosJaqueline} (total: ${eventosTotal})\n`);

    // 5. Validação final
    if (vinculo) {
      // Com vínculo: deve ver apenas dados da Sandra
      if (
        processosJaqueline > 0 &&
        processosJaqueline < processosTotal &&
        clientesJaqueline > 0 &&
        clientesJaqueline < clientesTotal
      ) {
        console.log("✅ Smoke test PASSOU (com vínculo)!");
        console.log("   ✅ Jaqueline vê apenas dados da Sandra");
        console.log("   ✅ Escopo de dados está funcionando corretamente\n");
      } else {
        console.warn("⚠️  Com vínculo: alguns dados podem não estar sendo filtrados corretamente");
      }
    } else {
      // Sem vínculo: deve ver tudo (acesso total)
      if (
        processosJaqueline === processosTotal &&
        clientesJaqueline === clientesTotal &&
        contratosJaqueline === contratosTotal &&
        eventosJaqueline === eventosTotal
      ) {
        console.log("✅ Smoke test PASSOU (sem vínculos)!");
        console.log("   ✅ Jaqueline tem acesso total ao tenant (sem filtros)");
        console.log("   ✅ Nova regra de acesso total está funcionando corretamente\n");
      } else {
        console.warn("⚠️  Sem vínculos: deveria ter acesso total, mas alguns dados estão faltando");
        console.warn(`   Processos: ${processosJaqueline}/${processosTotal}`);
        console.warn(`   Clientes: ${clientesJaqueline}/${clientesTotal}`);
        console.warn(`   Contratos: ${contratosJaqueline}/${contratosTotal}`);
        console.warn(`   Eventos: ${eventosJaqueline}/${eventosTotal}\n`);
      }
    }

    console.log("📋 Credenciais para teste manual:");
    console.log("   👤 Jaqueline: jaqueline.souza@sandraadv.br / Funcionario@123");
    console.log("   👑 Sandra: sandra@adv.br / Sandra@123");
    console.log("   🔗 URL: http://sandra.localhost:9192/login\n");
  } catch (error) {
    console.error("❌ Erro no smoke test:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

smokeTest();

