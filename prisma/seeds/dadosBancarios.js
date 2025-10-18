// Seed para criar dados bancários aleatórios para advogados e clientes

const bancos = [
  { codigo: "001", nome: "Banco do Brasil S.A." },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "341", nome: "Itaú Unibanco S.A." },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A." },
  { codigo: "237", nome: "Banco Bradesco S.A." },
  { codigo: "756", nome: "Sicoob" },
  { codigo: "422", nome: "Banco Safra S.A." },
  { codigo: "260", nome: "Nu Pagamentos S.A." },
  { codigo: "077", nome: "Banco Inter S.A." },
  { codigo: "336", nome: "Banco C6 S.A." },
];

const tiposConta = ["PESSOA_FISICA", "PESSOA_JURIDICA"];
const tiposContaBancaria = ["CORRENTE", "POUPANCA", "SALARIO", "INVESTIMENTO"];
const tiposChavePix = ["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATORIA"];

// Função para gerar agência aleatória
function gerarAgencia() {
  return Math.floor(Math.random() * 9000 + 1000).toString();
}

// Função para gerar conta aleatória
function gerarConta() {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}

// Função para gerar chave PIX aleatória
function gerarChavePix(tipo, documento) {
  switch (tipo) {
    case "CPF":
      return documento;
    case "CNPJ":
      return documento;
    case "EMAIL":
      return `pix${Math.random().toString(36).substring(2, 8)}@exemplo.com`;
    case "TELEFONE":
      return `+55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
    case "ALEATORIA":
      return `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    default:
      return documento;
  }
}

// Função para gerar CPF aleatório
function gerarCPF() {
  const cpf = Math.floor(Math.random() * 900000000 + 100000000).toString();
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Função para gerar CNPJ aleatório
function gerarCNPJ() {
  const cnpj = Math.floor(Math.random() * 90000000000000 + 10000000000000).toString();
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Função para gerar telefone aleatório
function gerarTelefone() {
  const ddd = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "95"];
  const dddAleatorio = ddd[Math.floor(Math.random() * ddd.length)];
  const numero = Math.floor(Math.random() * 900000000 + 100000000);
  return `+55${dddAleatorio}${numero}`;
}

// Função para gerar email aleatório
function gerarEmail(nome) {
  const dominios = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"];
  const dominio = dominios[Math.floor(Math.random() * dominios.length)];
  const nomeLimpo = nome.toLowerCase().replace(/\s+/g, ".");
  return `${nomeLimpo}@${dominio}`;
}

async function seedDadosBancarios(prisma) {
  console.log("🏦 Iniciando seed de dados bancários...");

  try {
    // Buscar todos os advogados e clientes
    const advogados = await prisma.advogado.findMany({
      include: {
        usuario: true,
        tenant: true,
      },
    });

    const clientes = await prisma.cliente.findMany({
      include: {
        tenant: true,
      },
    });

    console.log(`📊 Encontrados ${advogados.length} advogados e ${clientes.length} clientes`);

    // Criar dados bancários para advogados
    for (const advogado of advogados) {
      const banco = bancos[Math.floor(Math.random() * bancos.length)];
      const tipoConta = tiposConta[Math.floor(Math.random() * tiposConta.length)];
      const tipoContaBancaria = tiposContaBancaria[Math.floor(Math.random() * tiposContaBancaria.length)];
      const tipoChavePix = tiposChavePix[Math.floor(Math.random() * tiposChavePix.length)];

      const documento = advogado.usuario.cpf || gerarCPF();
      const chavePix = gerarChavePix(tipoChavePix, documento);
      const telefone = gerarTelefone();
      const email = gerarEmail(advogado.usuario.firstName + " " + advogado.usuario.lastName);

      const dadosBancarios = await prisma.dadosBancarios.create({
        data: {
          agencia: gerarAgencia(),
          conta: gerarConta(),
          tipoConta,
          tipoContaBancaria,
          titularNome: `${advogado.usuario.firstName} ${advogado.usuario.lastName}`,
          titularDocumento: documento,
          titularEmail: email,
          titularTelefone: telefone,
          chavePix,
          tipoChavePix,
          ativo: true,
          principal: Math.random() > 0.7, // 30% chance de ser conta principal
          usuario: {
            connect: { id: advogado.usuarioId },
          },
          tenant: {
            connect: { id: advogado.tenantId },
          },
          banco: {
            connect: { codigo: banco.codigo },
          },
        },
      });

      console.log(`✅ Dados bancários criados para advogado: ${advogado.usuario.firstName} ${advogado.usuario.lastName} - ${banco.nome}`);
    }

    // Criar dados bancários para clientes
    for (const cliente of clientes) {
      const banco = bancos[Math.floor(Math.random() * bancos.length)];
      const tipoConta = tiposConta[Math.floor(Math.random() * tiposConta.length)];
      const tipoContaBancaria = tiposContaBancaria[Math.floor(Math.random() * tiposContaBancaria.length)];
      const tipoChavePix = tiposChavePix[Math.floor(Math.random() * tiposChavePix.length)];

      const documento = cliente.cpf || gerarCPF();
      const chavePix = gerarChavePix(tipoChavePix, documento);
      const telefone = gerarTelefone();
      const email = gerarEmail(cliente.nome);

      const dadosBancarios = await prisma.dadosBancarios.create({
        data: {
          agencia: gerarAgencia(),
          conta: gerarConta(),
          tipoConta,
          tipoContaBancaria,
          titularNome: cliente.nome,
          titularDocumento: documento,
          titularEmail: email,
          titularTelefone: telefone,
          chavePix,
          tipoChavePix,
          ativo: true,
          principal: Math.random() > 0.8, // 20% chance de ser conta principal
          cliente: {
            connect: { id: cliente.id },
          },
          tenant: {
            connect: { id: cliente.tenantId },
          },
          banco: {
            connect: { codigo: banco.codigo },
          },
        },
      });

      console.log(`✅ Dados bancários criados para cliente: ${cliente.nome} - ${banco.nome}`);
    }

    // Criar dados bancários para os próprios escritórios (tenants)
    const tenants = await prisma.tenant.findMany({
      where: {
        slug: {
          not: "global",
        },
      },
    });

    for (const tenant of tenants) {
      const banco = bancos[Math.floor(Math.random() * bancos.length)];
      const tipoConta = "PESSOA_JURIDICA"; // Escritórios são pessoa jurídica
      const tipoContaBancaria = "CORRENTE"; // Escritórios geralmente usam conta corrente
      const tipoChavePix = "CNPJ";

      const cnpj = gerarCNPJ();
      const chavePix = cnpj;
      const telefone = gerarTelefone();
      const email = `contato@${tenant.slug}.com.br`;

      const dadosBancarios = await prisma.dadosBancarios.create({
        data: {
          agencia: gerarAgencia(),
          conta: gerarConta(),
          tipoConta,
          tipoContaBancaria,
          titularNome: tenant.name,
          titularDocumento: cnpj,
          titularEmail: email,
          titularTelefone: telefone,
          chavePix,
          tipoChavePix,
          ativo: true,
          principal: true, // Conta do escritório sempre é principal
          tenant: {
            connect: { id: tenant.id },
          },
          banco: {
            connect: { codigo: banco.codigo },
          },
        },
      });

      console.log(`✅ Dados bancários criados para escritório: ${tenant.name} - ${banco.nome}`);
    }

    console.log("🎉 Seed de dados bancários concluído com sucesso!");
    console.log(`📊 Total de contas criadas: ${advogados.length + clientes.length + tenants.length}`);
  } catch (error) {
    console.error("❌ Erro ao criar dados bancários:", error);
    throw error;
  }
}

module.exports = { seedDadosBancarios };
