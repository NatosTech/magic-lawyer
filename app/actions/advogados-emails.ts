"use server";

import { revalidatePath } from "next/cache";

import { emailService, AdvogadoEmailData } from "@/app/lib/email-service";
import { getAdvogadoById } from "@/app/actions/advogados";

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Envia email de boas-vindas para um advogado
 */
export async function enviarEmailBoasVindas(
  advogadoId: string,
  senhaTemporaria?: string,
): Promise<ActionResponse> {
  try {
    // Buscar dados do advogado
    const result = await getAdvogadoById(advogadoId);

    if (!result.success || !result.data) {
      return { success: false, error: "Advogado não encontrado" };
    }

    const advogado = result.data;
    const nomeCompleto =
      `${advogado.usuario.firstName || ""} ${advogado.usuario.lastName || ""}`.trim() ||
      advogado.usuario.email;
    const oab =
      advogado.oabNumero && advogado.oabUf
        ? `${advogado.oabNumero}/${advogado.oabUf}`
        : "N/A";

    const emailData: AdvogadoEmailData = {
      nome: nomeCompleto,
      email: advogado.usuario.email,
      oab: oab,
      especialidades: advogado.especialidades.map((esp) =>
        esp.replace(/_/g, " "),
      ),
      senhaTemporaria: senhaTemporaria,
      linkLogin: `${process.env.NEXTAUTH_URL || "http://localhost:9192"}/login`,
    };

    const emailSent = await emailService.sendBoasVindasAdvogado(emailData);

    if (emailSent) {
      revalidatePath("/advogados");

      return {
        success: true,
        data: { message: "Email de boas-vindas enviado com sucesso" },
      };
    } else {
      return { success: false, error: "Erro ao enviar email de boas-vindas" };
    }
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);

    return { success: false, error: "Erro interno ao enviar email" };
  }
}

/**
 * Envia notificação por email para um advogado
 */
export async function enviarNotificacaoEmail(
  advogadoId: string,
  tipo: string,
  titulo: string,
  mensagem: string,
  linkAcao?: string,
  textoAcao?: string,
): Promise<ActionResponse> {
  try {
    // Buscar dados do advogado
    const result = await getAdvogadoById(advogadoId);

    if (!result.success || !result.data) {
      return { success: false, error: "Advogado não encontrado" };
    }

    const advogado = result.data;
    const nomeCompleto =
      `${advogado.usuario.firstName || ""} ${advogado.usuario.lastName || ""}`.trim() ||
      advogado.usuario.email;

    const emailSent = await emailService.sendNotificacaoAdvogado({
      nome: nomeCompleto,
      email: advogado.usuario.email,
      tipo,
      titulo,
      mensagem,
      linkAcao,
      textoAcao,
    });

    if (emailSent) {
      revalidatePath("/advogados");

      return {
        success: true,
        data: { message: "Notificação por email enviada com sucesso" },
      };
    } else {
      return { success: false, error: "Erro ao enviar notificação por email" };
    }
  } catch (error) {
    console.error("Erro ao enviar notificação por email:", error);

    return { success: false, error: "Erro interno ao enviar notificação" };
  }
}

/**
 * Envia email de boas-vindas para múltiplos advogados
 */
export async function enviarEmailBoasVindasEmLote(
  advogadoIds: string[],
): Promise<
  ActionResponse<{
    sucessos: number;
    erros: number;
    detalhes: Array<{ advogadoId: string; sucesso: boolean; erro?: string }>;
  }>
> {
  try {
    const resultados = await Promise.allSettled(
      advogadoIds.map(async (advogadoId) => {
        const result = await enviarEmailBoasVindas(advogadoId);

        return {
          advogadoId,
          sucesso: result.success,
          erro: result.error,
        };
      }),
    );

    const detalhes = resultados.map((resultado, index) => {
      if (resultado.status === "fulfilled") {
        return resultado.value;
      } else {
        return {
          advogadoId: advogadoIds[index],
          sucesso: false,
          erro: "Erro interno",
        };
      }
    });

    const sucessos = detalhes.filter((d) => d.sucesso).length;
    const erros = detalhes.filter((d) => !d.sucesso).length;

    return {
      success: true,
      data: {
        sucessos,
        erros,
        detalhes,
      },
    };
  } catch (error) {
    console.error("Erro ao enviar emails em lote:", error);

    return { success: false, error: "Erro interno ao enviar emails em lote" };
  }
}

/**
 * Testa a configuração de email
 */
export async function testarConfiguracaoEmail(): Promise<
  ActionResponse<{
    conexaoOk: boolean;
    detalhes: string;
  }>
> {
  try {
    const conexaoOk = await emailService.testConnection();

    return {
      success: true,
      data: {
        conexaoOk,
        detalhes: conexaoOk
          ? "Configuração de email está funcionando corretamente"
          : "Erro na configuração de email. Verifique as variáveis de ambiente SMTP.",
      },
    };
  } catch (error) {
    console.error("Erro ao testar configuração de email:", error);

    return {
      success: false,
      error: "Erro interno ao testar configuração de email",
    };
  }
}
