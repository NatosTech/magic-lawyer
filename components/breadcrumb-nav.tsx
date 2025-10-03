"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import NextLink from "next/link";

const breadcrumbLabelMap: Record<string, string> = {
  dashboard: "Painel",
  processos: "Processos",
  documentos: "Documentos",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  usuario: "Usuário",
  perfil: "Perfil",
  editar: "Editar",
  configuracoes: "Configurações",
  equipe: "Equipe",
  help: "Suporte",
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");

export function BreadcrumbNav() {
  const pathname = usePathname();

  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const normalized = segment.replace(/-/g, " ");
      const label = breadcrumbLabelMap[segment] ? breadcrumbLabelMap[segment] : toTitleCase(normalized);

      return {
        href,
        label,
      };
    });

    if (items.length === 0 || items[0].href !== "/dashboard") {
      items.unshift({ href: "/dashboard", label: "Painel" });
    }

    return items;
  }, [pathname]);

  // Não mostrar breadcrumb se estiver na página inicial
  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  return (
    <div className="px-6 py-3">
      <Breadcrumbs variant="light" color="primary" size="sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <BreadcrumbItem key={item.href} isCurrent={isLast}>
              {isLast ? item.label : <NextLink href={item.href}>{item.label}</NextLink>}
            </BreadcrumbItem>
          );
        })}
      </Breadcrumbs>
    </div>
  );
}
