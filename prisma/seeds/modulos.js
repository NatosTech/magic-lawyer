// MÓDULOS AGORA SÃO DETECTADOS AUTOMATICAMENTE DO CÓDIGO
// Este arquivo não cria mais módulos "fantasma"
// A detecção automática em app/actions/auto-detect-modules.ts
// escaneia app/(protected)/ e cria apenas módulos reais

const MODULOS_BASE = [];

module.exports = async function seedModulos(prisma) {
  console.log("🧩 Módulos agora são detectados automaticamente do código!");
  console.log("   • Use a interface /admin/modulos para detectar módulos reais");
  console.log("   • A detecção automática escaneia app/(protected)/");
  console.log("   • Remove módulos 'fantasma' que não existem no código");
  console.log("✅ Seed de módulos desabilitado - usando detecção automática!");
};

module.exports.MODULOS_BASE = MODULOS_BASE;
