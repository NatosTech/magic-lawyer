/**
 * Serviço de agendamento para verificar documentos expirados
 * Executa diariamente via cron job
 */

import { DocumentNotifier } from "../document-notifier";

import prisma from "@/app/lib/prisma";

export class DocumentSchedulerService {
  /**
   * Verifica e notifica sobre documentos expirados
   */
  static async checkExpiredDocuments(): Promise<void> {
    try {
      console.log(
        "[DocumentScheduler] 🔍 Iniciando verificação de documentos expirados...",
      );

      const now = new Date();

      // Buscar documentos com data de expiração passada
      // Verificar DocumentoAssinatura primeiro (assinaturas de documentos)
      const assinaturasExpiradas = await prisma.documentoAssinatura.findMany({
        where: {
          status: "PENDENTE",
          dataExpiracao: {
            not: null,
            lt: now,
          },
        },
        include: {
          documento: {
            select: {
              id: true,
              nome: true,
              processoId: true,
              clienteId: true,
              uploadedById: true,
              tenantId: true,
              processo: {
                select: {
                  id: true,
                  numero: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `[DocumentScheduler] 📋 Encontradas ${assinaturasExpiradas.length} assinaturas expiradas`,
      );

      let notificados = 0;

      for (const assinatura of assinaturasExpiradas) {
        // Atualizar status para EXPIRADO
        await prisma.documentoAssinatura.update({
          where: { id: assinatura.id },
          data: { status: "EXPIRADO" },
        });

        if (assinatura.documento) {
          try {
            await DocumentNotifier.notifyExpired({
              tenantId: assinatura.tenantId,
              documentoId: assinatura.documento.id,
              nome: assinatura.documento.nome,
              processoIds: assinatura.documento.processoId
                ? [assinatura.documento.processoId]
                : undefined,
              clienteId: assinatura.documento.clienteId,
              uploaderUserId: assinatura.documento.uploadedById ?? undefined,
              dataExpiracao: assinatura.dataExpiracao,
            });

            notificados++;
          } catch (error) {
            console.error(
              `[DocumentScheduler] Erro ao notificar expiração do documento ${assinatura.documento.id}:`,
              error,
            );
          }
        }
      }

      // Buscar também documentos com data de expiração direta (se o schema tiver esse campo)
      // Por enquanto, focamos apenas em assinaturas de documentos

      console.log(
        `[DocumentScheduler] ✅ Verificação concluída: ${notificados} documentos expirados notificados`,
      );
    } catch (error) {
      console.error(
        "[DocumentScheduler] ❌ Erro ao verificar documentos expirados:",
        error,
      );
      throw error;
    }
  }
}
