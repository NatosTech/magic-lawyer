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
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  reu: [
    "RECLAMADA",
    "REU",
    "RÉU",
    "REU PARTE CONTRARIA",
    "PARTE CONTRARIA",
  ],
  vara: ["VARA", "ORGAO", "ÓRGÃO", "FORO", "FORO/VARA", "UNIDADE"],
  classe: ["CLASSE", "TIPO", "ACAO", "AÇÃO"],
  email: ["EMAIL", "E-MAIL", "EMAIL AUTOR", "EMAIL DO AUTOR"],
  area: ["AREA", "ÁREA"],
  comarca: ["COMARCA", "CIDADE", "MUNICIPIO"],
  fonte: ["FONTE", "OBSERVACAO", "OBSERVAÇÃO"],
};

function findIndex(row: string[], candidates: string[]) {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeHeader(candidate))
    .filter(Boolean);

  const matchesCandidate = (cell: string, candidate: string) =>
    cell === candidate || cell.includes(candidate) || candidate.includes(cell);

  for (const candidate of normalizedCandidates) {
    const idx = row.findIndex(
      (cell) =>
        Boolean(cell) && matchesCandidate(cell, candidate),
    );

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

    if (numeroIndex >= 0 && autorIndex >= 0) {
      const sheetNormalized = normalizeHeader(sheetName);
      const fileNormalized = normalizeHeader(fileName ?? "");
      const hasTrabalhoMarkers =
        normalizedRow.some((cell) => cell.includes("RECLAMANTE")) ||
        normalizedRow.some((cell) => cell.includes("RECLAMADA")) ||
        normalizedRow.some((cell) => cell.includes("TRABALHISTA"));
      const hasTemplateMarkers =
        sheetNormalized === "PROCESSOS" ||
        fileNormalized.includes("MODELO IMPORTACAO PROCESSOS") ||
        normalizedRow.some((cell) => cell.includes("AUTOR CLIENTE"));

      let origem: PlanilhaProcessoOrigem = hasTemplateMarkers
        ? "TEMPLATE"
        : "FORUM_ESTADUAL";

      if (hasTrabalhoMarkers) {
        origem = "JUSTICA_TRABALHO";
      }

      if (
        sheetNormalized.includes("PROJUDI") ||
        fileNormalized.includes("PROJUDI")
      ) {
        origem = "PROJUDI";
      }

      const columns: Record<string, number> = {
        numero: numeroIndex,
        autor: autorIndex,
      };

      if (reuIndex >= 0) columns.reu = reuIndex;
      if (varaIndex >= 0) columns.vara = varaIndex;
      if (classeIndex >= 0) columns.classe = classeIndex;
      if (emailIndex >= 0) columns.email = emailIndex;
      if (areaIndex >= 0) columns.area = areaIndex;
      if (comarcaIndex >= 0) columns.comarca = comarcaIndex;
      if (fonteIndex >= 0) columns.fonte = fonteIndex;

      return {
        ...baseMapping,
        origem,
        columns,
      };
    }
  }

  return null;
}

export function parsePlanilhaProcessos(
  buffer: Buffer,
  options?: { fileName?: string | null },
): PlanilhaProcessoParseResult {
  const parseWorkbook = (workbook: XLSX.WorkBook): PlanilhaProcessoParseResult => {
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

      const mapping = detectMapping(
        rows as string[][],
        sheetName,
        options?.fileName,
      );

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

        const defaultAreaByOrigem: Partial<
          Record<PlanilhaProcessoOrigem, string | undefined>
        > = {
          FORUM_ESTADUAL: "CIVEL",
          JUSTICA_TRABALHO: "TRABALHISTA",
          PROJUDI: "CIVEL",
        };

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
              : defaultAreaByOrigem[mapping.origem],
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

    return { registros, avisos };
  };

  const fileName = options?.fileName?.toLowerCase() ?? "";
  const attempts: XLSX.ParsingOptions[] = [{ type: "buffer" }];

  if (fileName.endsWith(".csv")) {
    attempts.push({
      type: "buffer",
      FS: ";",
    } as XLSX.ParsingOptions);
  }

  let lastAttemptWarnings: string[] = [];

  for (const parsingOptions of attempts) {
    const workbook = XLSX.read(buffer, parsingOptions);
    const parsed = parseWorkbook(workbook);

    if (parsed.registros.length > 0) {
      return parsed;
    }

    lastAttemptWarnings = parsed.avisos;
  }

  if (lastAttemptWarnings.length > 0) {
    throw new Error(
      `${lastAttemptWarnings[0]} Não encontramos processos válidos no arquivo.`,
    );
  }

  throw new Error(
    "Não encontramos processos válidos no arquivo. Revise o cabeçalho e o conteúdo.",
  );
}
