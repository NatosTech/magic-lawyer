import prisma from "@/app/lib/prisma";
import { bumpTenantSession, bumpUserSession, getTenantSessionSnapshot } from "@/app/lib/session-version";
import { publishRealtimeEvent } from "./publisher";

/**
 * Incrementa tenantSoftVersion (para mudanças não críticas que não exigem logout)
 */
async function bumpTenantSoftVersion(tenantId: string, reason?: string): Promise<{ tenantSoftVersion: number }> {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tenantSoftVersion: { increment: 1 },
      ...(reason ? { statusReason: reason } : {}),
    },
    select: { tenantSoftVersion: true },
  });

  return updated;
}

/**
 * Soft update do tenant (mudanças não críticas que não exigem logout)
 * Incrementa tenantSoftVersion e publica evento tenant-soft-update + plan-update
 */
export async function softUpdateTenant(options: { tenantId: string; reason: string; actorId: string; planDetails?: { planId: string | null; planRevision: number } }): Promise<void> {
  // Incrementar soft version
  const updated = await bumpTenantSoftVersion(options.tenantId, options.reason);

  // Registrar auditoria
  await prisma.superAdminAuditLog.create({
    data: {
      superAdminId: options.actorId,
      acao: "TENANT_SOFT_UPDATE",
      entidade: "TENANT",
      entidadeId: options.tenantId,
      dadosNovos: {
        tenantSoftVersion: updated.tenantSoftVersion,
        reason: options.reason,
      },
    },
  });

  // Publicar eventos soft (não derruba sessão)
  publishRealtimeEvent("tenant-soft-update", {
    tenantId: options.tenantId,
    payload: {
      reason: options.reason,
      tenantSoftVersion: updated.tenantSoftVersion,
      changedBy: options.actorId,
    },
  }).catch((error) => {
    console.error("[realtime] Falha tenant-soft-update", error);
  });

  // Se há mudança de plano, publicar também plan-update
  if (options.planDetails) {
    publishRealtimeEvent("plan-update", {
      tenantId: options.tenantId,
      payload: {
        planId: options.planDetails.planId || "",
        planRevision: options.planDetails.planRevision,
        tenantSoftVersion: updated.tenantSoftVersion,
        changedBy: options.actorId,
      },
    }).catch((error) => {
      console.error("[realtime] Falha plan-update", error);
    });
  }
}

/**
 * Invalida a sessão de um tenant (incrementa versão, registra auditoria, dispara eventos)
 * USAR APENAS para mudanças CRÍTICAS que exigem logout (status SUSPENDED/CANCELLED)
 */
export async function invalidateTenant(options: { tenantId: string; reason: string; actorId: string }): Promise<void> {
  // Buscar tenant atual para registrar transição
  const snapshot = await getTenantSessionSnapshot(options.tenantId);

  if (!snapshot) {
    throw new Error("Tenant não encontrado");
  }

  const fromStatus = snapshot.status;

  // Incrementar versão de sessão
  const updated = await bumpTenantSession(options.tenantId, options.reason);

  // Buscar novo status após update
  const newSnapshot = await getTenantSessionSnapshot(options.tenantId);
  const toStatus = newSnapshot?.status || fromStatus;

  // Registrar transição de status (se mudou)
  if (fromStatus !== toStatus) {
    // Note: Você pode criar uma tabela TenantStatusTransition se quiser histórico
    // Por enquanto vamos apenas no audit log
  }

  // Registrar auditoria
  await prisma.superAdminAuditLog.create({
    data: {
      superAdminId: options.actorId,
      acao: "TENANT_SESSION_INVALIDATED",
      entidade: "TENANT",
      entidadeId: options.tenantId,
      dadosAntigos: {
        sessionVersion: snapshot.sessionVersion,
        status: fromStatus,
      },
      dadosNovos: {
        sessionVersion: updated.sessionVersion,
        status: toStatus,
        reason: options.reason,
      },
    },
  });

  // Disparar evento realtime via Ably
  publishRealtimeEvent("tenant-status", {
    tenantId: options.tenantId,
    payload: {
      status: toStatus,
      reason: options.reason,
      sessionVersion: updated.sessionVersion,
      changedBy: options.actorId,
    },
  }).catch((error) => {
    console.error("[realtime] Falha tenant-status", error);
  });
}

/**
 * Invalida a sessão de um usuário específico
 */
export async function invalidateUser(options: { userId: string; tenantId: string; reason: string; actorId?: string }): Promise<void> {
  // Incrementar versão de sessão PRIMEIRO
  const updated = await bumpUserSession(options.userId, options.reason);

  // Buscar status APÓS incrementar (para pegar o valor já atualizado)
  const user = await prisma.usuario.findUnique({
    where: { id: options.userId },
    select: { active: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  // Registrar auditoria se tiver actorId
  if (options.actorId) {
    await prisma.auditLog.create({
      data: {
        tenantId: options.tenantId,
        usuarioId: null,
        acao: "USER_SESSION_INVALIDATED",
        entidade: "USUARIO",
        entidadeId: options.userId,
        dados: {
          reason: options.reason,
          sessionVersion: updated.sessionVersion,
          changedBy: options.actorId,
        },
        changedFields: ["sessionVersion", "status"],
      },
    });
  }

  // Disparar evento realtime via Ably com status CORRETO (após atualização)
  publishRealtimeEvent("user-status", {
    tenantId: options.tenantId,
    userId: options.userId,
    payload: {
      userId: options.userId,
      active: user.active, // Status REAL após atualização
      reason: options.reason,
      sessionVersion: updated.sessionVersion,
      changedBy: options.actorId,
    },
  }).catch((error) => {
    console.error("[realtime] Falha user-status", error);
  });
}

/**
 * Invalida sessões de todos os usuários de um tenant
 * Usado quando o tenant é suspenso/cancelado
 */
export async function invalidateAllTenantUsers(options: { tenantId: string; reason: string }): Promise<void> {
  const users = await prisma.usuario.findMany({
    where: { tenantId: options.tenantId },
    select: { id: true },
  });

  await Promise.all(
    users.map((user) =>
      invalidateUser({
        userId: user.id,
        tenantId: options.tenantId,
        reason: options.reason,
      })
    )
  );
}
