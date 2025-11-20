"use server";

import * as XLSX from "xlsx";

export interface TemplateProcessosResponse {
  base64: string;
  fileName: string;
}

export async function gerarPlanilhaModeloProcessos(): Promise<TemplateProcessosResponse> {
  const rows = [
    [
      "Número do Processo",
      "Classe Processual",
      "Autor (cliente)",
      "E-mail do Autor (opcional)",
      "Réu / Parte contrária",
      "Área (ex: Cível, Trabalhista, Família)",
      "Vara / Órgão julgador",
      "Comarca",
      "Fonte / Observação",
    ],
    [
      "0001234-56.2024.8.26.0100",
      "Procedimento Comum Cível",
      "Maria Souza",
      "maria.souza@email.com",
      "Banco XPTO S/A",
      "Cível",
      "4ª Vara Cível",
      "São Paulo/SP",
      "Exemplo de preenchimento",
    ],
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Processos");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return {
    base64: buffer.toString("base64"),
    fileName: "modelo-importacao-processos.xlsx",
  };
}
