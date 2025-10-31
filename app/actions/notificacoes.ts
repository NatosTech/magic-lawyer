"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";
import { emailService } from "@/app/lib/email-service";

export interface NotificacaoResult {
  success: boolean;
  error?: string;
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

    // Envia email se solicitado e cliente tem email
    if (options.notificarEmail && cliente.email) {
      try {
        const assunto = `Atualização do processo ${andamento.processo.numero}`;
        const data = new Date(andamento.dataMovimentacao);
        const dataFormatada = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const descricao = andamento.descricao
          ? `<p style=\"margin: 8px 0; color: #374151;\">${andamento.descricao}</p>`
          : "";
        const mensagemPersonalizada = options.mensagemPersonalizada
          ? `<div style=\"margin-top: 20px; padding: 16px; border-left: 4px solid #3b82f6; background: #eff6ff; border-radius: 8px;\">
               <p style=\"margin: 0; font-weight: 600; color: #1d4ed8;\">Mensagem do escritório:</p>
               <p style=\"margin: 8px 0 0; color: #1e40af;\">${options.mensagemPersonalizada}</p>
             </div>`
          : "";

        const html = `
          <!DOCTYPE html>
          <html>
            <head><meta charset=\"utf-8\" /></head>
            <body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 24px; color: #111827;\">
              <div style=\"max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); overflow: hidden;\">
                <div style=\"background: linear-gradient(135deg, #0ea5e9, #2563eb); padding: 24px;\">
                  <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;\">Atualização de andamento</h1>
                  <p style=\"margin: 4px 0 0; color: rgba(255,255,255,0.85);\">${session.user.tenantName || "Escritório de Advocacia"}</p>
                </div>
                <div style=\"padding: 24px;\">
                  <p>Olá, <strong>${cliente.nome}</strong></p>
                  <p>O processo <strong>${andamento.processo.numero}</strong> ${andamento.processo.titulo ? `(${andamento.processo.titulo})` : ""} recebeu uma nova atualização:</p>
                  <div style=\"margin: 20px 0; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc;\">
                    <p style=\"margin: 0; font-size: 16px; font-weight: 600; color: #1d4ed8;\">${andamento.titulo}</p>
                    ${descricao}
                    <p style=\"margin: 8px 0 0; font-size: 14px; color: #64748b;\">Data da movimentação: <strong>${dataFormatada}</strong> às <strong>${horaFormatada}</strong></p>
                  </div>
                  ${mensagemPersonalizada}
                </div>
                <div style=\"padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #94a3b8;\">
                  <p style=\"margin: 0;\">${session.user.tenantName || "Escritório de Advocacia"}</p>
                  <p style=\"margin: 4px 0 0;\">Este email foi enviado automaticamente pelo Magic Lawyer.</p>
                </div>
              </div>
            </body>
          </html>`;

        const emailResult = await emailService.sendEmailPerTenant(session.user.tenantId, {
          to: cliente.email,
          subject: assunto,
          html,
          credentialType: "DEFAULT",
          fromNameFallback: session.user.tenantName || "Magic Lawyer",
        });

        resultado.email = {
          success: emailResult.success,
          error: emailResult.error,
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
    if (!options.notificarEmail) {
      return {
        success: false,
        error: "Nenhuma notificação foi solicitada",
      };
    }

    // Verifica se pelo menos uma notificação foi enviada com sucesso
    const emailSuccess = resultado.email?.success ?? true;

    resultado.success = emailSuccess;

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

    const resultado = await emailService.sendEmailPerTenant(session.user.tenantId, {
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
      provider: undefined,
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
  email: Array<{ name: string; configured: boolean }>;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      throw new Error("Usuário não autenticado");
    }

    return {
      email: await emailService.getProvidersStatus(session.user.tenantId),
    };
  } catch (error) {
    console.error("Erro ao obter status dos provedores:", error);

    return {
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
