import { NotificationHelper } from "./notification-helper";

import prisma from "@/app/lib/prisma";

type NullableString = string | null | undefined;

interface RecipientResult {
  userIds: string[];
  processes: Array<{ id: string; numero: string | null }>;
  client?: { usuarioId: string | null; nome: string | null };
}

interface ResolveRecipientOptions {
  tenantId: string;
  uploaderUserId?: string;
  processoIds?: string[];
  clienteId?: NullableString;
  includeClient?: boolean;
  includeUploader?: boolean;
  extraUserIds?: string[];
  excludeUserIds?: string[];
}

export interface DocumentNotificationContext {
  tenantId: string;
  documentoId: string;
  nome: string;
  processoIds?: string[];
  clienteId?: NullableString;
  uploaderUserId?: string;
  uploaderNome?: string;
}

export interface DocumentUploadContext extends DocumentNotificationContext {
  tipo?: NullableString;
  tamanhoBytes?: number | null;
  visivelParaCliente?: boolean;
}

export interface DocumentStatusContext extends DocumentNotificationContext {
  actorUserId?: string;
  actorNome?: string;
  observacoes?: string;
  motivo?: string;
  dataExpiracao?: Date | string | null;
}

export class DocumentNotifier {
  private static async resolveRecipients(
    options: ResolveRecipientOptions,
  ): Promise<RecipientResult> {
    const {
      tenantId,
      uploaderUserId,
      processoIds,
      clienteId,
      includeClient = false,
      includeUploader = false,
      extraUserIds = [],
      excludeUserIds = [],
    } = options;

    try {
      const [adminsAndSecretarias, processos, cliente] = await Promise.all([
        prisma.usuario.findMany({
          where: {
            tenantId,
            active: true,
            role: { in: ["ADMIN", "SECRETARIA"] },
          },
          select: { id: true },
        }),
        processoIds && processoIds.length
          ? prisma.processo.findMany({
              where: { id: { in: processoIds }, tenantId },
              select: {
                id: true,
                numero: true,
                advogadoResponsavel: {
                  select: {
                    usuario: {
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            })
          : Promise.resolve([]),
        clienteId
          ? prisma.cliente.findFirst({
              where: { id: clienteId, tenantId },
              select: {
                usuarioId: true,
                nome: true,
              },
            })
          : Promise.resolve(null),
      ]);

      const recipients = new Set<string>();

      if (includeUploader && uploaderUserId) {
        recipients.add(uploaderUserId);
      }

      adminsAndSecretarias.forEach(({ id }) => {
        if (id) {
          recipients.add(id);
        }
      });

      processos.forEach((proc) => {
        const id = (proc.advogadoResponsavel?.usuario as { id?: string } | null)
          ?.id;

        if (id) {
          recipients.add(id);
        }
      });

      extraUserIds.forEach((id) => {
        if (id) {
          recipients.add(id);
        }
      });

      const exclude = new Set<string>(
        excludeUserIds.filter(Boolean) as string[],
      );

      if (
        includeClient &&
        cliente?.usuarioId &&
        !exclude.has(cliente.usuarioId)
      ) {
        recipients.add(cliente.usuarioId);
      }

      if (uploaderUserId) {
        exclude.add(uploaderUserId);
      }

      exclude.forEach((id) => recipients.delete(id));

      return {
        userIds: Array.from(recipients),
        processes: processos.map((proc) => ({
          id: proc.id,
          numero: proc.numero,
        })),
        client: cliente
          ? {
              usuarioId: cliente.usuarioId,
              nome: cliente.nome,
            }
          : undefined,
      };
    } catch (error) {
      console.error(
        "[DocumentNotifier] Falha ao resolver destinatários do documento",
        error,
      );

      return {
        userIds: [],
        processes: [],
      };
    }
  }

  /**
   * Dispara notificações para eventos de upload de documento.
   */
  static async notifyUploaded(context: DocumentUploadContext): Promise<void> {
    const recipients = await this.resolveRecipients({
      tenantId: context.tenantId,
      uploaderUserId: context.uploaderUserId,
      processoIds: context.processoIds,
      clienteId: context.clienteId,
      includeClient: Boolean(context.visivelParaCliente),
      includeUploader: false,
      excludeUserIds: context.uploaderUserId ? [context.uploaderUserId] : [],
    });

    if (!recipients.userIds.length) {
      return;
    }

    const primaryProcess = recipients.processes[0];

    const payload = {
      documentoId: context.documentoId,
      nome: context.nome,
      tipo: context.tipo ?? "documento",
      tamanho: context.tamanhoBytes ?? 0,
      uploadadoPor: context.uploaderNome ?? context.uploaderUserId ?? "Usuário",
      processoId: primaryProcess?.id,
      processoNumero: primaryProcess?.numero ?? undefined,
      clienteId: context.clienteId ?? undefined,
    };

    await Promise.all(
      recipients.userIds.map((userId) =>
        NotificationHelper.notifyDocumentoUploaded(
          context.tenantId,
          userId,
          payload,
        ),
      ),
    );
  }

  static async notifyApproved(context: DocumentStatusContext): Promise<void> {
    const recipients = await this.resolveRecipients({
      tenantId: context.tenantId,
      uploaderUserId: context.uploaderUserId,
      processoIds: context.processoIds,
      clienteId: context.clienteId,
      includeClient: false,
      includeUploader: true,
      extraUserIds: context.uploaderUserId ? [context.uploaderUserId] : [],
      excludeUserIds: context.actorUserId ? [context.actorUserId] : [],
    });

    if (!recipients.userIds.length) {
      return;
    }

    const primaryProcess = recipients.processes[0];

    const payload = {
      documentoId: context.documentoId,
      nome: context.nome,
      aprovadoPor: context.actorNome ?? "Cliente",
      observacoes: context.observacoes,
      processoId: primaryProcess?.id,
      processoNumero: primaryProcess?.numero ?? undefined,
    };

    await Promise.all(
      recipients.userIds.map((userId) =>
        NotificationHelper.notifyDocumentoApproved(
          context.tenantId,
          userId,
          payload,
        ),
      ),
    );
  }

  static async notifyRejected(context: DocumentStatusContext): Promise<void> {
    const recipients = await this.resolveRecipients({
      tenantId: context.tenantId,
      uploaderUserId: context.uploaderUserId,
      processoIds: context.processoIds,
      clienteId: context.clienteId,
      includeClient: false,
      includeUploader: true,
      extraUserIds: context.uploaderUserId ? [context.uploaderUserId] : [],
      excludeUserIds: context.actorUserId ? [context.actorUserId] : [],
    });

    if (!recipients.userIds.length) {
      return;
    }

    const primaryProcess = recipients.processes[0];

    const payload = {
      documentoId: context.documentoId,
      nome: context.nome,
      rejeitadoPor: context.actorNome ?? "Cliente",
      motivo: context.motivo ?? "Assinatura rejeitada",
      processoId: primaryProcess?.id,
      processoNumero: primaryProcess?.numero ?? undefined,
    };

    await Promise.all(
      recipients.userIds.map((userId) =>
        NotificationHelper.notifyDocumentoRejected(
          context.tenantId,
          userId,
          payload,
        ),
      ),
    );
  }

  static async notifyExpired(context: DocumentStatusContext): Promise<void> {
    const recipients = await this.resolveRecipients({
      tenantId: context.tenantId,
      uploaderUserId: context.uploaderUserId,
      processoIds: context.processoIds,
      clienteId: context.clienteId,
      includeClient: true,
      includeUploader: true,
      extraUserIds: context.uploaderUserId ? [context.uploaderUserId] : [],
      excludeUserIds: context.actorUserId ? [context.actorUserId] : [],
    });

    if (!recipients.userIds.length) {
      return;
    }

    const primaryProcess = recipients.processes[0];

    const payload = {
      documentoId: context.documentoId,
      nome: context.nome,
      expiradoEm: context.dataExpiracao
        ? new Date(context.dataExpiracao).toISOString()
        : undefined,
      processoId: primaryProcess?.id,
      processoNumero: primaryProcess?.numero ?? undefined,
    };

    await Promise.all(
      recipients.userIds.map((userId) =>
        NotificationHelper.notifyDocumentoExpired(
          context.tenantId,
          userId,
          payload,
        ),
      ),
    );
  }
}
