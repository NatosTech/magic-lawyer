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
      {/* Header do Dashboard */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getDashboardTitle()}</h1>
            <p className="text-default-500 mt-1">{getDashboardDescription()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">Perfil:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getRoleBadgeColor()}-100 text-${getRoleBadgeColor()}-800`}>{getRoleLabel()}</span>
          </div>
        </div>

        <Card>
          <CardBody>
            <p className="text-default-600">{getWelcomeMessage()}</p>
          </CardBody>
        </Card>
      </div>

      {/* Permissões do Usuário */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Suas Permissões</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${value ? "bg-success" : "bg-default-300"}`} />
                <span className="text-sm text-default-600">{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Conteúdo Específico do Perfil */}
      {children && <div className="space-y-6">{children}</div>}
    </div>
  );
}
