import { useMemo } from "react";
import { useUserPermissions } from "./use-user-permissions";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
}

export function useProfileNavigation() {
  const { userRole, permissions, isAdmin, isAdvogado, isSecretaria, isFinanceiro, isCliente } = useUserPermissions();

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [];

    // Dashboard - Todos os perfis
    items.push({
      label: "Painel",
      href: "/dashboard",
      icon: "LayoutDashboard",
      description: "Visão geral do sistema",
    });

    // Processos - Baseado em permissões
    if (permissions.canViewAllProcesses || permissions.canViewAllClients) {
      items.push({
        label: "Processos",
        href: "/processos",
        icon: "FileText",
        description: isCliente ? "Meu processo" : "Gestão de processos",
      });
    }

    // Documentos - Baseado em permissões
    if (permissions.canViewAllDocuments) {
      items.push({
        label: "Documentos",
        href: "/documentos",
        icon: "FolderOpen",
        description: isCliente ? "Meus documentos" : "Gestão de documentos",
      });
    }

    // Agenda - Baseado em permissões
    if (permissions.canViewAllEvents || permissions.canCreateEvents) {
      items.push({
        label: "Agenda",
        href: "/agenda",
        icon: "Calendar",
        description: isCliente ? "Eventos do meu processo" : "Gestão de agenda",
      });
    }

    // Financeiro - Baseado em permissões
    if (permissions.canViewFinancialData) {
      items.push({
        label: "Financeiro",
        href: "/financeiro",
        icon: "DollarSign",
        description: isCliente ? "Minhas faturas" : isAdvogado ? "Minhas comissões" : "Gestão financeira",
      });
    }

    // Juízes - Baseado em permissões
    if (permissions.canViewJudgesDatabase) {
      items.push({
        label: "Juízes",
        href: "/juizes",
        icon: "Scale",
        description: isCliente ? "Informações sobre juízes" : "Base de dados de juízes",
      });
    }

    // Relatórios - Apenas para perfis com acesso
    if (permissions.canViewReports) {
      items.push({
        label: "Relatórios",
        href: "/relatorios",
        icon: "BarChart3",
        description: "Relatórios e analytics",
      });
    }

    // Equipe - Apenas para ADMIN
    if (permissions.canManageTeam) {
      items.push({
        label: "Equipe",
        href: "/equipe",
        icon: "Users",
        description: "Gestão de usuários e permissões",
      });
    }

    // Configurações - Apenas para ADMIN
    if (permissions.canManageOfficeSettings) {
      items.push({
        label: "Configurações",
        href: "/configuracoes",
        icon: "Settings",
        description: "Configurações do escritório",
      });
    }

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

    // Configurações do Escritório - Apenas ADMIN
    if (permissions.canManageOfficeSettings) {
      items.push({
        label: "Configurações do Escritório",
        href: "/configuracoes",
        icon: "Settings",
        description: "Configurações gerais do escritório",
      });
    }

    // Suporte - Todos os perfis
    items.push({
      label: "Suporte",
      href: "/help",
      icon: "HelpCircle",
      description: "Central de ajuda e suporte",
    });

    return items;
  }, [permissions]);

  const getDashboardTitle = () => {
    switch (userRole) {
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
    const userName = "Usuário"; // TODO: Pegar do session
    const timeOfDay = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

    switch (userRole) {
      case "ADMIN":
        return `${timeOfDay}, ${userName}! Aqui está o resumo do seu escritório.`;
      case "ADVOGADO":
        return `${timeOfDay}, Dr(a). ${userName}! Veja sua agenda e clientes.`;
      case "SECRETARIA":
        return `${timeOfDay}, ${userName}! Organize a agenda do escritório.`;
      case "FINANCEIRO":
        return `${timeOfDay}, ${userName}! Controle as finanças do escritório.`;
      case "CLIENTE":
        return `${timeOfDay}, ${userName}! Acompanhe seu processo.`;
      default:
        return `${timeOfDay}, ${userName}!`;
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
