async function seedDadosFinanceiros(prisma) {
  console.log("\n💰 Criando dados financeiros de teste...\n");

  try {
    // Buscar tenants e planos existentes
    const tenants = await prisma.tenant.findMany({
      where: {
        slug: {
          not: "global",
        },
      },
    });

    const planos = await prisma.plano.findMany();

    if (tenants.length === 0 || planos.length === 0) {
      console.log("⚠️  Nenhum tenant ou plano encontrado. Pulando seed de dados financeiros.");
      return true;
    }

    // Criar assinaturas para os tenants
    for (const tenant of tenants) {
      const plano = planos[Math.floor(Math.random() * planos.length)];

      await prisma.tenantSubscription.upsert({
        where: {
          tenantId: tenant.id,
        },
        update: {},
        create: {
          tenantId: tenant.id,
          planoId: plano.id,
          status: "ATIVA",
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          renovaEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      console.log(`✅ Assinatura criada para ${tenant.name} - Plano: ${plano.nome}`);
    }

    // Criar faturas para os últimos 6 meses
    const assinaturas = await prisma.tenantSubscription.findMany({
      include: {
        tenant: true,
        plano: true,
      },
    });

    for (const assinatura of assinaturas) {
      // Criar 6 faturas (últimos 6 meses)
      for (let i = 0; i < 6; i++) {
        const dataFatura = new Date();
        dataFatura.setMonth(dataFatura.getMonth() - i);
        dataFatura.setDate(1); // Primeiro dia do mês

        const vencimento = new Date(dataFatura);
        vencimento.setDate(vencimento.getDate() + 7); // Vence em 7 dias

        const valorFatura = assinatura.plano?.valorMensal || 299.9;
        const numeroFatura = `FAT-${dataFatura.getFullYear()}-${String(dataFatura.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`;

        const fatura = await prisma.fatura.create({
          data: {
            tenantId: assinatura.tenantId,
            subscriptionId: assinatura.id,
            numero: numeroFatura,
            descricao: `Fatura mensal - ${assinatura.plano?.nome || "Plano"} - ${dataFatura.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
            valor: valorFatura,
            status: i < 4 ? "PAGA" : i === 4 ? "ABERTA" : "VENCIDA", // Últimas 4 pagas, 1 aberta, 1 vencida
            vencimento: vencimento,
            pagoEm: i < 4 ? new Date(dataFatura.getTime() + 3 * 24 * 60 * 60 * 1000) : null, // Pago 3 dias após vencimento
            comissaoAdvogado: 30.0,
            valorComissao: valorFatura * 0.3,
            tipoComissao: "HONORARIOS",
            periodoInicio: dataFatura,
            periodoFim: new Date(dataFatura.getFullYear(), dataFatura.getMonth() + 1, 0),
          },
        });

        // Criar pagamento se a fatura foi paga
        if (i < 4) {
          const metodos = ["Cartão de Crédito", "PIX", "Boleto", "Débito Automático"];
          const metodo = metodos[Math.floor(Math.random() * metodos.length)];

          await prisma.pagamento.create({
            data: {
              tenantId: assinatura.tenantId,
              faturaId: fatura.id,
              valor: valorFatura,
              status: "PAGO",
              metodo: metodo,
              confirmadoEm: fatura.pagoEm,
              comissaoAdvogado: 30.0,
              valorComissao: valorFatura * 0.3,
              pagoParaAdvogado: i < 2, // Primeiras 2 comissões já pagas
            },
          });
        }

        console.log(`✅ Fatura criada: ${numeroFatura} - ${assinatura.tenant.name} - R$ ${valorFatura}`);
      }
    }

    // Criar comissões de advogados
    const advogados = await prisma.advogado.findMany({
      take: 3, // Apenas alguns advogados para teste
    });

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        status: "PAGO",
      },
      take: 5, // Apenas alguns pagamentos
    });

    for (const pagamento of pagamentos) {
      for (const advogado of advogados) {
        await prisma.pagamentoComissao.upsert({
          where: {
            pagamentoId_advogadoId: {
              pagamentoId: pagamento.id,
              advogadoId: advogado.id,
            },
          },
          update: {},
          create: {
            tenantId: pagamento.tenantId,
            pagamentoId: pagamento.id,
            advogadoId: advogado.id,
            valorComissao: pagamento.valorComissao / advogados.length, // Dividir comissão entre advogados
            percentualComissao: 30.0 / advogados.length,
            tipoComissao: "HONORARIOS",
            status: pagamento.pagoParaAdvogado ? "PAGO" : "PENDENTE",
            dataPagamento: pagamento.pagoParaAdvogado ? pagamento.confirmadoEm : null,
          },
        });
      }
    }

    console.log(`\n✅ Dados financeiros criados com sucesso!`);
    console.log(`   📊 ${assinaturas.length} assinaturas`);
    console.log(`   📄 ${assinaturas.length * 6} faturas (6 meses)`);
    console.log(`   💳 ${assinaturas.length * 4} pagamentos confirmados`);
    console.log(`   ⚖️ ${pagamentos.length * advogados.length} comissões de advogados`);

    return true;
  } catch (error) {
    console.error("❌ Erro ao criar dados financeiros:", error);
    throw error;
  }
}

module.exports = { seedDadosFinanceiros };
