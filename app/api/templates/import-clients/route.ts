import { NextResponse } from "next/server";

const CSV_HEADER = [
  "nomeCompleto",
  "email",
  "telefone",
  "tipoPessoa",
  "documento",
  "dataNascimento",
  "observacoes",
].join(",");

const CSV_SAMPLE_ROW = [
  "Ana Beatriz Souza",
  "ana.souza@example.com",
  "+55 11 98888-0000",
  "FISICA",
  "12345678901",
  "1990-05-15",
  "Cliente VIP; prefere contato por WhatsApp",
].join(",");

const CSV_CONTENT = `${CSV_HEADER}\n${CSV_SAMPLE_ROW}\n`;

export async function GET() {
  return new NextResponse(CSV_CONTENT, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="modelo-importacao-clientes.csv"',
      "Cache-Control": "no-store",
    },
  });
}
