/**
 * Serviço de agendamento para lembretes de eventos
 * Executa periodicamente via cron job
 */

import prisma from "@/app/lib/prisma";
import { NotificationService } from "../notification-service";
import { NotificationFactory } from "../domain/notification-factory";

export class EventReminderSchedulerService {
  /**
   * Verifica e envia lembretes de eventos (1 dia e 1 hora antes)
   */
  static async checkEventReminders(): Promise<void> {
    try {
      console.log(
        "[EventReminderScheduler] 🔍 Iniciando verificação de lembretes de eventos...",
      );

      const now = new Date();
      const umDia = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h a partir de agora
      const umaHora = new Date(now.getTime() + 60 * 60 * 1000); // 1h a partir de agora
      const proximos15Minutos = new Date(now.getTime() + 15 * 60 * 1000); // Janela de 15min para envio

      // Buscar eventos que começam em ~24 horas (lembrete 1 dia)
      const eventos1Dia = await prisma.evento.findMany({
        where: {
          dataInicio: {
            gte: umDia,
            lte: new Date(umDia.getTime() + 60 * 60 * 1000), // Janela de 1h
          },
          status: {
            in: ["AGENDADO", "CONFIRMADO"],
          },
        },
        include: {
          processo: {
            select: {
              id: true,
              numero: true,
            },
          },
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

      // Buscar eventos que começam em ~1 hora (lembrete 1 hora)
      const eventos1Hora = await prisma.evento.findMany({
        where: {
          dataInicio: {
            gte: umaHora,
            lte: proximos15Minutos, // Janela de 15min para envio
          },
          status: {
            in: ["AGENDADO", "CONFIRMADO"],
          },
        },
        include: {
          processo: {
            select: {
              id: true,
              numero: true,
            },
          },
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
        `[EventReminderScheduler] 📋 Encontrados ${eventos1Dia.length} eventos para lembrete 1d e ${eventos1Hora.length} para lembrete 1h`,
      );

      let lembretes1d = 0;
      let lembretes1h = 0;

      // Processar lembretes de 1 dia
      for (const evento of eventos1Dia) {
        // Verificar se já foi notificado recentemente (evitar duplicatas)
        const ultimaNotificacao = await prisma.notification.findFirst({
          where: {
            tenantId: evento.tenantId,
            type: "evento.reminder_1d",
            payload: {
              path: ["eventoId"],
              equals: evento.id,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Se não foi notificado nas últimas 12 horas, notificar
        if (
          !ultimaNotificacao ||
          new Date(ultimaNotificacao.createdAt).getTime() <
            now.getTime() - 12 * 60 * 60 * 1000
        ) {
          const recipients = await this.getEventRecipients(evento);

          for (const userId of recipients) {
            try {
              const event = NotificationFactory.createEvent(
                "evento.reminder_1d",
                evento.tenantId,
                userId,
                {
                  eventoId: evento.id,
                  titulo: evento.titulo,
                  dataInicio: evento.dataInicio.toISOString(),
                  local: evento.local ?? undefined,
                  processoId: evento.processoId ?? undefined,
                  processoNumero: evento.processo?.numero ?? undefined,
                },
              );

              await NotificationService.publishNotification(event);
              lembretes1d++;
            } catch (error) {
              console.error(
                `[EventReminderScheduler] Erro ao enviar lembrete 1d para evento ${evento.id}:`,
                error,
              );
            }
          }
        }
      }

      // Processar lembretes de 1 hora
      for (const evento of eventos1Hora) {
        // Verificar se já foi notificado recentemente (evitar duplicatas)
        const ultimaNotificacao = await prisma.notification.findFirst({
          where: {
            tenantId: evento.tenantId,
            type: "evento.reminder_1h",
            payload: {
              path: ["eventoId"],
              equals: evento.id,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Se não foi notificado nas últimas 30 minutos, notificar
        if (
          !ultimaNotificacao ||
          new Date(ultimaNotificacao.createdAt).getTime() <
            now.getTime() - 30 * 60 * 1000
        ) {
          const recipients = await this.getEventRecipients(evento);

          for (const userId of recipients) {
            try {
              const event = NotificationFactory.createEvent(
                "evento.reminder_1h",
                evento.tenantId,
                userId,
                {
                  eventoId: evento.id,
                  titulo: evento.titulo,
                  dataInicio: evento.dataInicio.toISOString(),
                  local: evento.local ?? undefined,
                  processoId: evento.processoId ?? undefined,
                  processoNumero: evento.processo?.numero ?? undefined,
                },
              );

              await NotificationService.publishNotification(event);
              lembretes1h++;
            } catch (error) {
              console.error(
                `[EventReminderScheduler] Erro ao enviar lembrete 1h para evento ${evento.id}:`,
                error,
              );
            }
          }
        }
      }

      console.log(
        `[EventReminderScheduler] ✅ Verificação concluída: ${lembretes1d} lembretes 1d e ${lembretes1h} lembretes 1h enviados`,
      );
    } catch (error) {
      console.error(
        "[EventReminderScheduler] ❌ Erro ao verificar lembretes de eventos:",
        error,
      );
      throw error;
    }
  }

  /**
   * Obtém lista de destinatários para notificação de evento
   */
  private static async getEventRecipients(evento: any): Promise<string[]> {
    const recipients: string[] = [];

    // Admin do tenant
    const admin = await prisma.usuario.findFirst({
      where: {
        tenantId: evento.tenantId,
        role: "ADMIN",
        active: true,
      },
      select: { id: true },
    });

    if (admin) recipients.push(admin.id);

    // Advogado responsável
    if (evento.advogadoResponsavel?.usuario?.id) {
      recipients.push(evento.advogadoResponsavel.usuario.id);
    }

    // Cliente (se tiver usuário)
    if (evento.cliente?.usuarioId) {
      recipients.push(evento.cliente.usuarioId);
    }

    // Buscar usuários por email dos participantes
    if (evento.participantes && evento.participantes.length > 0) {
      const usuariosParticipantes = await prisma.usuario.findMany({
        where: {
          tenantId: evento.tenantId,
          email: {
            in: evento.participantes,
          },
          active: true,
        },
        select: { id: true },
      });

      usuariosParticipantes.forEach((u) => {
        if (u.id && !recipients.includes(u.id)) {
          recipients.push(u.id);
        }
      });
    }

    return Array.from(new Set(recipients)); // Remover duplicatas
  }
}

