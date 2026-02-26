"use client";

import NextLink from "next/link";

type PeopleSectionKey = "clientes" | "advogados" | "equipe";

interface PeopleManagementNavProps {
  active: PeopleSectionKey;
}

const PEOPLE_SECTIONS: Array<{
  key: PeopleSectionKey;
  label: string;
  href: string;
}> = [
  { key: "clientes", label: "Clientes", href: "/clientes" },
  { key: "advogados", label: "Advogados", href: "/advogados" },
  { key: "equipe", label: "Equipe", href: "/equipe" },
];

export function PeopleManagementNav({ active }: PeopleManagementNavProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/60 p-2">
      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-default-500">
        Gestão de pessoas
      </p>
      <div className="flex flex-wrap gap-2">
        {PEOPLE_SECTIONS.map((section) => {
          const isActive = section.key === active;

          return (
            <NextLink
              key={section.key}
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-default-400 hover:bg-white/5 hover:text-white"
              }`}
              href={section.href}
            >
              {section.label}
            </NextLink>
          );
        })}
      </div>
    </div>
  );
}
