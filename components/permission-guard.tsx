"use client";

import { ReactNode } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { Lock, ArrowRight } from "lucide-react";

import { useUserPermissions } from "@/app/hooks/use-user-permissions";

interface PermissionGuardProps {
  children: ReactNode;
  permission: keyof ReturnType<typeof useUserPermissions>["permissions"];
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  fallback,
  showMessage = true,
}: PermissionGuardProps) {
  const { permissions, userRole, isLoadingPermissions } = useUserPermissions();
  const hasPermission = permissions[permission];

  // Se ainda estiver carregando, não renderizar nada (ou mostrar loading)
  if (isLoadingPermissions) {
    return fallback || null;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showMessage) {
    return null;
  }

  const getPermissionMessage = () => {
    switch (permission) {
      case "canCreateEvents":
        return "Você não tem permissão para criar eventos";
      case "canEditAllEvents":
        return "Você não tem permissão para editar eventos";
      case "canViewFinancialData":
        return "Você não tem permissão para visualizar dados financeiros";
      case "canManageTeam":
        return "Você não tem permissão para gerenciar a equipe";
      case "canManageOfficeSettings":
        return "Você não tem permissão para alterar configurações";
      case "canViewReports":
        return "Você não tem permissão para visualizar relatórios";
      default:
        return "Você não tem permissão para realizar esta ação";
    }
  };

  const getRoleMessage = () => {
    switch (userRole) {
      case "CLIENTE":
        return "Como cliente, você tem acesso limitado ao sistema. Entre em contato com seu advogado para mais informações.";
      case "SECRETARIA":
        return "Como secretaria, você tem acesso operacional ao sistema. Entre em contato com o administrador para permissões adicionais.";
      case "ADVOGADO":
        return "Como advogado, você tem acesso aos seus clientes e processos. Entre em contato com o administrador para permissões adicionais.";
      case "FINANCEIRO":
        return "Como financeiro, você tem acesso ao módulo financeiro. Entre em contato com o administrador para permissões adicionais.";
      default:
        return "Entre em contato com o administrador para permissões adicionais.";
    }
  };

  return (
    <Card className="border border-warning/20 bg-warning/5">
      <CardBody className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-warning/10 p-3">
          <Lock className="w-6 h-6 text-warning" />
        </div>

        <h3 className="text-lg font-semibold text-warning mb-2">
          Acesso Restrito
        </h3>

        <p className="text-default-600 mb-4 max-w-md">
          {getPermissionMessage()}
        </p>

        <p className="text-sm text-default-500 mb-6 max-w-md">
          {getRoleMessage()}
        </p>

        <Button
          color="warning"
          endContent={<ArrowRight className="w-4 h-4" />}
          variant="bordered"
        >
          Entrar em Contato
        </Button>
      </CardBody>
    </Card>
  );
}
