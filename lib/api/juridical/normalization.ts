/**
 * Serviço de normalização de dados jurídicos
 * 
 * Converte dados de diferentes sistemas (PJe, e-SAJ, eProc, etc.)
 * para um formato unificado e padronizado
 */

import { MovimentacaoProcesso, ProcessoJuridico } from "./types";

export enum TipoMovimentacao {
  PRAZO = "PRAZO",
  AUDIENCIA = "AUDIENCIA",
  SENTENCA = "SENTENCA",
  INTIMACAO = "INTIMACAO",
  DECISAO = "DECISAO",
  DESPACHO = "DESPACHO",
  OUTRO = "OUTRO",
}

/**
 * Dicionário de movimentações e suas categorias
 */
const DICIONARIO_MOVIMENTACOES: Record<string, { tipo: TipoMovimentacao; categoria: string }> = {
  // Prazos
  "prazo": { tipo: TipoMovimentacao.PRAZO, categoria: "PRAZO" },
  "prazo para": { tipo: TipoMovimentacao.PRAZO, categoria: "PRAZO" },
  "prazo de": { tipo: TipoMovimentacao.PRAZO, categoria: "PRAZO" },
  "intimação": { tipo: TipoMovimentacao.INTIMACAO, categoria: "INTIMACAO" },
  "intimado": { tipo: TipoMovimentacao.INTIMACAO, categoria: "INTIMACAO" },
  "intimação para": { tipo: TipoMovimentacao.INTIMACAO, categoria: "INTIMACAO" },

  // Audiências
  "audiência": { tipo: TipoMovimentacao.AUDIENCIA, categoria: "AUDIENCIA" },
  "audiência de": { tipo: TipoMovimentacao.AUDIENCIA, categoria: "AUDIENCIA" },
  "audiência unificada": { tipo: TipoMovimentacao.AUDIENCIA, categoria: "AUDIENCIA" },
  "audiência de conciliação": { tipo: TipoMovimentacao.AUDIENCIA, categoria: "AUDIENCIA" },
  "audiência de instrução": { tipo: TipoMovimentacao.AUDIENCIA, categoria: "AUDIENCIA" },

  // Sentenças
  "sentença": { tipo: TipoMovimentacao.SENTENCA, categoria: "SENTENCA" },
  "sentença de": { tipo: TipoMovimentacao.SENTENCA, categoria: "SENTENCA" },
  "sentença proferida": { tipo: TipoMovimentacao.SENTENCA, categoria: "SENTENCA" },

  // Decisões
  "decisão": { tipo: TipoMovimentacao.DECISAO, categoria: "OUTRO" },
  "decisão de": { tipo: TipoMovimentacao.DECISAO, categoria: "OUTRO" },
  "decisão monocrática": { tipo: TipoMovimentacao.DECISAO, categoria: "OUTRO" },

  // Despachos
  "despacho": { tipo: TipoMovimentacao.DESPACHO, categoria: "OUTRO" },
  "despacho de": { tipo: TipoMovimentacao.DESPACHO, categoria: "OUTRO" },
};

/**
 * Normaliza tipo de movimentação
 */
export function normalizarTipoMovimentacao(descricao: string): {
  tipo: TipoMovimentacao;
  categoria: string;
} {
  const descricaoLower = descricao.toLowerCase().trim();

  // Busca no dicionário
  for (const [chave, valor] of Object.entries(DICIONARIO_MOVIMENTACOES)) {
    if (descricaoLower.includes(chave)) {
      return valor;
    }
  }

  // Se não encontrou, retorna OUTRO
  return {
    tipo: TipoMovimentacao.OUTRO,
    categoria: "OUTRO",
  };
}

/**
 * Extrai prazo de vencimento de uma movimentação
 */
export function extrairPrazoVencimento(descricao: string, dataMovimentacao: Date): Date | undefined {
  const descricaoLower = descricao.toLowerCase();

  // Padrões comuns de prazo
  const padroes = [
    /prazo de (\d+) dias/i,
    /(\d+) dias/i,
    /prazo até (\d{2}\/\d{2}\/\d{4})/i,
    /vencimento em (\d{2}\/\d{2}\/\d{4})/i,
  ];

  for (const padrao of padroes) {
    const match = descricao.match(padrao);
    if (match) {
      if (match[1]) {
        // Se é número de dias
        const dias = parseInt(match[1], 10);
        if (!isNaN(dias)) {
          const vencimento = new Date(dataMovimentacao);
          vencimento.setDate(vencimento.getDate() + dias);
          return vencimento;
        }
      }
    }
  }

  return undefined;
}

/**
 * Normaliza movimentação de processo
 */
export function normalizarMovimentacao(
  movimentacao: Partial<MovimentacaoProcesso>,
): MovimentacaoProcesso {
  const descricao = movimentacao.descricao || "";

  const { tipo, categoria } = normalizarTipoMovimentacao(descricao);
  const prazoVencimento = movimentacao.data
    ? extrairPrazoVencimento(descricao, movimentacao.data)
    : undefined;

  // Validar categoria para garantir que seja um dos valores permitidos
  const categoriasValidas: Array<"PRAZO" | "AUDIENCIA" | "SENTENCA" | "INTIMACAO" | "OUTRO"> = [
    "PRAZO",
    "AUDIENCIA",
    "SENTENCA",
    "INTIMACAO",
    "OUTRO",
  ];
  const categoriaValida = categoriasValidas.includes(categoria as any)
    ? (categoria as "PRAZO" | "AUDIENCIA" | "SENTENCA" | "INTIMACAO" | "OUTRO")
    : "OUTRO";

  return {
    data: movimentacao.data || new Date(),
    tipo: movimentacao.tipo || tipo,
    descricao,
    documento: movimentacao.documento,
    linkDocumento: movimentacao.linkDocumento,
    assinadoPor: movimentacao.assinadoPor,
    publicacao: movimentacao.publicacao,
    observacoes: movimentacao.observacoes,
    tipoNormalizado: tipo,
    categoria: categoriaValida,
    prazoVencimento,
  };
}

/**
 * Normaliza processo jurídico
 */
export function normalizarProcesso(processo: Partial<ProcessoJuridico>): ProcessoJuridico {
  return {
    numeroProcesso: processo.numeroProcesso || "",
    numeroAntigo: processo.numeroAntigo,
    tribunalId: processo.tribunalId,
    tribunalNome: processo.tribunalNome,
    tribunalSigla: processo.tribunalSigla,
    esfera: processo.esfera,
    uf: processo.uf,
    vara: processo.vara,
    comarca: processo.comarca,
    classe: processo.classe,
    assunto: processo.assunto,
    valorCausa: processo.valorCausa,
    dataDistribuicao: processo.dataDistribuicao,
    dataAutuacao: processo.dataAutuacao,
    status: processo.status,
    sistema: processo.sistema,
    partes: processo.partes || [],
    movimentacoes:
      processo.movimentacoes?.map((mov) => normalizarMovimentacao(mov)) || [],
    juiz: processo.juiz,
    linkConsulta: processo.linkConsulta,
    documentos: processo.documentos || [],
    ultimaAtualizacao: processo.ultimaAtualizacao || new Date(),
    capturadoEm: processo.capturadoEm || new Date(),
    fonte: processo.fonte || "MANUAL",
  };
}

/**
 * Ordena movimentações por data (mais recente primeiro)
 */
export function ordenarMovimentacoes(
  movimentacoes: MovimentacaoProcesso[],
): MovimentacaoProcesso[] {
  return [...movimentacoes].sort((a, b) => {
    const dataA = a.data.getTime();
    const dataB = b.data.getTime();
    return dataB - dataA; // Mais recente primeiro
  });
}

/**
 * Agrupa movimentações por categoria
 */
export function agruparMovimentacoesPorCategoria(
  movimentacoes: MovimentacaoProcesso[],
): Record<string, MovimentacaoProcesso[]> {
  const grupos: Record<string, MovimentacaoProcesso[]> = {};

  for (const mov of movimentacoes) {
    const categoria = mov.categoria || "OUTRO";
    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }
    grupos[categoria].push(mov);
  }

  return grupos;
}

