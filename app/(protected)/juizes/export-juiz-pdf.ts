import type { JuizSerializado } from "@/app/actions/juizes";

import jsPDF from "jspdf";

/**
 * Exporta os dados de um juiz para PDF com layout profissional e elegante
 * @param juiz - Dados serializados do juiz
 * @returns Promise que resolve quando o PDF é baixado
 */
export async function exportJuizToPDF(juiz: JuizSerializado): Promise<void> {
  const doc = new jsPDF();

  let y = 20;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ========== CORES SOFISTICADAS ==========
  const colors = {
    dark: [30, 30, 35], // Cinza escuro elegante
    accent: [139, 92, 246], // Roxo sofisticado
    gold: [251, 191, 36], // Dourado
    lightGray: [248, 250, 252], // Cinza muito claro
    text: [51, 51, 51], // Texto escuro
    textLight: [107, 114, 128], // Texto secundário
  } as const;

  // ========== CABEÇALHO ELEGANTE ==========
  // Background escuro sofisticado
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 65, "F");

  // Linha de acento dourada
  doc.setFillColor(...colors.gold);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Se tiver foto, adicionar com borda elegante
  if (juiz.foto) {
    try {
      const fotoSize = 45;
      const fotoX = pageWidth - margin - fotoSize;
      const fotoY = 10;

      // Borda branca ao redor da foto
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        fotoX - 2,
        fotoY - 2,
        fotoSize + 4,
        fotoSize + 4,
        3,
        3,
        "F",
      );

      // Foto
      doc.addImage(juiz.foto, "JPEG", fotoX, fotoY, fotoSize, fotoSize);
    } catch (error) {
      console.log("Não foi possível adicionar a foto ao PDF");
    }
  }

  // Nome do juiz em destaque
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(juiz.nome, margin, 28);

  // Nome completo
  if (juiz.nomeCompleto) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(juiz.nomeCompleto, margin, 38);
  }

  // OAB e Status em chips
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let chipX = margin;

  if (juiz.oab) {
    doc.setFillColor(...colors.accent);
    doc.roundedRect(chipX, 48, 45, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(`OAB: ${juiz.oab}`, chipX + 2, 53);
    chipX += 48;
  }

  doc.setFillColor(...colors.gold);
  doc.roundedRect(chipX, 48, 35, 8, 2, 2, "F");
  doc.setTextColor(30, 30, 35);
  doc.text(juiz.nivel.replace(/_/g, " "), chipX + 2, 53);

  // ========== CONTEÚDO ==========
  y = 75;
  doc.setTextColor(...colors.text);

  // Função auxiliar para adicionar campos com estilo melhorado
  const addField = (
    label: string,
    value: string | null | undefined,
    bold = false,
    highlight = false,
  ) => {
    if (value) {
      // Verificar se precisa de nova página
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      // Label com cor de destaque
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.textLight);
      doc.text(label, margin + 2, y);

      // Valor com destaque opcional
      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...colors.text);

      if (highlight) {
        // Background sutil para campos importantes
        doc.setFillColor(...colors.lightGray);
        const valueLines = doc.splitTextToSize(value, contentWidth - 6);
        const boxHeight = valueLines.length * lineHeight + 2;

        doc.roundedRect(margin, y - 4, contentWidth, boxHeight, 1, 1, "F");
      }

      const lines = doc.splitTextToSize(value, contentWidth - 6);

      doc.text(lines, margin + 2, y);
      y += lines.length * lineHeight + 3;
    }
  };

  // Função para adicionar seção com estilo elegante
  const addSection = (title: string) => {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    y += 5;

    // Linha de acento roxa à esquerda
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(3);
    doc.line(margin, y - 2, margin, y + 6);

    // Título estilizado
    doc.setTextColor(...colors.dark);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 5, y + 4);

    // Linha sutil abaixo do título
    doc.setDrawColor(...colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);

    doc.setTextColor(...colors.text);
    y += 14;
  };

  // ========== SEÇÃO: INFORMAÇÕES PRINCIPAIS ==========
  addSection("Informações Principais");

  addField("Vara", juiz.vara, true, true);
  addField("Comarca", juiz.comarca, true, false);
  addField(
    "Cidade/Estado",
    juiz.cidade && juiz.estado ? `${juiz.cidade}, ${juiz.estado}` : null,
  );
  addField("Endereço", juiz.endereco);
  addField("CEP", juiz.cep);

  y += 3;

  // ========== SEÇÃO: DADOS PESSOAIS ==========
  addSection("Dados Pessoais");

  addField("CPF", juiz.cpf);
  addField("OAB", juiz.oab, true, true);
  addField("E-mail", juiz.email, false, false);
  addField("Telefone", juiz.telefone);

  y += 3;

  // ========== SEÇÃO: CLASSIFICAÇÃO ==========
  addSection("Classificação");

  addField("Status", juiz.status);
  addField("Nível", juiz.nivel?.replace(/_/g, " "));

  // Datas importantes
  if (juiz.dataNascimento) {
    addField(
      "Data de Nascimento",
      new Date(juiz.dataNascimento).toLocaleDateString("pt-BR"),
    );
  }
  if (juiz.dataPosse) {
    addField(
      "Data de Posse",
      new Date(juiz.dataPosse).toLocaleDateString("pt-BR"),
    );
  }
  if (juiz.dataAposentadoria) {
    addField(
      "Data de Aposentadoria",
      new Date(juiz.dataAposentadoria).toLocaleDateString("pt-BR"),
    );
  }

  y += 3;

  // ========== SEÇÃO: ESPECIALIDADES ==========
  if (juiz.especialidades && juiz.especialidades.length > 0) {
    addSection("Especialidades Jurídicas");

    // Background para especialidades
    const especialidadesText = juiz.especialidades
      .map((e) => e.replace(/_/g, " "))
      .join(" • ");
    const especialidadesLines = doc.splitTextToSize(
      especialidadesText,
      contentWidth - 4,
    );

    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(
      margin,
      y - 3,
      contentWidth,
      especialidadesLines.length * lineHeight + 4,
      2,
      2,
      "F",
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.accent);
    doc.text(especialidadesLines, margin + 2, y);
    y += especialidadesLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: BIOGRAFIA ==========
  if (juiz.biografia) {
    addSection("Biografia");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const biografiaLines = doc.splitTextToSize(
      juiz.biografia,
      contentWidth - 4,
    );

    doc.text(biografiaLines, margin + 2, y);
    y += biografiaLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: FORMAÇÃO ==========
  if (juiz.formacao) {
    addSection("Formação Acadêmica");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const formacaoLines = doc.splitTextToSize(juiz.formacao, contentWidth - 4);

    doc.text(formacaoLines, margin + 2, y);
    y += formacaoLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: EXPERIÊNCIA ==========
  if (juiz.experiencia) {
    addSection("Experiência Profissional");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const experienciaLines = doc.splitTextToSize(
      juiz.experiencia,
      contentWidth - 4,
    );

    doc.text(experienciaLines, margin + 2, y);
    y += experienciaLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: PRÊMIOS ==========
  if (juiz.premios) {
    addSection("Prêmios e Reconhecimentos");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const premiosLines = doc.splitTextToSize(juiz.premios, contentWidth - 4);

    doc.text(premiosLines, margin + 2, y);
    y += premiosLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: PUBLICAÇÕES ==========
  if (juiz.publicacoes) {
    addSection("Publicações");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const publicacoesLines = doc.splitTextToSize(
      juiz.publicacoes,
      contentWidth - 4,
    );

    doc.text(publicacoesLines, margin + 2, y);
    y += publicacoesLines.length * lineHeight + 5;
  }

  // ========== SEÇÃO: LINKS E REDES SOCIAIS ==========
  if (juiz.website || juiz.linkedin || juiz.twitter || juiz.instagram) {
    addSection("Links e Redes Sociais");

    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    if (juiz.website) addField("Website", juiz.website);
    if (juiz.linkedin) addField("LinkedIn", juiz.linkedin);
    if (juiz.twitter) addField("Twitter", juiz.twitter);
    if (juiz.instagram) addField("Instagram", juiz.instagram);
    y += 3;
  }

  // ========== SEÇÃO: OBSERVAÇÕES ==========
  if (juiz.observacoes) {
    addSection("Observações Adicionais");

    // Card de observações
    const observacoesLines = doc.splitTextToSize(
      juiz.observacoes,
      contentWidth - 8,
    );

    doc.setFillColor(255, 252, 240); // Tom amarelo claro
    doc.roundedRect(
      margin,
      y - 3,
      contentWidth,
      observacoesLines.length * lineHeight + 6,
      2,
      2,
      "F",
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...colors.text);
    doc.text(observacoesLines, margin + 4, y);
    y += observacoesLines.length * lineHeight + 5;
  }

  // ========== RODAPÉ ELEGANTE ==========
  const addFooter = (pageNum: number) => {
    // Background claro
    doc.setFillColor(...colors.lightGray);
    doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

    // Linha superior dourada
    doc.setDrawColor(...colors.gold);
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

    doc.setTextColor(...colors.textLight);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    // Data de geração
    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const horaGeracao = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.text(`${dataGeracao} • ${horaGeracao}`, margin, pageHeight - 11);

    // Branding
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.text("Magic Lawyer", pageWidth - margin - 25, pageHeight - 11);

    // Número da página em círculo
    doc.setFillColor(...colors.accent);
    doc.circle(pageWidth / 2, pageHeight - 11, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${pageNum}`, pageWidth / 2 - 1.5, pageHeight - 9);
  };

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // ========== DOWNLOAD ==========
  const nomeArquivo = juiz.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim

  const filename = `juiz-${nomeArquivo}.pdf`;

  doc.save(filename);
}
