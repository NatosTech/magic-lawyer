import prisma from "@/app/lib/prisma";
import { bumpTenantSession, bumpUserSession, getTenantSessionSnapshot } from "@/app/lib/session-version";
import { triggerRealtimeEvent } from "./publisher";

/**
 * Invalida a sessão de um tenant (incrementa versão, registra auditoria, dispara eventos)
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

  // Disparar evento realtime
  await triggerRealtimeEvent({
    type: "tenant-status",
    tenantId: options.tenantId,
    sessionVersion: updated.sessionVersion,
  });
}

/**
 * Invalida a sessão de um usuário específico
 */
export async function invalidateUser(options: { userId: string; tenantId: string; reason: string; actorId?: string }): Promise<void> {
  // Incrementar versão de sessão
  const updated = await bumpUserSession(options.userId, options.reason);

  // Registrar auditoria se tiver actorId
  if (options.actorId) {
    await prisma.auditLog.create({
      data: {
        tenantId: options.tenantId,
        usuarioId: options.actorId,
        acao: "USER_SESSION_INVALIDATED",
        entidade: "USUARIO",
        entidadeId: options.userId,
        dados: {
          reason: options.reason,
          sessionVersion: updated.sessionVersion,
        },
        changedFields: ["sessionVersion", "status"],
      },
    });
  }

  // Disparar evento realtime
  await triggerRealtimeEvent({
    type: "user-status",
    tenantId: options.tenantId,
    userId: options.userId,
    sessionVersion: updated.sessionVersion,
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
