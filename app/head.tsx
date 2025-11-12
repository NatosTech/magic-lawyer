import { headers } from "next/headers";

import { buildIconList } from "@/lib/branding-icons";
import { getTenantBrandingByHost } from "@/lib/tenant-branding";

export default async function Head() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const branding = await getTenantBrandingByHost(host);
  const faviconUrl = branding?.faviconUrl?.trim() || null;
  const iconList = buildIconList(faviconUrl);

  return (
    <>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      />
      {iconList.map((icon, index) => (
        <link
          key={`${icon.url}-${index}`}
          rel="icon"
          href={icon.url}
          type={icon.type}
        />
      ))}
    </>
  );
}
