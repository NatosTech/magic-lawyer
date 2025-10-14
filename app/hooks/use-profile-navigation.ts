import { useMemo } from "react";
import { useSession } from "next-auth/react";

import { useUserPermissions } from "./use-user-permissions";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
  isAccordion?: boolean;
  section?: string; // Nova propriedade para agrupamento
}

export function useProfileNavigation() {
  const { data: session } = useSession();
  const { userRole, permissions, isAdmin, isAdvogado, isSecretaria, isFinanceiro, isCliente } = useUserPermissions();

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [];

    // ===== SEÇÃO: VISÃO GERAL =====
    items.push({
      label: "Painel",
      href: "/dashboard",
      icon: "LayoutDashboard",
      description: "Visão geral do sistema",
      section: "Visão Geral",
    });

    // Relatórios - Apenas para perfis com acesso
    if (permissions.canViewReports) {
      items.push({
        label: "Relatórios",
        href: "/relatorios",
        icon: "BarChart3",
        description: "Relatórios e analytics",
        section: "Visão Geral",
      });
    }

    // ===== SEÇÃO: GESTÃO DE PESSOAS =====
    // Clientes - Baseado em permissões
    if (permissions.canViewAllClients) {
      items.push({
        label: "Clientes",
        href: "/clientes",
        icon: "Users",
        description: "Gestão da base de clientes",
        section: "Gestão de Pessoas",
      });
    }

    // Advogados - Apenas para ADMIN
    if (permissions.canManageTeam) {
      items.push({
        label: "Advogados",
        href: "/advogados",
        icon: "Users",
        description: "Gestão de advogados do escritório",
        section: "Gestão de Pessoas",
      });
    }

    // Equipe - Apenas para ADMIN
    if (permissions.canManageTeam) {
      items.push({
        label: "Equipe",
        href: "/equipe",
        icon: "Users",
        description: "Gestão de usuários e permissões",
        section: "Gestão de Pessoas",
      });
    }

    // ===== SEÇÃO: ATIVIDADES JURÍDICAS =====
    // Processos - Baseado em permissões
    if (permissions.canViewAllProcesses || permissions.canViewAllClients) {
      items.push({
        label: "Processos",
        href: "/processos",
        icon: "FileText",
        description: isCliente ? "Meu processo" : "Gestão de processos",
        section: "Atividades Jurídicas",
      });
    }

    // Procurações - Baseado em permissões
    if (permissions.canViewAllClients || isAdvogado) {
      items.push({
        label: "Procurações",
        href: "/procuracoes",
        icon: "Shield",
        description: "Gestão de procurações e poderes",
        isAccordion: true,
        section: "Atividades Jurídicas",
        children: [
          {
            label: "Procurações",
            href: "/procuracoes",
            icon: "Shield",
            description: "Gestão de procurações ativas",
          },
          {
            label: "Modelos",
            href: "/modelos-procuracao",
            icon: "FileTemplate",
            description: "Modelos de procuração",
          },
        ],
      });
    }

    // Contratos - Baseado em permissões
    if (permissions.canViewAllDocuments || isCliente) {
      if (isCliente) {
        // Cliente vê apenas seus contratos (sem modelos)
        items.push({
          label: "Contratos",
          href: "/contratos",
          icon: "FileSignature",
          description: "Meus contratos com advogados",
          section: "Atividades Jurídicas",
        });
      } else {
        // Admin/Advogado vê accordion completo
        items.push({
          label: "Contratos",
          href: "/contratos",
          icon: "FileSignature",
          description: "Gestão de contratos e modelos",
          isAccordion: true,
          section: "Atividades Jurídicas",
          children: [
            {
              label: "Contratos",
              href: "/contratos",
              icon: "FileSignature",
              description: "Gestão de contratos ativos",
            },
            {
              label: "Modelos",
              href: "/contratos/modelos",
              icon: "FileTemplate",
              description: "Modelos de contratos reutilizáveis",
            },
          ],
        });
      }
    }

    // Documentos - Baseado em permissões
    if (permissions.canViewAllDocuments || isCliente) {
      items.push({
        label: "Documentos",
        href: "/documentos",
        icon: "FolderOpen",
        description: isCliente ? "Meus documentos" : "Gestão de documentos",
        section: "Atividades Jurídicas",
      });
    }

    if (!isCliente && (permissions.canViewAllProcesses || permissions.canManageOfficeSettings)) {
      items.push({
        label: "Causas",
        href: "/causas",
        icon: "Scale",
        description: "Catálogo de assuntos processuais",
        section: "Atividades Jurídicas",
      });
    }

    // Juízes - Baseado em permissões
    if (permissions.canViewJudgesDatabase) {
      items.push({
        label: "Juízes",
        href: "/juizes",
        icon: "Scale",
        description: isCliente ? "Informações sobre juízes" : "Base de dados de juízes",
        section: "Atividades Jurídicas",
      });
    }

    // ===== SEÇÃO: OPERACIONAL =====
    // Agenda - Baseado em permissões
    if (permissions.canViewAllEvents || permissions.canCreateEvents || permissions.canViewClientEvents) {
      items.push({
        label: "Agenda",
        href: "/agenda",
        icon: "Calendar",
        description: isCliente ? "Eventos do meu processo" : "Gestão de agenda",
        section: "Operacional",
      });
    }

    // Tarefas - Não cliente (com accordion para views)
    if (!isCliente) {
      items.push({
        label: "Tarefas",
        href: "/tarefas",
        icon: "CheckSquare",
        description: "Gestão de tarefas e atividades",
        section: "Operacional",
        isAccordion: true,
        children: [
          {
            label: "Kanban",
            href: "/tarefas/kanban",
            icon: "LayoutBoard",
            description: "Visualização em quadros",
          },
          {
            label: "Lista",
            href: "/tarefas",
            icon: "List",
            description: "Visualização em lista",
          },
        ],
      });
    }

    if (!isCliente && (permissions.canViewAllProcesses || isSecretaria || isAdvogado)) {
      items.push({
        label: "Diligências",
        href: "/diligencias",
        icon: "Clipboard",
        description: "Controle de diligências internas e externas",
        section: "Operacional",
      });
    }

    if (!isCliente && (permissions.canManageOfficeSettings || isSecretaria || isAdvogado)) {
      items.push({
        label: "Regimes de prazo",
        href: "/regimes-prazo",
        icon: "Clock",
        description: "Regras de contagem aplicadas aos prazos",
        section: "Operacional",
      });
    }

    // Financeiro - Baseado em permissões
    if (permissions.canViewFinancialData) {
      items.push({
        label: "Financeiro",
        href: "/financeiro",
        icon: "DollarSign",
        description: isCliente ? "Minhas faturas" : isAdvogado ? "Minhas comissões" : "Gestão financeira",
        section: "Operacional",
      });
    }

    // ===== SEÇÃO: ADMINISTRAÇÃO =====
    // Configurações - Apenas para ADMIN (removido daqui, vai para secondary)
    // if (permissions.canManageOfficeSettings) {
    //   items.push({
    //     label: "Configurações",
    //     href: "/configuracoes",
    //     icon: "Settings",
    //     description: "Configurações do escritório",
    //     section: "Administração",
    //   });
    // }

    return items;
  }, [permissions, userRole, isAdmin, isAdvogado, isSecretaria, isFinanceiro, isCliente]);

  const secondaryNavigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [];

    // Meu Perfil - Todos os perfis
    items.push({
      label: "Meu Perfil",
      href: "/usuario/perfil/editar",
      icon: "User",
      description: "Editar informações pessoais",
    });

    // Equipe & Permissões - Apenas ADMIN
    if (permissions.canManageTeam) {
      items.push({
        label: "Equipe & Permissões",
        href: "/equipe",
        icon: "Users",
        description: "Gerenciar usuários e permissões",
      });
    }

    // Configurações do Escritório - Apenas ADMIN (com accordion)
    if (permissions.canManageOfficeSettings) {
      items.push({
        label: "Configurações",
        href: "/configuracoes",
        icon: "Settings",
        description: "Configurações gerais do escritório",
        section: "Administração",
        isAccordion: true,
        children: [
          {
            label: "Configurações do escritório",
            href: "/configuracoes",
            icon: "Settings",
            description: "Configurações gerais",
          },
          {
            label: "Categorias de Tarefa",
            href: "/configuracoes/categorias-tarefa",
            icon: "Tag",
            description: "Categorias para organizar tarefas",
          },
          {
            label: "Áreas de Processo",
            href: "/configuracoes/areas-processo",
            icon: "Scale",
            description: "Áreas de atuação processual",
          },
          {
            label: "Tipos de Contrato",
            href: "/configuracoes/tipos-contrato",
            icon: "FileSignature",
            description: "Tipos de contrato do escritório",
          },
          {
            label: "Tribunais",
            href: "/configuracoes/tribunais",
            icon: "Building",
            description: "Cadastro de tribunais e órgãos",
          },
        ],
      });
    }

    // Suporte - Todos os perfis
    items.push({
      label: "Suporte",
      href: "/help",
      icon: "HelpCircle",
      description: "Central de ajuda e suporte",
      section: "Administração",
    });

    return items;
  }, [permissions]);

  const getDashboardTitle = () => {
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
  };

  const getDashboardDescription = () => {
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
  };

  const getWelcomeMessage = () => {
    const userName = session?.user?.name || "Usuário";

    switch (userRole) {
      case "SUPER_ADMIN":
        return `Olá, ${userName}! Aqui está a fotografia global dos tenants.`;
      case "ADMIN":
        return `Olá, ${userName}! Aqui está o resumo do seu escritório.`;
      case "ADVOGADO":
        return `Olá, Dr(a). ${userName}! Veja sua agenda e clientes.`;
      case "SECRETARIA":
        return `Olá, ${userName}! Organize a agenda do escritório.`;
      case "FINANCEIRO":
        return `Olá, ${userName}! Controle as finanças do escritório.`;
      case "CLIENTE":
        return `Olá, ${userName}! Acompanhe seu processo.`;
      default:
        return `Olá, ${userName}!`;
    }
  };

  return {
    navigationItems,
    secondaryNavigationItems,
    getDashboardTitle,
    getDashboardDescription,
    getWelcomeMessage,
    userRole,
    permissions,
  };
}
