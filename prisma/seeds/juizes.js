const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

const juizesData = [
  {
    nome: "João Silva",
    nomeCompleto: "Dr. João Carlos Silva",
    cpf: "123.456.789-00",
    email: "joao.silva@tjsp.gov.br",
    telefone: "(11) 99999-9999",
    endereco: "Rua da Justiça, 100",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01000-000",
    dataNascimento: new Date("1970-05-15"),
    dataPosse: new Date("2005-03-01"),
    status: "ATIVO",
    nivel: "JUIZ_TITULAR",
    especialidades: ["CIVIL", "EMPRESARIAL"],
    vara: "1ª Vara Cível",
    comarca: "São Paulo",
    biografia: "Juiz com mais de 15 anos de experiência em direito civil e empresarial. Especialista em contratos e obrigações.",
    formacao: "Doutor em Direito pela USP",
    experiencia: "15 anos na magistratura",
    premios: "Prêmio de Excelência Jurídica 2020",
    publicacoes: "Contratos no Direito Civil Moderno",
    foto: null,
    website: "https://joaosilva.tjsp.jus.br",
    linkedin: "https://linkedin.com/in/joaosilva",
    twitter: null,
    instagram: null,
    observacoes: "Tendência conservadora em questões contratuais",
    isPublico: true,
    isPremium: false,
    precoAcesso: null,
  },
  {
    nome: "Maria Santos",
    nomeCompleto: "Dra. Maria Fernanda Santos",
    cpf: "987.654.321-00",
    email: "maria.santos@tjrj.gov.br",
    telefone: "(21) 88888-8888",
    endereco: "Av. Rio Branco, 200",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    cep: "20000-000",
    dataNascimento: new Date("1968-08-22"),
    dataPosse: new Date("2003-01-15"),
    status: "ATIVO",
    nivel: "DESEMBARGADOR",
    especialidades: ["CRIMINAL", "ELETORAL"],
    vara: "2ª Câmara Criminal",
    comarca: "Rio de Janeiro",
    biografia: "Desembargadora especialista em direito criminal e eleitoral. Experiência em casos de alta complexidade.",
    formacao: "Mestre em Direito Penal pela UFRJ",
    experiencia: "18 anos na magistratura",
    premios: "Medalha de Mérito Judiciário 2019",
    publicacoes: "Direito Penal Contemporâneo",
    foto: null,
    website: "https://mariasantos.tjrj.jus.br",
    linkedin: "https://linkedin.com/in/mariasantos",
    twitter: "@maria_santos",
    instagram: null,
    observacoes: "Progressista em questões de direitos humanos",
    isPublico: false,
    isPremium: true,
    precoAcesso: 99.9,
  },
  {
    nome: "Pedro Oliveira",
    nomeCompleto: "Dr. Pedro Henrique Oliveira",
    cpf: "456.789.123-00",
    email: "pedro.oliveira@tjmg.gov.br",
    telefone: "(31) 77777-7777",
    endereco: "Rua da Liberdade, 300",
    cidade: "Belo Horizonte",
    estado: "MG",
    cep: "30000-000",
    dataNascimento: new Date("1975-12-10"),
    dataPosse: new Date("2010-06-01"),
    status: "ATIVO",
    nivel: "JUIZ_TITULAR",
    especialidades: ["FAMILIA", "CIVIL"],
    vara: "3ª Vara de Família",
    comarca: "Belo Horizonte",
    biografia: "Especialista em direito de família e sucessões. Mediadora certificada pelo CNJ.",
    formacao: "Especialista em Direito de Família pela UFMG",
    experiencia: "10 anos na magistratura",
    premios: null,
    publicacoes: "Mediação Familiar: Teoria e Prática",
    foto: null,
    website: null,
    linkedin: "https://linkedin.com/in/pedrooliveira",
    twitter: null,
    instagram: "@dr.pedro.oliveira",
    observacoes: "Foco em soluções consensuais",
    isPublico: true,
    isPremium: false,
    precoAcesso: null,
  },
  {
    nome: "Ana Costa",
    nomeCompleto: "Dra. Ana Beatriz Costa",
    cpf: "789.123.456-00",
    email: "ana.costa@tjrs.gov.br",
    telefone: "(51) 66666-6666",
    endereco: "Av. Borges de Medeiros, 400",
    cidade: "Porto Alegre",
    estado: "RS",
    cep: "40000-000",
    dataNascimento: new Date("1980-03-25"),
    dataPosse: new Date("2015-02-01"),
    status: "ATIVO",
    nivel: "JUIZ_SUBSTITUTO",
    especialidades: ["TRABALHISTA", "PREVIDENCIARIO"],
    vara: "1ª Vara do Trabalho",
    comarca: "Porto Alegre",
    biografia: "Juíza do Trabalho com especialização em direito previdenciário. Ativista pelos direitos trabalhistas.",
    formacao: "Especialista em Direito do Trabalho pela UFRGS",
    experiencia: "8 anos na magistratura",
    premios: "Prêmio de Inovação Jurídica 2021",
    publicacoes: "Direito do Trabalho na Era Digital",
    foto: null,
    website: null,
    linkedin: "https://linkedin.com/in/anacosta",
    twitter: "@ana_beatriz_costa",
    instagram: null,
    observacoes: "Progressista em questões trabalhistas",
    isPublico: true,
    isPremium: true,
    precoAcesso: 49.9,
  },
  {
    nome: "Carlos Mendes",
    nomeCompleto: "Dr. Carlos Eduardo Mendes",
    cpf: "321.654.987-00",
    email: "carlos.mendes@stf.gov.br",
    telefone: "(61) 55555-5555",
    endereco: "Praça dos Três Poderes, 1",
    cidade: "Brasília",
    estado: "DF",
    cep: "50000-000",
    dataNascimento: new Date("1965-07-18"),
    dataPosse: new Date("2000-01-01"),
    status: "ATIVO",
    nivel: "MINISTRO",
    especialidades: ["CONSTITUCIONAL", "ADMINISTRATIVO"],
    vara: "Supremo Tribunal Federal",
    comarca: "Brasília",
    biografia: "Ministro do STF com vasta experiência em direito constitucional e administrativo.",
    formacao: "Doutor em Direito Constitucional pela UnB",
    experiencia: "23 anos na magistratura",
    premios: "Medalha de Honra ao Mérito",
    publicacoes: "Constituição e Democracia",
    foto: null,
    website: "https://carlosmendes.stf.jus.br",
    linkedin: "https://linkedin.com/in/carlosmendes",
    twitter: "@carlos_mendes_stf",
    instagram: null,
    observacoes: "Moderado em questões constitucionais",
    isPublico: false,
    isPremium: true,
    precoAcesso: 199.9,
  },
];

async function seedJuizes(superAdminId, prisma) {
  try {
    console.log("🌱 Iniciando seed de juízes...");

    // Limpar dados existentes (opcional)
    await prisma.juiz.deleteMany({});
    console.log("🗑️  Dados antigos de juízes removidos");

    // Inserir novos dados
    for (const juizData of juizesData) {
      const juiz = await prisma.juiz.create({
        data: {
          ...juizData,
          superAdminId, // Controlado pelo Super Admin
        },
      });
      console.log(`✅ Juiz criado: ${juiz.nomeCompleto} (${juiz.comarca})`);
    }

    console.log(`🎉 Seed de juízes concluído! ${juizesData.length} juízes inseridos.`);
  } catch (error) {
    console.error("❌ Erro no seed de juízes:", error);
    throw error;
  }
}

module.exports = { seedJuizes };

// Se executado diretamente
if (require.main === module) {
  seedJuizes()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
