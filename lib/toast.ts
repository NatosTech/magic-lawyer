"use client";

import { toast as sonnerToast, type Action, type ExternalToast } from "sonner";

const COPY_ERROR_LABEL = "Copiar erro";
const COPY_SUCCESS_MESSAGE = "Erro copiado para a area de transferencia.";
const COPY_FAILURE_MESSAGE = "Nao foi possivel copiar o erro.";
const FALLBACK_ERROR_TEXT = "Erro sem detalhes adicionais.";

const originalError = sonnerToast.error.bind(sonnerToast);

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Error) {
    return value.message.trim();
  }

  return "";
}

function getErrorPayload(
  message: Parameters<typeof sonnerToast.error>[0],
  description: ExternalToast["description"],
): string {
  const title = toText(message);
  const details = toText(description);
  const payload = [title, details].filter(Boolean).join("\n");

  return payload || FALLBACK_ERROR_TEXT;
}

async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);

    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard indisponivel");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Falha ao copiar texto");
  }
}

const toast = sonnerToast;

toast.error = (message, data) => {
  const payload = getErrorPayload(message, data?.description);
  const copyAction: Action = {
    label: COPY_ERROR_LABEL,
    onClick: () => {
      void copyToClipboard(payload)
        .then(() => {
          sonnerToast.success(COPY_SUCCESS_MESSAGE);
        })
        .catch(() => {
          sonnerToast.message(COPY_FAILURE_MESSAGE);
        });
    },
  };

  const nextData: ExternalToast = {
    ...data,
    action: copyAction,
    cancel: data?.cancel ?? data?.action,
  };

  return originalError(message, nextData);
};

export { toast };
