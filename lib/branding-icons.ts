export type IconDescriptor = { url: string; type?: string };

export function getMimeTypeFromUrl(url: string | null | undefined) {
  if (!url) return undefined;
  const lower = url.split("?")[0]?.toLowerCase() ?? "";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return undefined;
}

export function buildIconList(
  customIconUrl: string | null | undefined,
): IconDescriptor[] {
  const icons: IconDescriptor[] = [];

  if (customIconUrl) {
    icons.push({ url: customIconUrl, type: getMimeTypeFromUrl(customIconUrl) });
  }

  icons.push(
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon.ico", type: "image/x-icon" },
  );

  return icons;
}
