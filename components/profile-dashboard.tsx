"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { useProfileNavigation } from "@/app/hooks/use-profile-navigation";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";

interface ProfileDashboardProps {
  children?: React.ReactNode;
}

export function ProfileDashboard({ children }: ProfileDashboardProps) {
  const { getDashboardTitle, getDashboardDescription, getWelcomeMessage, userRole } = useProfileNavigation();
  const { permissions } = useUserPermissions();

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case "ADMIN":
        return "danger";
      case "ADVOGADO":
        return "primary";
      case "SECRETARIA":
        return "secondary";
      case "FINANCEIRO":
        return "success";
      case "CLIENTE":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "ADMIN":
        return "Administrador";
      case "ADVOGADO":
        return "Advogado";
      case "SECRETARIA":
        return "Secretaria";
      case "FINANCEIRO":
        return "Financeiro";
      case "CLIENTE":
        return "Cliente";
      default:
        return "Usuário";
    }
  };

  return (
    <div className="space-y-6">
      {/* Conteúdo Específico do Perfil */}
      {children && <div className="space-y-6">{children}</div>}
    </div>
  );
}
