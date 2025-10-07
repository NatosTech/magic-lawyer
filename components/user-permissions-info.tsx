"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Mail,
  Phone,
  Camera,
  Key,
  Settings,
  Crown,
  Building2,
} from "lucide-react";

import { getUserSelfEditData } from "@/app/actions/user-self-edit";
import { type SelfEditPermissions } from "@/lib/user-permissions";
import { UserRole } from "@/app/generated/prisma";

interface UserPermissionsInfoProps {
  className?: string;
}

export function UserPermissionsInfo({ className }: UserPermissionsInfoProps) {
  const [permissions, setPermissions] = useState<SelfEditPermissions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await getUserSelfEditData();

      if (result.success && result.data) {
        setPermissions(result.data.permissions);
        setUserRole(result.data.user.role);
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return Crown;
      case "ADMIN":
        return Shield;
      case "ADVOGADO":
        return User;
      case "SECRETARIA":
        return Settings;
      case "CLIENTE":
        return User;
      default:
        return User;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "warning";
      case "ADMIN":
        return "primary";
      case "ADVOGADO":
        return "secondary";
      case "SECRETARIA":
        return "success";
      case "CLIENTE":
        return "default";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrador";
      case "ADMIN":
        return "Administrador";
      case "ADVOGADO":
        return "Advogado";
      case "SECRETARIA":
        return "Secretária";
      case "CLIENTE":
        return "Cliente";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  if (!permissions || !userRole) {
    return null;
  }

  const RoleIcon = getRoleIcon(userRole);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-2 pb-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Permissões de Auto-edição
            </h3>
            <p className="text-sm text-primary-300">
              O que você pode alterar em seu perfil
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Role do usuário */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <RoleIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary-300">
              Seu Nível de Acesso
            </span>
          </div>
          <Badge
            className="font-semibold"
            color={getRoleColor(userRole) as any}
            size="lg"
            variant="flat"
          >
            {getRoleLabel(userRole)}
          </Badge>
        </div>

        {/* Permissões permitidas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <h4 className="text-lg font-semibold text-white">
              Permissões Permitidas
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissions.canEditBasicInfo && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Dados Pessoais
                  </p>
                  <p className="text-xs text-success-300">Nome, sobrenome</p>
                </div>
              </div>
            )}

            {permissions.canEditPhone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Phone className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Telefone</p>
                  <p className="text-xs text-success-300">Número de contato</p>
                </div>
              </div>
            )}

            {permissions.canEditAvatar && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Camera className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Avatar</p>
                  <p className="text-xs text-success-300">Foto de perfil</p>
                </div>
              </div>
            )}

            {permissions.canEditPassword && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Key className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Senha</p>
                  <p className="text-xs text-success-300">Alterar senha</p>
                </div>
              </div>
            )}

            {permissions.canEditEmail && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Mail className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Email</p>
                  <p className="text-xs text-success-300">Endereço de email</p>
                </div>
              </div>
            )}

            {permissions.canEditRoleSpecificData && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Settings className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Dados Profissionais
                  </p>
                  <p className="text-xs text-success-300">
                    Informações específicas do cargo
                  </p>
                </div>
              </div>
            )}

            {permissions.canEditRole && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Crown className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Função</p>
                  <p className="text-xs text-success-300">
                    Alterar cargo/função
                  </p>
                </div>
              </div>
            )}

            {permissions.canEditTenant && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Building2 className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-white">Escritório</p>
                  <p className="text-xs text-success-300">Alterar escritório</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Restrições */}
        {permissions.restrictions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <h4 className="text-lg font-semibold text-white">Restrições</h4>
            </div>

            <div className="space-y-2">
              {permissions.restrictions.map((restriction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-warning-300">{restriction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informação adicional */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-default/10 to-default/5 border border-default/20">
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-5 h-5 text-default-400" />
            <h5 className="font-semibold text-white">Informação</h5>
          </div>
          <p className="text-sm text-default-300">
            Suas permissões são baseadas no seu nível de acesso atual. Para
            alterar permissões ou acessar funcionalidades restritas, entre em
            contato com um administrador.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
