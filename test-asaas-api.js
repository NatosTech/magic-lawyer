const API_KEY =
  process.env.ASAAS_API_KEY || "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmM2ZDVjYzM2LWM1YjctNDFiZC1hYzlhLWM4YTQ1MDU3NjYxNTo6JGFhY2hfMjAxZmRmYWMtZTA0Mi00Nzg1LTkyNjYtYzBmZDZkNmM0OGJm";

console.log("🔍 Testando API do Asaas...");
console.log("API Key:", API_KEY.slice(0, 20) + "...");
console.log("Environment: sandbox");

async function testAsaasAPI() {
  try {
    // Testar criação de cliente
    const customerData = {
      name: "Teste API",
      email: "teste@exemplo.com",
      cpfCnpj: "11144477735", // CPF válido para teste
    };

    console.log("\n📤 Enviando dados do cliente:", customerData);

    const response = await fetch("https://sandbox.asaas.com/api/v3/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: API_KEY,
      },
      body: JSON.stringify(customerData),
    });

    console.log("📥 Status:", response.status);
    console.log("📥 Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📥 Response:", responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log("✅ Cliente criado com sucesso:", data.id);
    } else {
      console.log("❌ Erro na criação do cliente");
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testAsaasAPI();
