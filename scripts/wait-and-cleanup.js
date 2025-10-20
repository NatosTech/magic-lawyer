#!/usr/bin/env node

/**
 * Script que aguarda o ngrok estar disponível e então roda a limpeza do Asaas
 */

const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Aguarda o ngrok estar disponível
 */
async function waitForNgrok(maxAttempts = 30) {
  console.log("⏳ Aguardando ngrok estar disponível...");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get("http://localhost:4040/api/tunnels", { timeout: 2000 });
      const tunnels = response.data.tunnels;

      if (tunnels && tunnels.length > 0) {
        const httpsTunnel = tunnels.find((t) => t.proto === "https");
        if (httpsTunnel) {
          console.log(`✅ Ngrok disponível: ${httpsTunnel.public_url}`);
          return httpsTunnel.public_url;
        }
      }
    } catch (error) {
      // Ngrok ainda não está disponível
    }

    console.log(`⏳ Tentativa ${i + 1}/${maxAttempts} - aguardando ngrok...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("⚠️  Ngrok não ficou disponível no tempo esperado");
  return null;
}

/**
 * Executa a limpeza do Asaas
 */
async function runCleanup() {
  try {
    console.log("🧹 Executando limpeza do Asaas...");
    const { stdout, stderr } = await execAsync("node scripts/cleanup-asaas.js");

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    console.error("❌ Erro ao executar limpeza:", error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log("🚀 Iniciando aguardo e limpeza automática...\n");

    // 1. Aguardar ngrok estar disponível
    const ngrokUrl = await waitForNgrok();

    if (ngrokUrl) {
      // 2. Aguardar um pouco mais para garantir que tudo está estável
      console.log("⏳ Aguardando estabilização...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. Executar limpeza
      await runCleanup();
    } else {
      console.log("⚠️  Pulando limpeza - ngrok não disponível");
    }

    console.log("\n🎉 Processo concluído!");
  } catch (error) {
    console.error("❌ Erro durante o processo:", error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
