"use server";

import { getServerSession } from "next-auth/next";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import logger from "@/lib/logger";

// ==================== TIPOS ====================

export type ConfiguracaoPreco = {
  id: string;
  chave: string;
  valor: string;
  tipo: string;
  descricao: string | null;
  categoria: string;
  isAtivo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GetConfiguracoesResponse = {
  success: boolean;
  data?: ConfiguracaoPreco[];
  error?: string;
};

export type GetConfiguracaoResponse = {
  success: boolean;
  data?: ConfiguracaoPreco;
  error?: string;
};

export type UpdateConfiguracaoResponse = {
  success: boolean;
  data?: ConfiguracaoPreco;
  error?: string;
};

export type BulkUpdateConfiguracoesResponse = {
  success: boolean;
  data?: ConfiguracaoPreco[];
  error?: string;
};

// ==================== FUNÇÕES AUXILIARES ====================

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "SUPER_ADMIN") {
    throw new Error(
      "Acesso negado. Apenas Super Admins podem gerenciar configurações de preço.",
    );
  }

  return session.user.id;
}

function parseConfigValue(valor: string, tipo: string) {
  switch (tipo) {
    case "DECIMAL":
      return parseFloat(valor);
    case "INTEGER":
      return parseInt(valor, 10);
    case "BOOLEAN":
      return valor.toLowerCase() === "true";
    case "STRING":
    default:
      return valor;
  }
}

// ==================== CRUD CONFIGURAÇÕES ====================

export async function getConfiguracoes(
  categoria?: string,
): Promise<GetConfiguracoesResponse> {
  try {
    await ensureSuperAdmin();

    const where = categoria ? { categoria } : {};

    const configuracoes = await prisma.configuracaoPreco.findMany({
      where,
      orderBy: [{ categoria: "asc" }, { chave: "asc" }],
    });

    return {
      success: true,
      data: configuracoes,
    };
  } catch (error) {
    logger.error("Erro ao buscar configurações:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function getConfiguracaoPorChave(
  chave: string,
): Promise<GetConfiguracaoResponse> {
  try {
    await ensureSuperAdmin();

    const configuracao = await prisma.configuracaoPreco.findUnique({
      where: { chave },
    });

    if (!configuracao) {
      return {
        success: false,
        error: "Configuração não encontrada",
      };
    }

    return {
      success: true,
      data: configuracao,
    };
  } catch (error) {
    logger.error("Erro ao buscar configuração:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function updateConfiguracao(
  chave: string,
  valor: string,
): Promise<UpdateConfiguracaoResponse> {
  try {
    const superAdminId = await ensureSuperAdmin();

    // Verificar se a configuração existe
    const configuracaoExistente = await prisma.configuracaoPreco.findUnique({
      where: { chave },
    });

    if (!configuracaoExistente) {
      return {
        success: false,
        error: "Configuração não encontrada",
      };
    }

    // Validar valor baseado no tipo
    try {
      parseConfigValue(valor, configuracaoExistente.tipo);
    } catch (error) {
      return {
        success: false,
        error: `Valor inválido para o tipo ${configuracaoExistente.tipo}`,
      };
    }

    const configuracao = await prisma.configuracaoPreco.update({
      where: { chave },
      data: {
        valor,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: configuracao,
    };
  } catch (error) {
    logger.error("Erro ao atualizar configuração:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

export async function bulkUpdateConfiguracoes(
  configuracoes: Array<{ chave: string; valor: string }>,
): Promise<BulkUpdateConfiguracoesResponse> {
  try {
    const superAdminId = await ensureSuperAdmin();

    const configuracoesAtualizadas: ConfiguracaoPreco[] = [];

    for (const config of configuracoes) {
      const configuracaoExistente = await prisma.configuracaoPreco.findUnique({
        where: { chave: config.chave },
      });

      if (configuracaoExistente) {
        // Validar valor baseado no tipo
        try {
          parseConfigValue(config.valor, configuracaoExistente.tipo);
        } catch (error) {
          return {
            success: false,
            error: `Valor inválido para ${config.chave}: ${error}`,
          };
        }

        const configuracao = await prisma.configuracaoPreco.update({
          where: { chave: config.chave },
          data: {
            valor: config.valor,
            updatedAt: new Date(),
          },
        });

        configuracoesAtualizadas.push(configuracao);
      }
    }

    return {
      success: true,
      data: configuracoesAtualizadas,
    };
  } catch (error) {
    logger.error("Erro ao atualizar configurações em lote:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
    };
  }
}

// ==================== FUNÇÕES DE UTILIDADE ====================

export async function getConfiguracaoValor(
  chave: string,
): Promise<string | null> {
  try {
    const configuracao = await prisma.configuracaoPreco.findUnique({
      where: {
        chave,
        isAtivo: true,
      },
      select: {
        valor: true,
        tipo: true,
      },
    });

    return configuracao?.valor || null;
  } catch (error) {
    logger.error(`Erro ao buscar valor da configuração ${chave}:`, error);

    return null;
  }
}

export async function getConfiguracaoValorNumerico(
  chave: string,
): Promise<number | null> {
  try {
    const configuracao = await prisma.configuracaoPreco.findUnique({
      where: {
        chave,
        isAtivo: true,
      },
      select: {
        valor: true,
        tipo: true,
      },
    });

    if (!configuracao) {
      return null;
    }

    const valor = parseConfigValue(configuracao.valor, configuracao.tipo);

    return typeof valor === "number" ? valor : null;
  } catch (error) {
    logger.error(
      `Erro ao buscar valor numérico da configuração ${chave}:`,
      error,
    );

    return null;
  }
}

export async function getConfiguracaoValorBoolean(
  chave: string,
): Promise<boolean | null> {
  try {
    const configuracao = await prisma.configuracaoPreco.findUnique({
      where: {
        chave,
        isAtivo: true,
      },
      select: {
        valor: true,
        tipo: true,
      },
    });

    if (!configuracao) {
      return null;
    }

    const valor = parseConfigValue(configuracao.valor, configuracao.tipo);

    return typeof valor === "boolean" ? valor : null;
  } catch (error) {
    logger.error(
      `Erro ao buscar valor booleano da configuração ${chave}:`,
      error,
    );

    return null;
  }
}

// ==================== CONFIGURAÇÕES PRÉ-DEFINIDAS ====================

export async function getTaxasSistema() {
  try {
    const [taxaCartao, taxaBoleto, taxaPix, descontoAnual] = await Promise.all([
      getConfiguracaoValorNumerico("taxa_processamento_cartao"),
      getConfiguracaoValorNumerico("taxa_processamento_boleto"),
      getConfiguracaoValorNumerico("taxa_processamento_pix"),
      getConfiguracaoValorNumerico("desconto_pagamento_anual"),
    ]);

    return {
      taxaCartao: taxaCartao || 3.49,
      taxaBoleto: taxaBoleto || 2.49,
      taxaPix: taxaPix || 1.49,
      descontoAnual: descontoAnual || 16.67,
    };
  } catch (error) {
    logger.error("Erro ao buscar taxas do sistema:", error);

    return {
      taxaCartao: 3.49,
      taxaBoleto: 2.49,
      taxaPix: 1.49,
      descontoAnual: 16.67,
    };
  }
}

export async function getPrecosJuizes() {
  try {
    const [precoConsulta, precoDownload, precoAnalise, multiplicadorPremium] =
      await Promise.all([
        getConfiguracaoValorNumerico("preco_base_consulta_juiz"),
        getConfiguracaoValorNumerico("preco_base_download_juiz"),
        getConfiguracaoValorNumerico("preco_base_analise_juiz"),
        getConfiguracaoValorNumerico("multiplicador_juiz_premium"),
      ]);

    return {
      precoConsulta: precoConsulta || 29.9,
      precoDownload: precoDownload || 49.9,
      precoAnalise: precoAnalise || 99.9,
      multiplicadorPremium: multiplicadorPremium || 2.0,
    };
  } catch (error) {
    logger.error("Erro ao buscar preços de juízes:", error);

    return {
      precoConsulta: 29.9,
      precoDownload: 49.9,
      precoAnalise: 99.9,
      multiplicadorPremium: 2.0,
    };
  }
}

export async function getConfiguracoesPacotes() {
  try {
    const [trialPeriodo, cobrancaAutomatica, toleranciaVencimento] =
      await Promise.all([
        getConfiguracaoValorNumerico("trial_periodo_dias"),
        getConfiguracaoValorBoolean("cobranca_automatica_ativa"),
        getConfiguracaoValorNumerico("tolerancia_vencimento_dias"),
      ]);

    return {
      trialPeriodo: trialPeriodo || 14,
      cobrancaAutomatica: cobrancaAutomatica ?? true,
      toleranciaVencimento: toleranciaVencimento || 7,
    };
  } catch (error) {
    logger.error("Erro ao buscar configurações de pacotes:", error);

    return {
      trialPeriodo: 14,
      cobrancaAutomatica: true,
      toleranciaVencimento: 7,
    };
  }
}
