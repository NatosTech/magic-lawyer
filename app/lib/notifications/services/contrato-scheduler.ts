/**
 * Serviço de agendamento para verificar contratos expirados e cancelados
 * Executa diariamente via cron job
 */

import prisma from "@/app/lib/prisma";
import { NotificationService } from "../notification-service";
import { NotificationFactory } from "../domain/notification-factory";

export class ContratoSchedulerService {
  /**
   * Verifica e notifica sobre contratos expirados ou próximos do vencimento
   */
  static async checkExpiringContracts(): Promise<void> {
    try {
      console.log(
        "[ContratoScheduler] 🔍 Iniciando verificação de contratos...",
      );

      const now = new Date();
      const hoje = new Date(now.setHours(0, 0, 0, 0));
      const proximos7Dias = new Date(
        hoje.getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      // Buscar contratos que expirarão nos próximos 7 dias ou já expiraram
      const contratosExpiradosOuProximos = await prisma.contrato.findMany({
        where: {
          status: {
            in: ["ATIVO", "SUSPENSO"], // Apenas contratos ativos ou suspensos
          },
          dataFim: {
            not: null,
          },
          OR: [
            // Já expirados (mas status ainda não foi atualizado)
            {
              dataFim: {
                lt: hoje,
              },
            },
            // Expirando nos próximos 7 dias
            {
              dataFim: {
                gte: hoje,
                lte: proximos7Dias,
              },
            },
          ],
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              usuarioId: true,
            },
          },
          advogadoResponsavel: {
            include: {
              usuario: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `[ContratoScheduler] 📋 Encontrados ${contratosExpiradosOuProximos.length} contratos para verificar`,
      );

      let notificadosExpirados = 0;
      let notificadosProximos = 0;

      for (const contrato of contratosExpiradosOuProximos) {
        if (!contrato.dataFim) continue;

        const dataFim = new Date(contrato.dataFim);
        const diasRestantes = Math.ceil(
          (dataFim.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000),
        );

        // Determinar destinatários
        const recipients: string[] = [];

        // Admin do tenant
        const admin = await prisma.usuario.findFirst({
          where: {
            tenantId: contrato.tenantId,
            role: "ADMIN",
            active: true,
          },
          select: { id: true },
        });

        if (admin) recipients.push(admin.id);

        // Advogado responsável
        if (contrato.advogadoResponsavel?.usuario?.id) {
          recipients.push(contrato.advogadoResponsavel.usuario.id);
        }

        // Cliente (se tiver usuário)
        if (contrato.cliente.usuarioId) {
          recipients.push(contrato.cliente.usuarioId);
        }

        // Se já expirou
        if (diasRestantes < 0) {
          // Atualizar status se ainda não foi atualizado
          if (contrato.status !== "ENCERRADO") {
            await prisma.contrato.update({
              where: { id: contrato.id },
              data: {
                status: "ENCERRADO",
                updatedAt: new Date(),
              },
            });
          }

          // Notificar expiração
          for (const recipientId of recipients) {
            try {
              const event = NotificationFactory.createEvent(
                "contrato.expired",
                contrato.tenantId,
                recipientId,
                {
                  contratoId: contrato.id,
                  clienteId: contrato.cliente.id,
                  titulo: contrato.titulo,
                  clienteNome: contrato.cliente.nome,
                  dataFim: contrato.dataFim.toISOString(),
                  diasAtraso: Math.abs(diasRestantes),
                },
              );

              await NotificationService.publishNotification(event);
              notificadosExpirados++;
            } catch (error) {
              console.error(
                `[ContratoScheduler] Erro ao notificar expiração do contrato ${contrato.id}:`,
                error,
              );
            }
          }
        } else if (diasRestantes <= 7 && diasRestantes > 0) {
          // Expirando em breve (1-7 dias)
          // Por simplicidade, notificar sempre quando estiver nos últimos 7 dias
          // Em produção, considerar cache Redis similar ao deadline-scheduler para evitar duplicatas
          for (const recipientId of recipients) {
            try {
              const event = NotificationFactory.createEvent(
                "contrato.expiring",
                contrato.tenantId,
                recipientId,
                {
                  contratoId: contrato.id,
                  clienteId: contrato.cliente.id,
                  titulo: contrato.titulo,
                  clienteNome: contrato.cliente.nome,
                  dataFim: contrato.dataFim.toISOString(),
                  diasRestantes,
                },
              );

              await NotificationService.publishNotification(event);
              notificadosProximos++;
            } catch (error) {
              console.error(
                `[ContratoScheduler] Erro ao notificar vencimento próximo do contrato ${contrato.id}:`,
                error,
              );
            }
          }
        }
      }

      console.log(
        `[ContratoScheduler] ✅ Verificação concluída: ${notificadosExpirados} expirados e ${notificadosProximos} próximos do vencimento notificados`,
      );
    } catch (error) {
      console.error("[ContratoScheduler] ❌ Erro ao verificar contratos:", error);
      throw error;
    }
  }
}
