export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  "dashboard-geral": ["/dashboard"],
  "processos-gerais": ["/processos", "/andamentos"],
  "clientes-gerais": ["/clientes"],
  "agenda-compromissos": ["/agenda"],
  "documentos-gerais": [
    "/documentos",
    "/peticoes",
    "/peticoes/modelos",
    "/modelos-peticao",
    "/documentos-upload",
  ],
  "modelos-documentos": [
    "/peticoes/modelos",
    "/modelos-peticao",
    "/modelos-procuracao",
    "/contratos/modelos",
    "/documentos/modelos",
  ],
  "tarefas-kanban": ["/tarefas", "/tarefas/kanban"],
  "financeiro-completo": [
    "/financeiro",
    "/dashboard/financeiro",
    "/honorarios",
    "/parcelas",
    "/financeiro/recibos",
    "/financeiro/comissoes",
  ],
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
  if (!modules || modules.includes("*")) {
    return true;
  }

  const normalizedPath = pathname.replace(/\/$/, "");

  for (const [module, routes] of Object.entries(MODULE_ROUTE_MAP)) {
    if (!modules.includes(module)) {
      continue;
    }

    if (routes.some((route) => normalizedPath.startsWith(route))) {
      return true;
    }
  }

  // Se a rota não está mapeada, liberamos por padrão para evitar bloqueios acidentais
  return true;
}

export function moduleRequiredForRoute(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/$/, "");

  for (const [module, routes] of Object.entries(MODULE_ROUTE_MAP)) {
    if (routes.some((route) => normalizedPath.startsWith(route))) {
      return module;
    }
  }

  return null;
}
