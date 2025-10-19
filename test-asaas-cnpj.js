const API_KEY =
  process.env.ASAAS_API_KEY || "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmM2ZDVjYzM2LWM1YjctNDFiZC1hYzlhLWM4YTQ1MDU3NjYxNTo6JGFhY2hfMjAxZmRmYWMtZTA0Mi00Nzg1LTkyNjYtYzBmZDZkNmM0OGJm";

async function testAsaasWithCNPJ() {
  try {
    // Testar com os dados exatos do checkout
    const customerData = {
      name: "MARIA CLEUNICE D DOS SANTOS",
      email: "robsonnonatoiii@gmail.com",
      phone: "71999011037",
      cpfCnpj: "64470560000192",
      address: "RUA PADRE FLORENTINO",
      addressNumber: "120",
      complement: "",
      province: "CENTRO",
      city: "BOM REPOUSO",
      state: "MG",
      postalCode: "37610000",
    };

    console.log("📤 Testando com dados do checkout:", customerData);

    const response = await fetch("https://sandbox.asaas.com/api/v3/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: API_KEY,
      },
      body: JSON.stringify(customerData),
    });

    console.log("📥 Status:", response.status);
    const responseText = await response.text();
    console.log("📥 Response:", responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log("✅ Cliente criado com sucesso:", data.id);

      // Agora testar criação de pagamento
      const paymentData = {
        customer: data.id,
        billingType: "CREDIT_CARD",
        value: 299,
        dueDate: "2025-10-26",
        description: "Teste de pagamento",
        externalReference: "teste_checkout",
        creditCard: {
          holderName: "ROBSON J S N FILHO",
          number: "4000000000000002",
          expiryMonth: "09",
          expiryYear: "2029",
          ccv: "930",
        },
      };

      console.log("\n💳 Testando pagamento...");
      const paymentResponse = await fetch("https://sandbox.asaas.com/api/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: API_KEY,
        },
        body: JSON.stringify(paymentData),
      });

      console.log("💳 Status do pagamento:", paymentResponse.status);
      const paymentResponseText = await paymentResponse.text();
      console.log("💳 Response do pagamento:", paymentResponseText);
    } else {
      console.log("❌ Erro na criação do cliente");
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testAsaasWithCNPJ();
