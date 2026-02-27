import * as XLSX from "xlsx";

import { gerarPlanilhaModeloProcessos } from "@/app/actions/processos-template";
import { parsePlanilhaProcessos } from "@/app/lib/processos/planilha-import";

describe("parsePlanilhaProcessos", () => {
  it("deve processar a planilha modelo oficial sem erros", async () => {
    const modelo = await gerarPlanilhaModeloProcessos();
    const buffer = Buffer.from(modelo.base64, "base64");

    const resultado = parsePlanilhaProcessos(buffer, {
      fileName: modelo.fileName,
    });

    expect(resultado.registros.length).toBeGreaterThan(0);
    expect(resultado.registros[0]).toEqual(
      expect.objectContaining({
        numero: expect.any(String),
        autor: expect.any(String),
      }),
    );
  });

  it("deve mapear colunas opcionais (email, area, comarca e fonte)", () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "Numero do Processo",
        "Autor",
        "Reu",
        "Vara",
        "Classe",
        "Email do Autor",
        "Area",
        "Comarca",
        "Fonte",
      ],
      [
        "0001234-56.2024.8.26.0100",
        "Maria Souza",
        "Banco XPTO S/A",
        "4a Vara Civel",
        "Procedimento Comum Civel",
        "maria.souza@email.com",
        "Civel",
        "Sao Paulo/SP",
        "Carga inicial",
      ],
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Processos");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    const resultado = parsePlanilhaProcessos(buffer, {
      fileName: "modelo-importacao-processos.xlsx",
    });

    expect(resultado.registros).toHaveLength(1);
    expect(resultado.registros[0]).toEqual(
      expect.objectContaining({
        email: "maria.souza@email.com",
        area: "Civel",
        comarca: "Sao Paulo/SP",
        fonte: "Carga inicial",
      }),
    );
  });
});
