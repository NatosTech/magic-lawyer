export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  "dashboard-geral": ["/dashboard"],
  "processos-gerais": ["/processos", "/andamentos"],
  "clientes-gerais": ["/clientes"],
  "agenda-compromissos": ["/agenda"],
  "documentos-gerais": ["/documentos", "/peticoes", "/peticoes/modelos", "/modelos-peticao", "/documentos-upload"],
  "modelos-documentos": ["/peticoes/modelos", "/modelos-peticao", "/modelos-procuracao", "/contratos/modelos", "/documentos/modelos"],
  "tarefas-kanban": ["/tarefas", "/tarefas/kanban"],
  "financeiro-completo": ["/financeiro", "/dashboard/financeiro", "/honorarios", "/parcelas", "/financeiro/recibos", "/financeiro/comissoes"],
  "gestao-equipe": ["/equipe", "/advogados"],
  "relatorios-basicos": ["/relatorios"],
  "contratos-honorarios": ["/contratos"],
  procuracoes: ["/procuracoes"],
  "processos-avancados": ["/causas", "/diligencias", "/regimes-prazo"],
  "base-juizes": ["/juizes"],
  "comissoes-advogados": ["/financeiro/comissoes"],
  "notificacoes-avancadas": ["/help"],
  "integracoes-externas": ["/integracoes"],
  "analytics-avancado": ["/relatorios/analytics"],
};

export const DEFAULT_MODULES = Object.keys(MODULE_ROUTE_MAP);

export function isRouteAllowedByModules(pathname: string, modules?: string[]) {
  console.log("[module-map] Verificando acesso à rota:", {
    pathname,
    modules,
    hasModules: !!modules,
    hasWildcard: modules?.includes("*"),
  });

  if (!modules || modules.includes("*")) {
    console.log("[module-map] Acesso liberado - sem módulos ou wildcard");
    return true;
  }

  const normalizedPath = pathname.replace(/\/$/, "");

  // Verificar se a rota está mapeada para algum módulo
  const requiredModule = moduleRequiredForRoute(normalizedPath);

  console.log("[module-map] Módulo necessário para rota:", {
    pathname: normalizedPath,
    requiredModule,
  });

  // Se a rota não está mapeada para nenhum módulo, liberar acesso
  if (!requiredModule) {
    console.log("[module-map] Rota não mapeada - acesso liberado");
    return true;
  }

  // Se a rota está mapeada, verificar se o usuário tem o módulo necessário
  const hasModule = modules.includes(requiredModule);
  console.log("[module-map] Verificação final:", {
    requiredModule,
    hasModule,
    modules,
  });

  return hasModule;
}

export function moduleRequiredForRoute(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/$/, "");

  console.log("[module-map] Buscando módulo para rota:", {
    pathname,
    normalizedPath,
  });

  for (const [module, routes] of Object.entries(MODULE_ROUTE_MAP)) {
    const matches = routes.some((route) => normalizedPath.startsWith(route));
    console.log("[module-map] Verificando módulo:", {
      module,
      routes,
      matches,
    });

    if (matches) {
      console.log("[module-map] Módulo encontrado:", module);
      return module;
    }
  }

  console.log("[module-map] Nenhum módulo encontrado para rota:", normalizedPath);
  return null;
}
