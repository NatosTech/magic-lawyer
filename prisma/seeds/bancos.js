const { PrismaClient } = require("../../app/generated/prisma");

const prisma = new PrismaClient();

const bancosBrasil = [
  // BANCOS TRADICIONAIS
  { codigo: "001", nome: "Banco do Brasil", nomeCompleto: "Banco do Brasil S.A.", ispb: "00000000", site: "https://www.bb.com.br", telefone: "4004-0001" },
  { codigo: "104", nome: "Caixa", nomeCompleto: "Caixa Econômica Federal", ispb: "00360305", site: "https://www.caixa.gov.br", telefone: "0800 726 0104" },
  { codigo: "341", nome: "Itaú", nomeCompleto: "Itaú Unibanco S.A.", ispb: "60746948", site: "https://www.itau.com.br", telefone: "0800 728 0728" },
  { codigo: "033", nome: "Santander", nomeCompleto: "Banco Santander (Brasil) S.A.", ispb: "90400888", site: "https://www.santander.com.br", telefone: "0800 762 7777" },
  { codigo: "237", nome: "Bradesco", nomeCompleto: "Banco Bradesco S.A.", ispb: "60746948", site: "https://www.bradesco.com.br", telefone: "0800 704 8383" },

  // BANCOS DIGITAIS E FINTECHS
  { codigo: "260", nome: "Nu Bank", nomeCompleto: "Nu Pagamentos S.A.", ispb: "18236120", site: "https://nubank.com.br", telefone: "0800 591 2117" },
  { codigo: "077", nome: "Inter", nomeCompleto: "Banco Inter S.A.", ispb: "00416968", site: "https://www.bancointer.com.br", telefone: "0800 940 0007" },
  { codigo: "336", nome: "C6 Bank", nomeCompleto: "Banco C6 S.A.", ispb: "31872495", site: "https://www.c6bank.com.br", telefone: "0800 606 0106" },
  { codigo: "212", nome: "Original", nomeCompleto: "Banco Original S.A.", ispb: "92702067", site: "https://www.original.com.br", telefone: "0800 775 0808" },
  { codigo: "290", nome: "PagSeguro", nomeCompleto: "Pagseguro Internet S.A.", ispb: "08561701", site: "https://pagseguro.uol.com.br", telefone: "0800 721 6515" },

  // COOPERATIVAS
  { codigo: "756", nome: "Sicoob", nomeCompleto: "Sistema de Cooperativas de Crédito do Brasil", ispb: "02038232", site: "https://www.sicoob.com.br", telefone: "0800 724 2220" },
  { codigo: "748", nome: "Sicredi", nomeCompleto: "Sistema de Crédito Cooperativo", ispb: "01181521", site: "https://www.sicredi.com.br", telefone: "0800 724 7220" },
  { codigo: "422", nome: "Banrisul", nomeCompleto: "Banco do Estado do Rio Grande do Sul S.A.", ispb: "92702067", site: "https://www.banrisul.com.br", telefone: "0800 051 9999" },

  // BANCOS REGIONAIS
  { codigo: "070", nome: "BRB", nomeCompleto: "Banco de Brasília S.A.", ispb: "00000208", site: "https://www.brb.com.br", telefone: "0800 644 0700" },
  { codigo: "041", nome: "Banrisul", nomeCompleto: "Banco do Estado do Rio Grande do Sul S.A.", ispb: "92702067", site: "https://www.banrisul.com.br", telefone: "0800 051 9999" },
  { codigo: "047", nome: "Banestes", nomeCompleto: "Banco do Estado do Espírito Santo S.A.", ispb: "28127603", site: "https://www.banestes.com.br", telefone: "0800 283 8383" },

  // BANCOS ESPECIALIZADOS
  { codigo: "422", nome: "Banco Safra", nomeCompleto: "Banco Safra S.A.", ispb: "58160789", site: "https://www.safra.com.br", telefone: "0800 772 3272" },
  { codigo: "633", nome: "Banco Rendimento", nomeCompleto: "Banco Rendimento S.A.", ispb: "68900810", site: "https://www.bancorendimento.com.br", telefone: "0800 644 6333" },
  { codigo: "623", nome: "Banco Pan", nomeCompleto: "Banco Pan S.A.", ispb: "59285411", site: "https://www.bancopan.com.br", telefone: "0800 721 1521" },
  { codigo: "633", nome: "Banco Triângulo", nomeCompleto: "Banco Triângulo S.A.", ispb: "68900810", site: "https://www.bancotriangulo.com.br", telefone: "0800 644 6333" },

  // BANCOS DE INVESTIMENTO
  { codigo: "184", nome: "Banco Itaú BBA", nomeCompleto: "Banco Itaú BBA S.A.", ispb: "01023570", site: "https://www.itaubba.com", telefone: "0800 728 0728" },
  { codigo: "394", nome: "Banco Bradesco BBI", nomeCompleto: "Banco Bradesco BBI S.A.", ispb: "07207996", site: "https://www.bradescobbi.com.br", telefone: "0800 704 8383" },

  // BANCOS ESTRANGEIROS
  { codigo: "655", nome: "Banco Votorantim", nomeCompleto: "Banco Votorantim S.A.", ispb: "59588111", site: "https://www.bancovotorantim.com.br", telefone: "0800 770 6555" },
  { codigo: "041", nome: "Banco do Nordeste", nomeCompleto: "Banco do Nordeste do Brasil S.A.", ispb: "07237373", site: "https://www.bnb.gov.br", telefone: "0800 728 3030" },
  { codigo: "422", nome: "Banco Safra", nomeCompleto: "Banco Safra S.A.", ispb: "58160789", site: "https://www.safra.com.br", telefone: "0800 772 3272" },

  // BANCOS DIGITAIS ADICIONAIS
  { codigo: "323", nome: "Mercado Pago", nomeCompleto: "Mercado Pago - Conta do Mercado Livre", ispb: "10573521", site: "https://www.mercadopago.com.br", telefone: "0800 775 0808" },
  { codigo: "085", nome: "Ailos", nomeCompleto: "Cooperativa Central de Crédito Ailos", ispb: "05442029", site: "https://www.ailos.com.br", telefone: "0800 724 2220" },
  { codigo: "085", nome: "Unicred", nomeCompleto: "Unicred Central do Rio Grande do Sul", ispb: "05442029", site: "https://www.unicred.com.br", telefone: "0800 724 2220" },

  // BANCOS PEQUENOS E REGIONAIS
  { codigo: "070", nome: "BRB", nomeCompleto: "Banco de Brasília S.A.", ispb: "00000208", site: "https://www.brb.com.br", telefone: "0800 644 0700" },
  { codigo: "756", nome: "Sicoob", nomeCompleto: "Sistema de Cooperativas de Crédito do Brasil", ispb: "02038232", site: "https://www.sicoob.com.br", telefone: "0800 724 2220" },
  { codigo: "748", nome: "Sicredi", nomeCompleto: "Sistema de Crédito Cooperativo", ispb: "01181521", site: "https://www.sicredi.com.br", telefone: "0800 724 7220" },

  // BANCOS DE PAGAMENTO
  { codigo: "290", nome: "PagSeguro", nomeCompleto: "Pagseguro Internet S.A.", ispb: "08561701", site: "https://pagseguro.uol.com.br", telefone: "0800 721 6515" },
  { codigo: "323", nome: "Mercado Pago", nomeCompleto: "Mercado Pago - Conta do Mercado Livre", ispb: "10573521", site: "https://www.mercadopago.com.br", telefone: "0800 775 0808" },
  { codigo: "260", nome: "Nu Bank", nomeCompleto: "Nu Pagamentos S.A.", ispb: "18236120", site: "https://nubank.com.br", telefone: "0800 591 2117" },

  // BANCOS COMERCIAIS ADICIONAIS
  { codigo: "422", nome: "Banco Safra", nomeCompleto: "Banco Safra S.A.", ispb: "58160789", site: "https://www.safra.com.br", telefone: "0800 772 3272" },
  { codigo: "633", nome: "Banco Rendimento", nomeCompleto: "Banco Rendimento S.A.", ispb: "68900810", site: "https://www.bancorendimento.com.br", telefone: "0800 644 6333" },
  { codigo: "623", nome: "Banco Pan", nomeCompleto: "Banco Pan S.A.", ispb: "59285411", site: "https://www.bancopan.com.br", telefone: "0800 721 1521" },
];

async function seedBancos() {
  console.log("🏦 Iniciando seed de bancos...");

  try {
    const bancosCriados = await prisma.banco.createMany({
      data: bancosBrasil,
      skipDuplicates: true,
    });

    console.log(`✅ ${bancosCriados.count} novos bancos inseridos ou atualizados!`);

    // Listar alguns bancos criados
    const bancosListados = await prisma.banco.findMany({
      take: 5,
      select: {
        codigo: true,
        nome: true,
        nomeCompleto: true,
      },
    });

    console.log("📋 Primeiros bancos criados:");
    bancosListados.forEach((banco) => {
      console.log(`   ${banco.codigo} - ${banco.nome} (${banco.nomeCompleto})`);
    });
  } catch (error) {
    console.error("❌ Erro ao criar bancos:", error);
    throw error;
  }
}

module.exports = { seedBancos };
