const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const tiposGlobais = [
  // INICIAIS
  { nome: "Petição Inicial", categoria: "INICIAL", ordem: 1 },
  { nome: "Mandado de Segurança", categoria: "INICIAL", ordem: 2 },
  { nome: "Habeas Corpus", categoria: "INICIAL", ordem: 3 },
  { nome: "Ação Cautelar", categoria: "INICIAL", ordem: 4 },

  // RESPOSTAS
  { nome: "Contestação", categoria: "RESPOSTA", ordem: 10 },
  { nome: "Réplica", categoria: "RESPOSTA", ordem: 11 },
  { nome: "Reconvenção", categoria: "RESPOSTA", ordem: 12 },
  { nome: "Impugnação", categoria: "RESPOSTA", ordem: 13 },

  // RECURSOS
  { nome: "Recurso de Apelação", categoria: "RECURSO", ordem: 20 },
  { nome: "Recurso Especial", categoria: "RECURSO", ordem: 21 },
  { nome: "Recurso Extraordinário", categoria: "RECURSO", ordem: 22 },
  { nome: "Agravo de Instrumento", categoria: "RECURSO", ordem: 23 },
  { nome: "Embargos de Declaração", categoria: "RECURSO", ordem: 24 },

  // EXECUÇÃO
  { nome: "Cumprimento de Sentença", categoria: "EXECUCAO", ordem: 30 },
  { nome: "Execução de Título Extrajudicial", categoria: "EXECUCAO", ordem: 31 },
  { nome: "Embargos à Execução", categoria: "EXECUCAO", ordem: 32 },
  { nome: "Exceção de Pré-executividade", categoria: "EXECUCAO", ordem: 33 },

  // URGENTES
  { nome: "Tutela Antecipada", categoria: "URGENTE", ordem: 40 },
  { nome: "Pedido de Liminar", categoria: "URGENTE", ordem: 41 },
  { nome: "Tutela Cautelar", categoria: "URGENTE", ordem: 42 },

  // PROCEDIMENTOS
  { nome: "Manifestação", categoria: "PROCEDIMENTO", ordem: 50 },
  { nome: "Memorial", categoria: "PROCEDIMENTO", ordem: 51 },
  { nome: "Alegações Finais", categoria: "PROCEDIMENTO", ordem: 52 },
  { nome: "Contrarrazões", categoria: "PROCEDIMENTO", ordem: 53 },

  // OUTROS
  { nome: "Aditamento", categoria: "OUTROS", ordem: 60 },
  { nome: "Desistência", categoria: "OUTROS", ordem: 61 },
  { nome: "Renúncia", categoria: "OUTROS", ordem: 62 },
  { nome: "Acordo/Transação", categoria: "OUTROS", ordem: 63 },
  { nome: "Outros", categoria: "OUTROS", ordem: 99 },
];

async function seedTiposPeticao() {
  console.log("🏛️  Seed: Tipos de Petição GLOBAIS");

  // Criar tipos GLOBAIS (tenantId = NULL)
  // Estes tipos estarão disponíveis para TODOS os tenants
  for (const tipoData of tiposGlobais) {
    const tipoExistente = await prisma.tipoPeticao.findFirst({
      where: {
        tenantId: null,
        nome: tipoData.nome,
      },
    });

    if (!tipoExistente) {
      await prisma.tipoPeticao.create({
        data: {
          tenantId: null, // ← NULL = global para todos
          nome: tipoData.nome,
          categoria: tipoData.categoria,
          ordem: tipoData.ordem,
          global: true,
          ativo: true,
        },
      });
      console.log(`  ✓ Tipo GLOBAL criado: ${tipoData.nome}`);
    }
  }

  console.log("✅ 29 Tipos GLOBAIS criados! Disponíveis para todos os tenants.\n");
}

module.exports = { seedTiposPeticao };
