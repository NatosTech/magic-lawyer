// ==================== EDGE RUNTIME MODULE MAP ====================
// Versão simplificada para Edge Runtime (middleware)
// Não usa Prisma - apenas funções básicas

// Cache simples para Edge Runtime
let moduleMapCache: Record<string, string[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Mapa estático básico para fallback
const FALLBACK_MODULE_MAP: Record<string, string[]> = {
  advogados: ["/advogados", "/advogados/novo", "/advogados/[id]"],
  clientes: ["/clientes", "/clientes/novo", "/clientes/[id]"],
  dashboard: ["/dashboard"],
  equipe: ["/equipe", "/equipe/novo", "/equipe/[id]"],
  processos: ["/processos", "/processos/novo", "/processos/[id]"],
  relatorios: ["/relatorios", "/relatorios/gerar"],
  agenda: ["/agenda", "/agenda/novo", "/agenda/[id]"],
  andamentos: ["/andamentos", "/andamentos/novo"],
  diligencias: ["/diligencias", "/diligencias/nova"],
  documentos: ["/documentos", "/documentos/upload"],
  tarefas: ["/tarefas", "/tarefas/nova"],
  contratos: ["/contratos", "/contratos/novo", "/contratos/[id]"],
  "dados-bancarios": ["/dados-bancarios", "/dados-bancarios/novo"],
  financeiro: ["/financeiro", "/financeiro/dashboard"],
  honorarios: ["/honorarios", "/honorarios/calcular"],
  parcelas: ["/parcelas", "/parcelas/nova"],
  "modelos-peticao": ["/modelos-peticao", "/modelos-peticao/novo"],
  "modelos-procuracao": ["/modelos-procuracao", "/modelos-procuracao/novo"],
  peticoes: ["/peticoes", "/peticoes/nova"],
  procuracoes: ["/procuracoes", "/procuracoes/nova"],
  causas: ["/causas", "/causas/nova"],
  juizes: ["/juizes", "/juizes/novo"],
  "regimes-prazo": ["/regimes-prazo", "/regimes-prazo/novo"],
  configuracoes: ["/configuracoes"],
  help: ["/help", "/help/faq"],
  usuario: ["/usuario", "/usuario/perfil"],
};

export function getModuleRouteMapEdge(): Record<string, string[]> {
  const now = Date.now();

  // Verificar se o cache ainda é válido
  if (moduleMapCache && now - cacheTimestamp < CACHE_DURATION) {
    return moduleMapCache;
  }

  // No Edge Runtime, usar fallback estático
  // O cache será atualizado via API calls
  moduleMapCache = FALLBACK_MODULE_MAP;
  cacheTimestamp = now;

  return moduleMapCache;
}

export function getDefaultModulesEdge(): string[] {
  const moduleMap = getModuleRouteMapEdge();
  return Object.keys(moduleMap);
}

export function isRouteAllowedByModulesEdge(pathname: string, modules?: string[]) {
  if (!modules || modules.includes("*")) {
    return true;
  }

  const normalizedPath = pathname.replace(/\/$/, "");

  const requiredModule = moduleRequiredForRouteEdge(normalizedPath);

  if (!requiredModule) {
    return true;
  }

  return modules.includes(requiredModule);
}

export function moduleRequiredForRouteEdge(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/$/, "");

  const moduleMap = getModuleRouteMapEdge();

  for (const [module, routes] of Object.entries(moduleMap)) {
    const matches = routes.some((route) => normalizedPath.startsWith(route));
    if (matches) {
      return module;
    }
  }

  return null;
}

// Função para limpar o cache (útil após atualizações)
export function clearModuleMapCacheEdge(): void {
  moduleMapCache = null;
  cacheTimestamp = 0;
}
