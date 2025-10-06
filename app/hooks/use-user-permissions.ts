import { useSession } from "next-auth/react";
import { useMemo } from "react";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ADVOGADO" | "SECRETARIA" | "FINANCEIRO" | "CLIENTE";

export interface UserPermissions {
  canViewAllProcesses: boolean;
  canViewAllClients: boolean;
  canViewAllEvents: boolean;
  canViewClientEvents: boolean; // Nova permissão para clientes verem eventos dos seus processos
  canViewFinancialData: boolean;
  canManageTeam: boolean;
  canManageOfficeSettings: boolean;
  canCreateEvents: boolean;
  canEditAllEvents: boolean;
  canViewReports: boolean;
  canManageContracts: boolean;
  canViewAllDocuments: boolean;
  canManageUsers: boolean;
  canViewJudgesDatabase: boolean;
  canManageJudgesDatabase: boolean;
  canCreateJudgeProfiles: boolean;
  canEditJudgeProfiles: boolean;
  canDeleteJudgeProfiles: boolean;
  canViewPremiumJudges: boolean;
}

export function useUserPermissions() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const userPermissions = (session?.user as any)?.permissions as string[] | undefined;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const permissions = useMemo<UserPermissions>(() => {
    // SUPER_ADMIN tem acesso total
    if (isSuperAdmin) {
      return {
        canViewAllProcesses: true,
        canViewAllClients: true,
        canViewAllEvents: true,
        canViewClientEvents: true,
        canViewFinancialData: true,
        canManageTeam: true,
        canManageOfficeSettings: true,
        canCreateEvents: true,
        canEditAllEvents: true,
        canViewReports: true,
        canManageContracts: true,
        canViewAllDocuments: true,
        canManageUsers: true,
        canViewJudgesDatabase: true,
        canManageJudgesDatabase: true,
        canCreateJudgeProfiles: true,
        canEditJudgeProfiles: true,
        canDeleteJudgeProfiles: true,
        canViewPremiumJudges: true,
      };
    }

    // ADMIN (Escritório) - Acesso total ao escritório
    if (userRole === "ADMIN") {
      return {
        canViewAllProcesses: true,
        canViewAllClients: true,
        canViewAllEvents: true,
        canViewClientEvents: true,
        canViewFinancialData: true,
        canManageTeam: true,
        canManageOfficeSettings: true,
        canCreateEvents: true,
        canEditAllEvents: true,
        canViewReports: true,
        canManageContracts: true,
        canViewAllDocuments: true,
        canManageUsers: true,
        canViewJudgesDatabase: true,
        canManageJudgesDatabase: true,
        canCreateJudgeProfiles: true,
        canEditJudgeProfiles: true,
        canDeleteJudgeProfiles: true,
        canViewPremiumJudges: true,
      };
    }

    // ADVOGADO - Acesso aos seus clientes e processos
    if (userRole === "ADVOGADO") {
      return {
        canViewAllProcesses: true, // Vê seus processos (filtrados no backend)
        canViewAllClients: true, // Vê seus clientes (filtrados no backend)
        canViewAllEvents: true, // Vê sua agenda (filtrados no backend)
        canViewClientEvents: false, // Não é cliente
        canViewFinancialData: true, // Vê suas comissões
        canManageTeam: false,
        canManageOfficeSettings: false,
        canCreateEvents: true,
        canEditAllEvents: true, // Pode editar os eventos da sua agenda
        canViewReports: true, // Relatórios dos seus processos
        canManageContracts: true, // Gerencia contratos dos seus clientes
        canViewAllDocuments: true, // Vê documentos dos seus clientes (filtrados no backend)
        canManageUsers: false,
        canViewJudgesDatabase: true,
        canManageJudgesDatabase: true,
        canCreateJudgeProfiles: true,
        canEditJudgeProfiles: true,
        canDeleteJudgeProfiles: false,
        canViewPremiumJudges: true,
      };
    }

    // SECRETARIA - Acesso operacional
    if (userRole === "SECRETARIA") {
      return {
        canViewAllProcesses: true, // Para organização
        canViewAllClients: true, // Para atendimento
        canViewAllEvents: true, // Para organização da agenda
        canViewClientEvents: false, // Não é cliente
        canViewFinancialData: false, // Não acessa dados financeiros
        canManageTeam: false,
        canManageOfficeSettings: false,
        canCreateEvents: true, // Para organizar agenda
        canEditAllEvents: true, // Para reagendar
        canViewReports: false,
        canManageContracts: false,
        canViewAllDocuments: true, // Para organização
        canManageUsers: false,
        canViewJudgesDatabase: true,
        canManageJudgesDatabase: false,
        canCreateJudgeProfiles: false,
        canEditJudgeProfiles: false,
        canDeleteJudgeProfiles: false,
        canViewPremiumJudges: false,
      };
    }

    // FINANCEIRO - Acesso ao módulo financeiro
    if (userRole === "FINANCEIRO") {
      return {
        canViewAllProcesses: false,
        canViewAllClients: true, // Para faturas
        canViewAllEvents: false,
        canViewClientEvents: false, // Não é cliente
        canViewFinancialData: true, // Acesso total ao financeiro
        canManageTeam: false,
        canManageOfficeSettings: false,
        canCreateEvents: false,
        canEditAllEvents: false,
        canViewReports: true, // Relatórios financeiros
        canManageContracts: true, // Para faturas
        canViewAllDocuments: false,
        canManageUsers: false,
        canViewJudgesDatabase: true,
        canManageJudgesDatabase: false,
        canCreateJudgeProfiles: false,
        canEditJudgeProfiles: false,
        canDeleteJudgeProfiles: false,
        canViewPremiumJudges: false,
      };
    }

    // CLIENTE - Acesso limitado aos seus dados
    if (userRole === "CLIENTE") {
      return {
        canViewAllProcesses: false, // Apenas o seu
        canViewAllClients: false,
        canViewAllEvents: false, // Não vê todos os eventos
        canViewClientEvents: true, // Pode ver eventos dos seus processos
        canViewFinancialData: true, // Apenas o que deve pagar
        canManageTeam: false,
        canManageOfficeSettings: false,
        canCreateEvents: false, // Cliente não cria eventos
        canEditAllEvents: false,
        canViewReports: false,
        canManageContracts: false,
        canViewAllDocuments: true, // Apenas os seus
        canManageUsers: false,
        canViewJudgesDatabase: false, // ✨ Cliente NÃO vê juízes
        canManageJudgesDatabase: false,
        canCreateJudgeProfiles: false,
        canEditJudgeProfiles: false,
        canDeleteJudgeProfiles: false,
        canViewPremiumJudges: false,
      };
    }

    // Default - sem permissões
    return {
      canViewAllProcesses: false,
      canViewAllClients: false,
      canViewAllEvents: false,
      canViewClientEvents: false,
      canViewFinancialData: false,
      canManageTeam: false,
      canManageOfficeSettings: false,
      canCreateEvents: false,
      canEditAllEvents: false,
      canViewReports: false,
      canManageContracts: false,
      canViewAllDocuments: false,
      canManageUsers: false,
      canViewJudgesDatabase: false,
      canManageJudgesDatabase: false,
      canCreateJudgeProfiles: false,
      canEditJudgeProfiles: false,
      canDeleteJudgeProfiles: false,
      canViewPremiumJudges: false,
    };
  }, [userRole, isSuperAdmin]);

  const hasPermission = (permission: keyof UserPermissions) => {
    return permissions[permission];
  };

  const hasAnyPermission = (permissionsList: (keyof UserPermissions)[]) => {
    return permissionsList.some((permission) => permissions[permission]);
  };

  const hasAllPermissions = (permissionsList: (keyof UserPermissions)[]) => {
    return permissionsList.every((permission) => permissions[permission]);
  };

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin: userRole === "ADMIN",
    isAdvogado: userRole === "ADVOGADO",
    isSecretaria: userRole === "SECRETARIA",
    isFinanceiro: userRole === "FINANCEIRO",
    isCliente: userRole === "CLIENTE",
  };
}
