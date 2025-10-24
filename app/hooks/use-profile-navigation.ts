import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

import { useUserPermissions } from "./use-user-permissions";

import { moduleRequiredForRoute } from "@/app/lib/module-map";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
  isAccordion?: boolean;
  section?: string;
  requiredModules?: string[];
}

function filterNavigation(
  items: NavigationItem[],
  hasModule: (href: string, required?: string[]) => boolean,
): NavigationItem[] {
  const filtered: NavigationItem[] = [];

  for (const item of items) {
    const children = item.children
      ? filterNavigation(item.children, hasModule)
      : undefined;

    const allowed = hasModule(item.href, item.requiredModules);

    if (item.isAccordion) {
      if (children && children.length > 0) {
        if (allowed) {
          filtered.push({ ...item, children });
        } else {
          filtered.push(...children);
        }
        continue;
      }

      if (allowed) {
        filtered.push({ ...item, children: undefined });
      }

      continue;
    }

    if (!allowed) {
      continue;
    }

    filtered.push({ ...item, children });
  }

  return filtered;
}

export function useProfileNavigation() {
  const { data: session } = useSession();
  const {
    userRole,
    permissions,
    isAdvogado,
    isSecretaria,
    isFinanceiro,
    isCliente,
  } = useUserPermissions();

  const grantedModules = (session?.user as any)?.tenantModules as
    | string[]
    | undefined;

  const hasModuleAccess = useCallback(
    (href: string, required?: string[]) => {
      if (required && required.length > 0) {
        if (!grantedModules || grantedModules.includes("*")) {
          return true;
        }

        if (required.some((module) => grantedModules.includes(module))) {
          return true;
        }
      }

      if (!grantedModules || grantedModules.includes("*")) {
        return true;
      }

      const inferredModule = moduleRequiredForRoute(href);

      if (!inferredModule) {
        return true;
      }

      return grantedModules.includes(inferredModule);
    },
    [grantedModules],
  );

  const navigationItems = useMemo(() => {
    const items: NavigationItem[] = [];

    items.push({
      label: "Painel",
      href: "/dashboard",
      icon: "LayoutDashboard",
      description: "Visão geral do sistema",
      section: "Visão Geral",
      requiredModules: ["dashboard-geral"],
    });

    if (permissions.canViewReports) {
      items.push({
        label: "Relatórios",
        href: "/relatorios",
        icon: "BarChart3",
        description: "Relatórios e analytics",
        section: "Visão Geral",
        requiredModules: ["relatorios-basicos", "analytics-avancado"],
      });
    }

    if (permissions.canViewAllClients) {
      items.push({
        label: "Clientes",
        href: "/clientes",
        icon: "Users",
        description: "Gestão da base de clientes",
        section: "Gestão de Pessoas",
        requiredModules: ["clientes-gerais"],
      });
    }

    if (permissions.canManageTeam) {
      items.push({
        label: "Advogados",
        href: "/advogados",
        icon: "Users",
        description: "Gestão de advogados do escritório",
        section: "Gestão de Pessoas",
        requiredModules: ["gestao-equipe"],
      });

      items.push({
        label: "Equipe",
        href: "/equipe",
        icon: "Users",
        description: "Gestão de usuários e permissões",
        section: "Gestão de Pessoas",
        requiredModules: ["gestao-equipe"],
      });
    }

    if (permissions.canViewAllProcesses || permissions.canViewAllClients) {
      items.push({
        label: "Processos",
        href: "/processos",
        icon: "FileText",
        description: isCliente ? "Meu processo" : "Gestão de processos",
        section: "Atividades Jurídicas",
        requiredModules: ["processos-gerais"],
      });
    }

    if (
      !isCliente &&
      (permissions.canViewAllProcesses || isAdvogado || isSecretaria)
    ) {
      items.push({
        label: "Petições",
        href: "/peticoes",
        icon: "FileText",
        description: "Gestão de petições processuais",
        isAccordion: true,
        section: "Atividades Jurídicas",
        requiredModules: ["documentos-gerais"],
        children: [
          {
            label: "Petições",
            href: "/peticoes",
            icon: "FileText",
            description: "Gestão de petições processuais",
            requiredModules: ["documentos-gerais"],
          },
          {
            label: "Modelos",
            href: "/modelos-peticao",
            icon: "FileTemplate",
            description: "Modelos de petição",
            requiredModules: ["documentos-gerais", "modelos-documentos"],
          },
        ],
      });
    }

    if (
      !isCliente &&
      (permissions.canViewAllProcesses || isAdvogado || isSecretaria)
    ) {
      items.push({
        label: "Andamentos",
        href: "/andamentos",
        icon: "Activity",
        description: "Timeline de movimentações processuais",
        section: "Atividades Jurídicas",
        requiredModules: ["processos-gerais"],
      });
    }

    if (permissions.canViewAllClients || isAdvogado) {
      items.push({
        label: "Procurações",
        href: "/procuracoes",
        icon: "Shield",
        description: "Gestão de procurações e poderes",
        isAccordion: true,
        section: "Atividades Jurídicas",
        requiredModules: ["procuracoes"],
        children: [
          {
            label: "Procurações",
            href: "/procuracoes",
            icon: "Shield",
            description: "Gestão de procurações ativas",
            requiredModules: ["procuracoes"],
          },
          {
            label: "Modelos",
            href: "/modelos-procuracao",
            icon: "FileTemplate",
            description: "Modelos de procuração",
            requiredModules: ["modelos-documentos"],
          },
        ],
      });
    }

    if (permissions.canViewAllDocuments || isCliente) {
      if (isCliente) {
        items.push({
          label: "Contratos",
          href: "/contratos",
          icon: "FileSignature",
          description: "Meus contratos com advogados",
          section: "Atividades Jurídicas",
          requiredModules: ["contratos-honorarios"],
        });
      } else {
        items.push({
          label: "Contratos",
          href: "/contratos",
          icon: "FileSignature",
          description: "Gestão de contratos e modelos",
          isAccordion: true,
          section: "Atividades Jurídicas",
          requiredModules: ["contratos-honorarios"],
          children: [
            {
              label: "Contratos",
              href: "/contratos",
              icon: "FileSignature",
              description: "Gestão de contratos ativos",
              requiredModules: ["contratos-honorarios"],
            },
            {
              label: "Modelos",
              href: "/contratos/modelos",
              icon: "FileTemplate",
              description: "Modelos de contratos reutilizáveis",
              requiredModules: ["modelos-documentos"],
            },
          ],
        });
      }
    }

    if (permissions.canViewAllDocuments || isCliente) {
      items.push({
        label: "Documentos",
        href: "/documentos",
        icon: "FolderOpen",
        description: isCliente ? "Meus documentos" : "Gestão de documentos",
        section: "Atividades Jurídicas",
        requiredModules: ["documentos-gerais"],
      });
    }

    if (
      !isCliente &&
      (permissions.canViewAllProcesses || permissions.canManageOfficeSettings)
    ) {
      items.push({
        label: "Causas",
        href: "/causas",
        icon: "Scale",
        description: "Catálogo de assuntos processuais",
        section: "Atividades Jurídicas",
        requiredModules: ["processos-avancados"],
      });
    }

    if (permissions.canViewJudgesDatabase) {
      items.push({
        label: "Juízes",
        href: "/juizes",
        icon: "Scale",
        description: isCliente
          ? "Informações sobre juízes"
          : "Base de dados de juízes",
        section: "Atividades Jurídicas",
        requiredModules: ["base-juizes"],
      });
    }

    if (
      permissions.canViewAllEvents ||
      permissions.canCreateEvents ||
      permissions.canViewClientEvents
    ) {
      items.push({
        label: "Agenda",
        href: "/agenda",
        icon: "Calendar",
        description: isCliente ? "Eventos do meu processo" : "Gestão de agenda",
        section: "Operacional",
        requiredModules: ["agenda-compromissos"],
      });
    }

    if (!isCliente) {
      items.push({
        label: "Tarefas",
        href: "/tarefas",
        icon: "CheckSquare",
        description: "Gestão de tarefas e atividades",
        section: "Operacional",
        isAccordion: true,
        requiredModules: ["tarefas-kanban"],
        children: [
          {
            label: "Kanban",
            href: "/tarefas/kanban",
            icon: "LayoutBoard",
            description: "Visualização em quadros",
            requiredModules: ["tarefas-kanban"],
          },
          {
            label: "Lista",
            href: "/tarefas",
            icon: "List",
            description: "Visualização em lista",
            requiredModules: ["tarefas-kanban"],
          },
        ],
      });
    }

    if (
      !isCliente &&
      (permissions.canViewAllProcesses || isSecretaria || isAdvogado)
    ) {
      items.push({
        label: "Diligências",
        href: "/diligencias",
        icon: "Clipboard",
        description: "Controle de diligências internas e externas",
        section: "Operacional",
        requiredModules: ["processos-avancados"],
      });
    }

    if (
      !isCliente &&
      (permissions.canManageOfficeSettings || isSecretaria || isAdvogado)
    ) {
      items.push({
        label: "Regimes de prazo",
        href: "/regimes-prazo",
        icon: "Clock",
        description: "Regras de contagem aplicadas aos prazos",
        section: "Operacional",
        requiredModules: ["processos-avancados"],
      });
    }

    if (permissions.canViewFinancialData || isFinanceiro) {
      items.push({
        label: "Financeiro",
        href: "/dashboard/financeiro",
        icon: "DollarSign",
        description: isCliente
          ? "Minhas faturas"
          : isAdvogado
            ? "Minhas comissões"
            : "Gestão financeira",
        isAccordion: true,
        section: "Operacional",
        requiredModules: ["financeiro-completo"],
        children: [
          {
            label: "Dashboard",
            href: "/dashboard/financeiro",
            icon: "BarChart3",
            description: "Visão geral financeira",
            requiredModules: ["financeiro-completo"],
          },
          {
            label: "Honorários",
            href: "/honorarios",
            icon: "DollarSign",
            description: "Honorários contratuais",
            requiredModules: ["financeiro-completo"],
          },
          {
            label: "Parcelas",
            href: "/parcelas",
            icon: "Receipt",
            description: "Parcelas de contrato",
            requiredModules: ["financeiro-completo"],
          },
          {
            label: "Faturas",
            href: "/financeiro",
            icon: "Receipt",
            description: "Gestão de faturas",
            requiredModules: ["financeiro-completo"],
          },
          {
            label: "Recibos",
            href: "/financeiro/recibos",
            icon: "FileText",
            description: "Comprovantes e recibos pagos",
            requiredModules: ["financeiro-completo"],
          },
        ],
      });
    }

    items.push({
      label: "Suporte",
      href: "/help",
      icon: "HelpCircle",
      description: "Central de ajuda e suporte",
      section: "Administração",
      requiredModules: ["notificacoes-avancadas"],
    });

    if (permissions.canManageOfficeSettings) {
      items.push({
        label: "Configurações",
        href: "/configuracoes",
        icon: "Settings",
        description: "Configurações gerais do escritório",
        section: "Administração",
        isAccordion: true,
        requiredModules: ["gestao-equipe", "integracoes-externas"],
        children: [
          {
            label: "Configurações do escritório",
            href: "/configuracoes",
            icon: "Settings",
            description: "Configurações gerais",
            requiredModules: ["gestao-equipe"],
          },
          {
            label: "Categorias de Tarefa",
            href: "/configuracoes/categorias-tarefa",
            icon: "Tag",
            description: "Categorias para organizar tarefas",
            requiredModules: ["gestao-equipe"],
          },
          {
            label: "Áreas de Processo",
            href: "/configuracoes/areas-processo",
            icon: "Scale",
            description: "Áreas de atuação processual",
            requiredModules: ["gestao-equipe"],
          },
          {
            label: "Tipos de Contrato",
            href: "/configuracoes/tipos-contrato",
            icon: "FileSignature",
            description: "Tipos de contrato do escritório",
            requiredModules: ["gestao-equipe", "modelos-documentos"],
          },
          {
            label: "Tribunais",
            href: "/configuracoes/tribunais",
            icon: "Building",
            description: "Cadastro de tribunais e órgãos",
            requiredModules: ["gestao-equipe"],
          },
          {
            label: "Feriados",
            href: "/configuracoes/feriados",
            icon: "Calendar",
            description: "Gestão de feriados e dias não úteis",
            requiredModules: ["gestao-equipe"],
          },
          {
            label: "Tipos de Petição",
            href: "/configuracoes/tipos-peticao",
            icon: "FileText",
            description: "Configurar tipos de petição",
            requiredModules: ["documentos-gerais"],
          },
          {
            label: "Dados Bancários",
            href: "/dados-bancarios",
            icon: "CreditCard",
            description: "Dados bancários de usuários e clientes",
            requiredModules: ["financeiro-completo"],
          },
        ],
      });
    }

    return filterNavigation(items, hasModuleAccess);
  }, [
    hasModuleAccess,
    permissions,
    isCliente,
    isAdvogado,
    isSecretaria,
    isFinanceiro,
  ]);

  const secondaryNavigationItems = useMemo(() => {
    const items: NavigationItem[] = [];

    items.push({
      label: "Meu Perfil",
      href: "/usuario/perfil/editar",
      icon: "User",
      description: "Editar informações pessoais",
    });

    if (permissions.canManageTeam) {
      items.push({
        label: "Equipe & Permissões",
        href: "/equipe",
        icon: "Users",
        description: "Gerenciar usuários e permissões",
        requiredModules: ["gestao-equipe"],
      });
    }

    if (isCliente || permissions.canViewFinancialData) {
      items.push({
        label: "Financeiro",
        href: "/financeiro",
        icon: "Wallet",
        description: "Central financeiro",
        requiredModules: ["financeiro-completo"],
      });
    }

    items.push({
      label: "Sair",
      href: "#logout",
      icon: "LogOut",
      description: "Encerrar sessão",
    });

    return filterNavigation(items, hasModuleAccess);
  }, [hasModuleAccess, permissions, isCliente]);

  const getDashboardTitle = useCallback(() => {
    switch (userRole) {
      case "SUPER_ADMIN":
        return "Painel Global";
      case "ADMIN":
        return "Painel Administrativo";
      case "ADVOGADO":
        return "Meu Escritório";
      case "SECRETARIA":
        return "Central Operacional";
      case "FINANCEIRO":
        return "Central Financeira";
      case "CLIENTE":
        return "Meu Processo";
      default:
        return "Painel";
    }
  }, [userRole]);

  const getDashboardDescription = useCallback(() => {
    switch (userRole) {
      case "SUPER_ADMIN":
        return "Visão unificada de tenants, receita e saúde da operação";
      case "ADMIN":
        return "Visão completa do escritório, relatórios e gestão";
      case "ADVOGADO":
        return "Seus clientes, processos e agenda pessoal";
      case "SECRETARIA":
        return "Organização da agenda e controle de prazos";
      case "FINANCEIRO":
        return "Gestão financeira e controle de pagamentos";
      case "CLIENTE":
        return "Acompanhamento do seu processo e pagamentos";
      default:
        return "Visão geral do sistema";
    }
  }, [userRole]);

  const getWelcomeMessage = useCallback(() => {
    const userName = session?.user?.name || "Usuário";

    switch (userRole) {
      case "SUPER_ADMIN":
        return `Olá, ${userName}! Aqui está a fotografia global dos tenants.`;
      case "ADMIN":
        return `Bem-vindo, ${userName}! Seu escritório está pronto para avançar.`;
      case "ADVOGADO":
        return `Olá, Dr(a). ${userName}! Vamos acelerar seus resultados jurídicos.`;
      case "SECRETARIA":
        return `Olá, ${userName}! Controle cada prazo com precisão.`;
      case "FINANCEIRO":
        return `Boas-vindas, ${userName}! A performance financeira está nas suas mãos.`;
      case "CLIENTE":
        return `Olá, ${userName}! Acompanhe seu processo com transparência.`;
      default:
        return `Olá, ${userName}!`;
    }
  }, [session?.user?.name, userRole]);

  return {
    navigationItems,
    secondaryNavigationItems,
    getDashboardTitle,
    getDashboardDescription,
    getWelcomeMessage,
    userRole,
  };
}
