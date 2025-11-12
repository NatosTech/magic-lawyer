import { NextResponse } from "next/server";

const CSV_HEADER = [
  "nomeCompleto",
  "email",
  "oab",
  "ufOAB",
  "telefone",
  "especialidade",
  "tipoVinculo",
].join(",");

const CSV_SAMPLE_ROW = [
  "Marcos Vinicius Prado",
  "marcos.prado@example.com",
  "123456",
  "SP",
  "+55 11 97777-1111",
  "Direito Empresarial",
  "INTERNO",
].join(",");

const CSV_CONTENT = `${CSV_HEADER}\n${CSV_SAMPLE_ROW}\n`;

export async function GET() {
  return new NextResponse(CSV_CONTENT, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="modelo-importacao-advogados.csv"',
      "Cache-Control": "no-store",
    },
  });
}
