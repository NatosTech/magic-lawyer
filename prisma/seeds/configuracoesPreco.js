async function seedConfiguracoesPreco(superAdminId, prisma) {
  console.log("\n⚙️ Criando configurações de preço padrão...\n");

  try {
    // Configurações padrão
    const configuracoesData = [
      // Configurações do Sistema
      {
        chave: "taxa_processamento_cartao",
        valor: "3.49",
        tipo: "DECIMAL",
        descricao: "Taxa de processamento para pagamentos com cartão (%)",
        categoria: "SISTEMA",
        superAdminId,
      },
      {
        chave: "taxa_processamento_boleto",
        valor: "2.49",
        tipo: "DECIMAL",
        descricao: "Taxa de processamento para pagamentos com boleto (%)",
        categoria: "SISTEMA",
        superAdminId,
      },
      {
        chave: "taxa_processamento_pix",
        valor: "1.49",
        tipo: "DECIMAL",
        descricao: "Taxa de processamento para pagamentos com PIX (%)",
        categoria: "SISTEMA",
        superAdminId,
      },
      {
        chave: "desconto_pagamento_anual",
        valor: "16.67",
        tipo: "DECIMAL",
        descricao: "Desconto para pagamento anual (%) - equivale a 2 meses grátis",
        categoria: "SISTEMA",
        superAdminId,
      },

      // Configurações de Juízes
      {
        chave: "preco_base_consulta_juiz",
        valor: "29.90",
        tipo: "DECIMAL",
        descricao: "Preço base para consulta de juiz individual",
        categoria: "JUIZES",
        superAdminId,
      },
      {
        chave: "preco_base_download_juiz",
        valor: "49.90",
        tipo: "DECIMAL",
        descricao: "Preço base para download de dados de juiz",
        categoria: "JUIZES",
        superAdminId,
      },
      {
        chave: "preco_base_analise_juiz",
        valor: "99.90",
        tipo: "DECIMAL",
        descricao: "Preço base para análise completa de juiz",
        categoria: "JUIZES",
        superAdminId,
      },
      {
        chave: "multiplicador_juiz_premium",
        valor: "2.0",
        tipo: "DECIMAL",
        descricao: "Multiplicador de preço para juízes premium",
        categoria: "JUIZES",
        superAdminId,
      },

      // Configurações de Pacotes
      {
        chave: "trial_periodo_dias",
        valor: "14",
        tipo: "INTEGER",
        descricao: "Período de teste gratuito em dias",
        categoria: "PACOTES",
        superAdminId,
      },
      {
        chave: "cobranca_automatica_ativa",
        valor: "true",
        tipo: "BOOLEAN",
        descricao: "Se a cobrança automática está ativa",
        categoria: "PACOTES",
        superAdminId,
      },
      {
        chave: "tolerancia_vencimento_dias",
        valor: "7",
        tipo: "INTEGER",
        descricao: "Tolerância para vencimento em dias",
        categoria: "PACOTES",
        superAdminId,
      },

      // Configurações de Taxas
      {
        chave: "taxa_setup_enterprise",
        valor: "500.00",
        tipo: "DECIMAL",
        descricao: "Taxa de setup para pacote Enterprise",
        categoria: "TAXAS",
        superAdminId,
      },
      {
        chave: "taxa_migracao_dados",
        valor: "200.00",
        tipo: "DECIMAL",
        descricao: "Taxa para migração de dados",
        categoria: "TAXAS",
        superAdminId,
      },
      {
        chave: "taxa_treinamento_personalizado",
        valor: "150.00",
        tipo: "DECIMAL",
        descricao: "Taxa por hora de treinamento personalizado",
        categoria: "TAXAS",
        superAdminId,
      },
    ];

    // Criar configurações
    for (const configData of configuracoesData) {
      const config = await prisma.configuracaoPreco.upsert({
        where: {
          chave: configData.chave,
        },
        update: {
          ...configData,
          updatedAt: new Date(),
        },
        create: configData,
      });

      console.log(`✅ Configuração criada: ${config.chave} = ${config.valor} (${config.categoria})`);
    }

    console.log(`\n✅ ${configuracoesData.length} configurações de preço criadas com sucesso!`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao criar configurações de preço:", error);
    throw error;
  }
}

module.exports = { seedConfiguracoesPreco };
