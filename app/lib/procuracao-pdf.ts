import { jsPDF } from "jspdf";

import { ProcuracaoEmitidaPor, ProcuracaoStatus, TipoPessoa } from "@/generated/prisma";

interface ProcuracaoPdfInput {
  numero?: string | null;
  status: ProcuracaoStatus;
  emitidaPor: ProcuracaoEmitidaPor;
  emitidaEm?: Date | null;
  validaAte?: Date | null;
  revogadaEm?: Date | null;
  observacoes?: string | null;
  createdAt: Date;
  modeloNomeSnapshot?: string | null;
  modeloConteudoSnapshot?: string | null;
  modeloVersaoSnapshot?: number | null;
  cliente: {
    nome: string;
    documento?: string | null;
    email?: string | null;
    telefone?: string | null;
    tipoPessoa: TipoPessoa;
  };
  outorgados: Array<{
    nome: string;
    oabNumero?: string | null;
    oabUf?: string | null;
  }>;
  poderes: Array<{
    titulo?: string | null;
    descricao: string;
  }>;
}

function formatDate(value?: Date | null): string {
  if (!value) return "Não informado";
  return new Date(value).toLocaleDateString("pt-BR");
}

function normalizeText(value?: string | null): string {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r\n/g, "\n")
    .trim();
}

function statusLabel(status: ProcuracaoStatus): string {
  switch (status) {
    case ProcuracaoStatus.VIGENTE:
      return "Vigente";
    case ProcuracaoStatus.REVOGADA:
      return "Revogada";
    case ProcuracaoStatus.EXPIRADA:
      return "Expirada";
    case ProcuracaoStatus.PENDENTE_ASSINATURA:
      return "Pendente assinatura";
    case ProcuracaoStatus.RASCUNHO:
    default:
      return "Rascunho";
  }
}

function origemLabel(emitidaPor: ProcuracaoEmitidaPor): string {
  return emitidaPor === ProcuracaoEmitidaPor.ADVOGADO
    ? "Emitida por Advogado"
    : "Emitida pelo Escritório";
}

export function gerarPdfProcuracaoBuffer(input: ProcuracaoPdfInput): Buffer {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const margin = 48;
  const lineWidth = 500;
  let cursorY = margin;

  const ensurePageSpace = (required = 20) => {
    if (cursorY + required <= 792 - margin) {
      return;
    }

    doc.addPage();
    cursorY = margin;
  };

  const addLine = (text: string, size = 11, weight: "normal" | "bold" = "normal") => {
    ensurePageSpace(size + 8);
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.text(text, margin, cursorY);
    cursorY += size + 7;
  };

  const addParagraph = (text: string, size = 10) => {
    const normalized = normalizeText(text);
    if (!normalized) return;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(normalized, lineWidth);
    const lineHeight = size + 5;

    lines.forEach((line: string) => {
      ensurePageSpace(lineHeight);
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
  };

  const addSectionTitle = (title: string) => {
    cursorY += 8;
    addLine(title, 12, "bold");
  };

  addLine("PROCURAÇÃO", 18, "bold");
  addLine(`Número: ${input.numero || "Sem número"}`, 11, "normal");
  addLine(`Status: ${statusLabel(input.status)}`, 11, "normal");
  addLine(`Origem: ${origemLabel(input.emitidaPor)}`, 11, "normal");
  addLine(`Emitida em: ${formatDate(input.emitidaEm)}`, 11, "normal");
  addLine(`Válida até: ${formatDate(input.validaAte)}`, 11, "normal");
  if (input.revogadaEm) {
    addLine(`Revogada em: ${formatDate(input.revogadaEm)}`, 11, "normal");
  }
  addLine(`Gerado em: ${formatDate(new Date())}`, 11, "normal");

  addSectionTitle("Outorgante");
  addLine(`Nome: ${input.cliente.nome}`, 11);
  addLine(
    `Tipo: ${input.cliente.tipoPessoa === TipoPessoa.JURIDICA ? "Pessoa Jurídica" : "Pessoa Física"}`,
    11,
  );
  addLine(`Documento: ${input.cliente.documento || "Não informado"}`, 11);
  addLine(`E-mail: ${input.cliente.email || "Não informado"}`, 11);
  addLine(`Telefone: ${input.cliente.telefone || "Não informado"}`, 11);

  if (input.outorgados.length > 0) {
    addSectionTitle("Outorgados");
    input.outorgados.forEach((outorgado, index) => {
      addLine(`${index + 1}. ${outorgado.nome || "Não informado"}`, 11);
      const oab =
        outorgado.oabNumero && outorgado.oabUf
          ? `OAB ${outorgado.oabUf}/${outorgado.oabNumero}`
          : "OAB não informada";
      addLine(`   ${oab}`, 10);
    });
  }

  if (input.poderes.length > 0) {
    addSectionTitle("Poderes Outorgados");
    input.poderes.forEach((poder, index) => {
      const titulo = poder.titulo?.trim();
      addLine(
        `${index + 1}. ${titulo ? `${titulo}: ` : ""}${poder.descricao}`,
        10,
      );
    });
  }

  addSectionTitle("Conteúdo do Modelo");
  if (input.modeloNomeSnapshot) {
    addLine(`Modelo: ${input.modeloNomeSnapshot}`, 10);
  }
  if (typeof input.modeloVersaoSnapshot === "number") {
    addLine(`Versão aplicada: v${input.modeloVersaoSnapshot}`, 10);
  }
  if (input.modeloConteudoSnapshot) {
    addParagraph(input.modeloConteudoSnapshot, 10);
  } else {
    addLine("Nenhum conteúdo de modelo foi salvo nesta procuração.", 10);
  }

  if (input.observacoes) {
    addSectionTitle("Observações");
    addParagraph(input.observacoes, 10);
  }

  addSectionTitle("Controle");
  addLine(
    `Registro criado em ${formatDate(input.createdAt)} no Magic Lawyer.`,
    9,
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
