import "dotenv/config";

import { autoDetectModulesCore } from "../lib/module-detection-core";
import { clearModuleMapCache } from "../app/lib/module-map";
import { clearModuleMapCacheEdge } from "../app/lib/module-map-edge";

async function run() {
  try {
    console.log("🔍 Executando detecção automática de módulos...");
    const result = await autoDetectModulesCore();

    // Limpar caches em memória para refletir imediatamente
    clearModuleMapCache();
    clearModuleMapCacheEdge();

    console.log(
      [
        "✅ Detecção concluída:",
        `+${result.created} criados`,
        `${result.updated} atualizados`,
        `${result.removed} removidos`,
        `${result.total} total | ${result.totalRoutes} rotas`,
      ].join(" "),
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar detecção automática de módulos:", error);
    process.exit(1);
  }
}

run();
