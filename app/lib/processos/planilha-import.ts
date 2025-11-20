import * as XLSX from "xlsx";

const ACCENT_REGEX = /[\u0300-\u036f]/g;

export type PlanilhaProcessoOrigem =
  | "TEMPLATE"
  | "PROJUDI"
  | "JUSTICA_TRABALHO"
  | "FORUM_ESTADUAL";

export interface PlanilhaProcessoRecord {
  numero: string;
  classe?: string;
  autor: string;
  reu?: string;
  vara?: string;
  comarca?: string;
  area?: string;
  fonte?: string;
  email?: string;
  sheet: string;
  linha: number;
  origem: PlanilhaProcessoOrigem;
}

export interface PlanilhaProcessoParseResult {
  registros: PlanilhaProcessoRecord[];
  avisos: string[];
}

function normalizeHeader(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFD")
    .replace(ACCENT_REGEX, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function cleanCell(value: unknown) {
  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed || null;
  }

  return null;
}

interface HeaderMapping {
  headerIndex: number;
  columns: Record<string, number>;
  origem: PlanilhaProcessoOrigem;
}

const headerCandidates = {
  numero: [
    "N° PROCESSO",
    "NO PROCESSO",
    "NUMERO",
    "NUMERO DO PROCESSO",
    "PROCESSO N°",
    "PROCESSO",
  ],
  autor: ["RECLAMANTE", "AUTOR", "CLIENTE", "REQUERENTE"],
  reu: ["RECLAMADA", "REU", "RÉU", "PARTE CONTRARIA", "PARTE CONTRARIA"],
  vara: ["VARA", "ORGAO", "ÓRGÃO", "FORO", "FORO/VARA", "UNIDADE"],
  classe: ["CLASSE", "TIPO", "ACAO", "AÇÃO"],
  email: ["EMAIL", "E-MAIL", "EMAIL AUTOR", "EMAIL DO AUTOR"],
  area: ["AREA", "ÁREA"],
  comarca: ["COMARCA", "CIDADE", "MUNICIPIO"],
  fonte: ["FONTE", "OBSERVACAO", "OBSERVAÇÃO"],
};

function findIndex(row: string[], candidates: string[]) {
  for (const candidate of candidates) {
    const idx = row.indexOf(candidate);

    if (idx >= 0) {
      return idx;
    }
  }

  return -1;
}

function detectMapping(
  rows: string[][],
  sheetName: string,
  fileName?: string | null,
): HeaderMapping | null {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const normalizedRow = row.map((cell) => normalizeHeader(cell));

    if (normalizedRow.every((cell) => !cell)) {
      continue;
    }

    const numeroIndex = findIndex(normalizedRow, headerCandidates.numero);
    const autorIndex = findIndex(normalizedRow, headerCandidates.autor);
    const reuIndex = findIndex(normalizedRow, headerCandidates.reu);
    const varaIndex = findIndex(normalizedRow, headerCandidates.vara);

    const classeIndex = findIndex(normalizedRow, headerCandidates.classe);
    const emailIndex = findIndex(normalizedRow, headerCandidates.email);
    const areaIndex = findIndex(normalizedRow, headerCandidates.area);
    const comarcaIndex = findIndex(normalizedRow, headerCandidates.comarca);
    const fonteIndex = findIndex(normalizedRow, headerCandidates.fonte);

    const baseMapping: HeaderMapping = {
      headerIndex: index,
      origem: "TEMPLATE",
      columns: {},
    };

    if (
      numeroIndex >= 0 &&
      autorIndex >= 0 &&
      reuIndex >= 0 &&
      varaIndex >= 0
    ) {
      const sheetNormalized = normalizeHeader(sheetName);
      const fileNormalized = normalizeHeader(fileName ?? "");
      let origem: PlanilhaProcessoOrigem = "JUSTICA_TRABALHO";

      if (
        sheetNormalized.includes("PROJUDI") ||
        fileNormalized.includes("PROJUDI")
      ) {
        origem = "PROJUDI";
      }

      return {
        ...baseMapping,
        origem,
        columns: {
          numero: numeroIndex,
          autor: autorIndex,
          reu: reuIndex,
          vara: varaIndex,
          classe: classeIndex,
        },
      };
    }

    if (numeroIndex >= 0 && autorIndex >= 0) {
      return {
        ...baseMapping,
        origem: "FORUM_ESTADUAL",
        columns: {
          numero: numeroIndex,
          autor: autorIndex,
          reu: reuIndex,
          vara: varaIndex,
          classe: classeIndex,
          email: emailIndex,
          area: areaIndex,
          comarca: comarcaIndex,
          fonte: fonteIndex,
        },
      };
    }
  }

  return null;
}

export function parsePlanilhaProcessos(
  buffer: Buffer,
  options?: { fileName?: string | null },
): PlanilhaProcessoParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const avisos: string[] = [];
  const registros: PlanilhaProcessoRecord[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: "",
    });

    if (!rows.length) return;

    const mapping = detectMapping(rows as string[][], sheetName, options?.fileName);

    if (!mapping) {
      avisos.push(
        `A aba "${sheetName}" foi ignorada: não encontramos cabeçalho com colunas de processo.`,
      );
      return;
    }

    const dataRows = rows.slice(mapping.headerIndex + 1);

    dataRows.forEach((row, rowIndex) => {
      const numero = cleanCell(row[mapping.columns.numero]);
      const autor = cleanCell(row[mapping.columns.autor]);

      if (!numero || !autor) {
        if (numero || autor) {
          avisos.push(
            `Linha ${
              mapping.headerIndex + rowIndex + 2
            } da aba "${sheetName}" ignorada: falta número ou autor.`,
          );
        }
        return;
      }

      registros.push({
        numero,
        classe:
          mapping.columns.classe !== undefined
            ? cleanCell(row[mapping.columns.classe]) ?? undefined
            : undefined,
        autor,
        reu:
          mapping.columns.reu !== undefined
            ? cleanCell(row[mapping.columns.reu]) ?? undefined
            : undefined,
        vara:
          mapping.columns.vara !== undefined
            ? cleanCell(row[mapping.columns.vara]) ?? undefined
            : undefined,
        comarca:
          mapping.columns.comarca !== undefined
            ? cleanCell(row[mapping.columns.comarca]) ?? undefined
            : undefined,
        area:
          mapping.columns.area !== undefined
            ? cleanCell(row[mapping.columns.area]) ?? undefined
            : mapping.origem === "FORUM_ESTADUAL"
              ? "CIVEL"
              : "TRABALHISTA",
        fonte:
          mapping.columns.fonte !== undefined
            ? cleanCell(row[mapping.columns.fonte]) ?? undefined
            : undefined,
        email:
          mapping.columns.email !== undefined
            ? cleanCell(row[mapping.columns.email]) ?? undefined
            : undefined,
        origem: mapping.origem,
        sheet: sheetName,
        linha: mapping.headerIndex + rowIndex + 2,
      });
    });
  });

  if (registros.length === 0) {
    throw new Error(
      "Não encontramos processos válidos no arquivo. Revise o cabeçalho e o conteúdo.",
    );
  }

  return { registros, avisos };
}
