import { UserRole } from "@/app/generated/prisma";

// Interface para validações de auto-edição
export interface SelfEditPermissions {
  canEditBasicInfo: boolean;
  canEditPhone: boolean;
  canEditAvatar: boolean;
  canEditRoleSpecificData: boolean;
  canEditEmail: boolean;
  canEditRole: boolean;
  canEditTenant: boolean;
  canEditActiveStatus: boolean;
  canEditPassword: boolean;
  restrictions: string[];
}

// Obter permissões de auto-edição baseadas no role
export function getSelfEditPermissions(role: UserRole): SelfEditPermissions {
  const basePermissions = {
    canEditBasicInfo: true,
    canEditPhone: true,
    canEditAvatar: true,
    canEditRoleSpecificData: true,
    canEditEmail: false, // Email é crítico para autenticação
    canEditRole: false, // Role só pode ser alterado por admin
    canEditTenant: false, // Tenant só pode ser alterado por super admin
    canEditActiveStatus: false, // Status ativo só pode ser alterado por admin
    canEditPassword: true,
    restrictions: [] as string[],
  };

  switch (role) {
    case "SUPER_ADMIN":
      return {
        ...basePermissions,
        canEditEmail: true, // Super admin pode alterar email
        canEditRole: true, // Super admin pode alterar role
        canEditTenant: true, // Super admin pode alterar tenant
        canEditActiveStatus: true, // Super admin pode alterar status
        restrictions: [],
      };

    case "ADMIN":
      return {
        ...basePermissions,
        canEditEmail: true, // Admin pode alterar email
        restrictions: [
          "Não pode alterar role para SUPER_ADMIN",
          "Não pode alterar tenant",
          "Não pode alterar status ativo de outros usuários",
        ],
      };

    case "ADVOGADO":
      return {
        ...basePermissions,
        restrictions: [
          "Não pode alterar email",
          "Não pode alterar role",
          "Não pode alterar tenant",
          "Não pode alterar status ativo",
          "Pode alterar apenas dados profissionais básicos",
        ],
      };

    case "SECRETARIA":
      return {
        ...basePermissions,
        canEditRoleSpecificData: false, // Secretaria não tem dados específicos
        restrictions: [
          "Não pode alterar email",
          "Não pode alterar role",
          "Não pode alterar tenant",
          "Não pode alterar status ativo",
          "Pode alterar apenas dados pessoais básicos",
        ],
      };

    case "CLIENTE":
      return {
        ...basePermissions,
        canEditRoleSpecificData: false, // Cliente não tem dados específicos editáveis
        restrictions: [
          "Não pode alterar email",
          "Não pode alterar role",
          "Não pode alterar tenant",
          "Não pode alterar status ativo",
          "Pode alterar apenas dados pessoais básicos",
        ],
      };

    default:
      return {
        ...basePermissions,
        restrictions: ["Role não reconhecido"],
      };
  }
}

// Validar se usuário pode editar um campo específico
export function canUserEditField(
  field: string,
  role: UserRole,
  targetUserId?: string,
  currentUserId?: string,
): boolean {
  const permissions = getSelfEditPermissions(role);

  // Se não é auto-edição, precisa de permissões administrativas
  if (targetUserId && targetUserId !== currentUserId) {
    return role === "SUPER_ADMIN" || role === "ADMIN";
  }

  // Auto-edição baseada em permissões
  switch (field) {
    case "firstName":
    case "lastName":
      return permissions.canEditBasicInfo;
    case "phone":
      return permissions.canEditPhone;
    case "avatarUrl":
      return permissions.canEditAvatar;
    case "email":
      return permissions.canEditEmail;
    case "role":
      return permissions.canEditRole;
    case "tenantId":
      return permissions.canEditTenant;
    case "active":
      return permissions.canEditActiveStatus;
    case "password":
      return permissions.canEditPassword;
    default:
      return permissions.canEditRoleSpecificData;
  }
}
