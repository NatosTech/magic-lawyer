import type { MovimentacaoProcesso } from "@/generated/prisma";

type AndamentoComparable = Pick<
  MovimentacaoProcesso,
  | "titulo"
  | "descricao"
  | "tipo"
  | "dataMovimentacao"
  | "prazo"
  | "notificarCliente"
  | "notificarEmail"
  | "notificarWhatsapp"
  | "mensagemPersonalizada"
>;

export type AndamentoDiffItem = {
  field: string;
  label: string;
  before: string;
  after: string;
  beforeRaw?: unknown;
  afterRaw?: unknown;
};

export type AndamentoDiffResult = {
  items: AndamentoDiffItem[];
  summary: string;
};

type DiffDescriptor = {
  field: keyof AndamentoComparable;
  label: string;
  format?: (value: unknown) => string;
};

const descriptors: DiffDescriptor[] = [
  { field: "titulo", label: "Título" },
  { field: "descricao", label: "Descrição" },
  { field: "tipo", label: "Tipo" },
  {
    field: "dataMovimentacao",
    label: "Data da movimentação",
    format: formatDate,
  },
  { field: "prazo", label: "Prazo", format: formatDate },
  {
    field: "notificarCliente",
    label: "Notificar cliente",
    format: formatBoolean,
  },
  {
    field: "notificarEmail",
    label: "Notificar por e-mail",
    format: formatBoolean,
  },
  {
    field: "notificarWhatsapp",
    label: "Notificar por WhatsApp",
    format: formatBoolean,
  },
  {
    field: "mensagemPersonalizada",
    label: "Mensagem personalizada",
  },
];

export function buildAndamentoDiff(
  before: AndamentoComparable,
  after: AndamentoComparable,
): AndamentoDiffResult {
  const items: AndamentoDiffItem[] = [];

  for (const descriptor of descriptors) {
    const beforeValue = before?.[descriptor.field];
    const afterValue = after?.[descriptor.field];

    if (valuesAreEqual(beforeValue, afterValue)) {
      continue;
    }

    const format = descriptor.format ?? formatDefault;

    items.push({
      field: descriptor.field,
      label: descriptor.label,
      before: format(beforeValue),
      after: format(afterValue),
      beforeRaw: beforeValue,
      afterRaw: afterValue,
    });
  }

  return {
    items,
    summary: items.map((item) => item.label).join(", "),
  };
}

function valuesAreEqual(a: unknown, b: unknown): boolean {
  return normalizeValue(a) === normalizeValue(b);
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function formatDefault(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === "boolean") {
    return formatBoolean(value);
  }

  return String(value);
}

function formatBoolean(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return value ? "Sim" : "Não";
}

function formatDate(value: unknown): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === "string" ? value : Number(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
