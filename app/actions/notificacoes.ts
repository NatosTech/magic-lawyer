"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";
import {
  whatsappService,
  sendAndamentoNotification,
} from "@/lib/whatsapp-service";
import {
  emailService,
  sendAndamentoEmailNotification,
} from "@/lib/email-service";

export interface NotificacaoResult {
  success: boolean;
  error?: string;
  whatsapp?: {
    success: boolean;
    error?: string;
    provider?: string;
  };
  email?: {
    success: boolean;
    error?: string;
    provider?: string;
  };
}

/**
 * Envia notificações de andamento para cliente
 */
export async function enviarNotificacaoAndamento(
  andamentoId: string,
  options: {
    notificarWhatsapp?: boolean;
    notificarEmail?: boolean;
    mensagemPersonalizada?: string;
  } = {},
): Promise<NotificacaoResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    // Busca o andamento com dados do processo e cliente
    const andamento = await prisma.movimentacaoProcesso.findFirst({
      where: {
        id: andamentoId,
        tenantId: session.user.tenantId,
      },
      include: {
        processo: {
          include: {
            cliente: true,
          },
        },
        criadoPor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!andamento) {
      return {
        success: false,
        error: "Andamento não encontrado",
      };
    }

    const cliente = andamento.processo.cliente;
    const resultado: NotificacaoResult = {
      success: true,
    };

    // Envia WhatsApp se solicitado e cliente tem telefone
    if (options.notificarWhatsapp && cliente.celular) {
      try {
        const whatsappResult = await sendAndamentoNotification(
          cliente.celular,
          {
            titulo: andamento.titulo,
            descricao: andamento.descricao || undefined,
            processo: {
              numero: andamento.processo.numero,
              titulo: andamento.processo.titulo || undefined,
            },
            dataMovimentacao: andamento.dataMovimentacao,
            mensagemPersonalizada: options.mensagemPersonalizada,
          },
        );

        resultado.whatsapp = {
          success: whatsappResult.success,
          error: whatsappResult.error,
          provider: whatsappResult.provider,
        };

        // Atualiza o andamento com status da notificação
        await prisma.movimentacaoProcesso.update({
          where: { id: andamentoId },
          data: {
            notificarWhatsapp: true,
            mensagemPersonalizada: options.mensagemPersonalizada,
          },
        });
      } catch (error) {
        resultado.whatsapp = {
          success: false,
          error:
            error instanceof Error ? error.message : "Erro ao enviar WhatsApp",
        };
      }
    }

    // Envia email se solicitado e cliente tem email
    if (options.notificarEmail && cliente.email) {
      try {
        const emailResult = await sendAndamentoEmailNotification(
          cliente.email,
          {
            titulo: andamento.titulo,
            descricao: andamento.descricao || undefined,
            processo: {
              numero: andamento.processo.numero,
              titulo: andamento.processo.titulo || undefined,
            },
            dataMovimentacao: andamento.dataMovimentacao,
            mensagemPersonalizada: options.mensagemPersonalizada,
          },
          cliente.nome,
          session.user.tenantName || "Escritório de Advocacia",
        );

        resultado.email = {
          success: emailResult.success,
          error: emailResult.error,
          provider: emailResult.provider,
        };

        // Atualiza o andamento com status da notificação
        await prisma.movimentacaoProcesso.update({
          where: { id: andamentoId },
          data: {
            notificarEmail: true,
          },
        });
      } catch (error) {
        resultado.email = {
          success: false,
          error:
            error instanceof Error ? error.message : "Erro ao enviar email",
        };
      }
    }

    // Se nenhuma notificação foi solicitada
    if (!options.notificarWhatsapp && !options.notificarEmail) {
      return {
        success: false,
        error: "Nenhuma notificação foi solicitada",
      };
    }

    // Verifica se pelo menos uma notificação foi enviada com sucesso
    const whatsappSuccess = resultado.whatsapp?.success ?? true;
    const emailSuccess = resultado.email?.success ?? true;

    resultado.success = whatsappSuccess && emailSuccess;

    revalidatePath("/andamentos");

    return resultado;
  } catch (error) {
    console.error("Erro ao enviar notificação de andamento:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

/**
 * Testa envio de WhatsApp para número específico
 */
export async function testarWhatsApp(
  numero: string,
  mensagem: string = "Teste de integração WhatsApp - Magic Lawyer",
): Promise<{ success: boolean; error?: string; provider?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const resultado = await whatsappService.sendMessage({
      to: whatsappService.formatPhoneNumber(numero),
      message: mensagem,
      type: "text",
    });

    return {
      success: resultado.success,
      error: resultado.error,
      provider: resultado.provider,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

/**
 * Testa envio de email para endereço específico
 */
export async function testarEmail(
  email: string,
  assunto: string = "Teste de integração Email - Magic Lawyer",
  mensagem: string = "Este é um teste de integração do sistema de emails do Magic Lawyer.",
): Promise<{ success: boolean; error?: string; provider?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const resultado = await emailService.sendEmail({
      to: email,
      subject: assunto,
      html: `
        <h2>Teste de Integração</h2>
        <p>${mensagem}</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <p><strong>Tenant:</strong> ${session.user.tenantName || "N/A"}</p>
      `,
      text: `${mensagem}\n\nData/Hora: ${new Date().toLocaleString("pt-BR")}\nTenant: ${session.user.tenantName || "N/A"}`,
    });

    return {
      success: resultado.success,
      error: resultado.error,
      provider: resultado.provider,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

/**
 * Obtém status dos provedores de notificação
 */
export async function obterStatusProvedores(): Promise<{
  whatsapp: Array<{ name: string; configured: boolean }>;
  email: Array<{ name: string; configured: boolean }>;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      throw new Error("Usuário não autenticado");
    }

    return {
      whatsapp: whatsappService.getProvidersStatus(),
      email: emailService.getProvidersStatus(),
    };
  } catch (error) {
    console.error("Erro ao obter status dos provedores:", error);

    return {
      whatsapp: [],
      email: [],
    };
  }
}

/**
 * Envia notificação em lote para múltiplos andamentos
 */
export async function enviarNotificacoesLote(
  andamentoIds: string[],
  options: {
    notificarWhatsapp?: boolean;
    notificarEmail?: boolean;
    mensagemPersonalizada?: string;
  } = {},
): Promise<{
  success: boolean;
  resultados: Array<{
    andamentoId: string;
    success: boolean;
    error?: string;
  }>;
  resumo: {
    total: number;
    sucessos: number;
    falhas: number;
  };
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return {
        success: false,
        resultados: [],
        resumo: { total: 0, sucessos: 0, falhas: 0 },
      };
    }

    const resultados = [];
    let sucessos = 0;
    let falhas = 0;

    for (const andamentoId of andamentoIds) {
      try {
        const resultado = await enviarNotificacaoAndamento(
          andamentoId,
          options,
        );

        resultados.push({
          andamentoId,
          success: resultado.success,
          error: resultado.error,
        });

        if (resultado.success) {
          sucessos++;
        } else {
          falhas++;
        }
      } catch (error) {
        resultados.push({
          andamentoId,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
        falhas++;
      }
    }

    return {
      success: falhas === 0,
      resultados,
      resumo: {
        total: andamentoIds.length,
        sucessos,
        falhas,
      },
    };
  } catch (error) {
    console.error("Erro ao enviar notificações em lote:", error);

    return {
      success: false,
      resultados: [],
      resumo: { total: 0, sucessos: 0, falhas: 0 },
    };
  }
}

/**
 * Obtém estatísticas de notificações por tenant
 */
export async function obterEstatisticasNotificacoes(): Promise<{
  totalAndamentos: number;
  andamentosComWhatsapp: number;
  andamentosComEmail: number;
  andamentosComNotificacao: number;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      throw new Error("Usuário não autenticado");
    }

    const [
      totalAndamentos,
      andamentosComWhatsapp,
      andamentosComEmail,
      andamentosComNotificacao,
    ] = await Promise.all([
      prisma.movimentacaoProcesso.count({
        where: { tenantId: session.user.tenantId },
      }),
      prisma.movimentacaoProcesso.count({
        where: {
          tenantId: session.user.tenantId,
          notificarWhatsapp: true,
        },
      }),
      prisma.movimentacaoProcesso.count({
        where: {
          tenantId: session.user.tenantId,
          notificarEmail: true,
        },
      }),
      prisma.movimentacaoProcesso.count({
        where: {
          tenantId: session.user.tenantId,
          OR: [{ notificarWhatsapp: true }, { notificarEmail: true }],
        },
      }),
    ]);

    return {
      totalAndamentos,
      andamentosComWhatsapp,
      andamentosComEmail,
      andamentosComNotificacao,
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas de notificações:", error);

    return {
      totalAndamentos: 0,
      andamentosComWhatsapp: 0,
      andamentosComEmail: 0,
      andamentosComNotificacao: 0,
    };
  }
}
