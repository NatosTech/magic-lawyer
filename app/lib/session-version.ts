import prisma from "@/app/lib/prisma";
import { TenantStatus } from "@/app/generated/prisma";

/**
 * Incrementa o sessionVersion de um tenant e atualiza statusChangedAt
 * Usado quando há alteração crítica no tenant (status, plano, módulos)
 */
export async function bumpTenantSession(tenantId: string, reason?: string): Promise<{ sessionVersion: number }> {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      sessionVersion: { increment: 1 },
      statusChangedAt: new Date(),
      statusReason: reason ?? undefined,
    },
    select: { sessionVersion: true },
  });

  return updated;
}

/**
 * Busca snapshot atual da sessão do tenant
 */
export async function getTenantSessionSnapshot(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      status: true,
      statusReason: true,
      statusChangedAt: true,
      sessionVersion: true,
      planRevision: true,
    },
  });
}

/**
 * Incrementa o sessionVersion de um usuário e atualiza statusChangedAt
 * Usado quando há alteração crítica no usuário (status, permissões)
 */
export async function bumpUserSession(userId: string, reason?: string): Promise<{ sessionVersion: number }> {
  const updated = await prisma.usuario.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
      statusChangedAt: new Date(),
      statusReason: reason ?? undefined,
    },
    select: { sessionVersion: true },
  });

  return updated;
}

/**
 * Busca snapshot atual da sessão do usuário
 */
export async function getUserSessionSnapshot(userId: string) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      active: true,
      statusReason: true,
      statusChangedAt: true,
      sessionVersion: true,
    },
  });
}

/**
 * Verifica se o tenant está ativo e se a sessão é válida
 */
export async function validateTenantSession(tenantId: string, sessionVersion: number): Promise<{ valid: boolean; status?: TenantStatus; reason?: string }> {
  const tenant = await getTenantSessionSnapshot(tenantId);

  if (!tenant) {
    return { valid: false, reason: "TENANT_NOT_FOUND" };
  }

  if (tenant.status !== TenantStatus.ACTIVE) {
    return { valid: false, status: tenant.status, reason: tenant.status };
  }

  if (tenant.sessionVersion !== sessionVersion) {
    return {
      valid: false,
      reason: "SESSION_VERSION_MISMATCH",
    };
  }

  return { valid: true, status: tenant.status };
}

/**
 * Verifica se o usuário está ativo e se a sessão é válida
 */
export async function validateUserSession(userId: string, sessionVersion: number): Promise<{ valid: boolean; reason?: string }> {
  const user = await getUserSessionSnapshot(userId);

  if (!user) {
    return { valid: false, reason: "USER_NOT_FOUND" };
  }

  if (!user.active) {
    return { valid: false, reason: "USER_DISABLED" };
  }

  if (user.sessionVersion !== sessionVersion) {
    return { valid: false, reason: "SESSION_VERSION_MISMATCH" };
  }

  return { valid: true };
}
