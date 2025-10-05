"use client";

import { useMemo, type ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/drawer";
import { Button } from "@heroui/button";

import { Logo } from "@/components/icons";
import { SearchBar } from "@/components/searchbar";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { User } from "@heroui/user";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const navIconStroke = 1.6;

type IconProps = {
  size?: number;
};

const DashboardIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M3 13h8V3H3zM13 21h8V11h-8z" />
    <path d="M3 21h8v-4H3zM13 3v4h8V3z" />
  </svg>
);

const FolderIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 3h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M3 7h18" />
  </svg>
);

const FileIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M4 3h9l5 5v13H4z" />
    <path d="M13 3v6h6" />
  </svg>
);

const WalletIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <rect height="14" rx="2" width="20" x="2" y="5" />
    <path d="M16 12h4" />
  </svg>
);

const ChartIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M4 19v-8" />
    <path d="M9 19V5" />
    <path d="M15 19v-5" />
    <path d="M20 19V9" />
  </svg>
);

const CalendarIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ScaleIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M16 11V7a4 4 0 0 0-8 0v4" />
    <rect height="11" rx="2" width="18" x="3" y="11" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);

const PeopleIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UserIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
);

const HelpIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const FileSignatureIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l4 4v13.5" />
    <path d="M14 2v4h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 5H8" />
  </svg>
);

const FileTemplateIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const ShieldIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const UsersIcon = ({ size = 18 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChevronDownIcon = ({ size = 16 }: IconProps) => (
  <svg aria-hidden className="text-current" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={navIconStroke} viewBox="0 0 24 24" width={size}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const navIconMap: Record<string, JSX.Element> = {
  Painel: <DashboardIcon />,
  Dashboard: <DashboardIcon />,
  Clientes: <PeopleIcon />,
  Processos: <FolderIcon />,
  Procurações: <ShieldIcon />,
  Contratos: <FileSignatureIcon />,
  Modelos: <FileTemplateIcon />,
  Documentos: <FileIcon />,
  Agenda: <CalendarIcon />,
  Financeiro: <WalletIcon />,
  Juízes: <ScaleIcon />,
  "Juízes Globais": <ScaleIcon />,
  Relatórios: <ChartIcon />,
  Equipe: <PeopleIcon />,
  Tenants: <PeopleIcon />,
  Advogados: <UsersIcon />,
  "Meu Perfil": <UserIcon />,
  "Configurações do escritório": <SettingsIcon />,
  Configurações: <SettingsIcon />,
  Suporte: <HelpIcon />,
  "Pacotes Premium": <WalletIcon />,
  Auditoria: <ScaleIcon />,
};

export type SidebarNavItem = {
  label: string;
  href: string;
  children?: SidebarNavItem[];
  isAccordion?: boolean;
  section?: string;
};

export type SidebarProps = {
  tenantName: string;
  tenantLogoUrl?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  navItems: SidebarNavItem[];
  secondaryItems: SidebarNavItem[];
};

const SidebarSectionLabel = ({ collapsed, children }: { collapsed: boolean; children: ReactNode }) =>
  collapsed ? null : (
    <div className="px-2 py-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-default-500">{children}</p>
    </div>
  );

// Componente para item com accordion
const AccordionNavItem = ({ item, isActive, icon, isDesktop, onCloseMobile }: { item: SidebarNavItem; isActive: boolean; icon: JSX.Element; isDesktop: boolean; onCloseMobile?: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Auto-expandir se algum filho estiver ativo
  const hasActiveChild = item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));

  // Expandir automaticamente se houver filho ativo
  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  return (
    <li key={item.href}>
      <div className="space-y-1">
        {/* Item principal com botão de toggle */}
        <div className="flex items-center">
          {/* Botão de toggle - só expande/recolhe */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition text-default-400 hover:bg-default-100 hover:text-default-900 flex-1"
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            <span className="shrink-0 text-base">{icon}</span>
            <span className="truncate">{item.label}</span>
            <span className={`transition-transform duration-200 ml-auto ${isExpanded ? "rotate-180" : ""}`}>
              <ChevronDownIcon size={14} />
            </span>
          </button>
        </div>

        {/* Sub-itens com animação */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <ul className="space-y-1 pl-6">
            {item.children?.map((child) => {
              const isChildActive = pathname === child.href;
              const childIcon = navIconMap[child.label] ?? <DashboardIcon />;

              return (
                <li key={child.href}>
                  <NextLink
                    className={
                      isChildActive
                        ? "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition bg-primary/25 text-primary"
                        : "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition text-default-400 hover:bg-default-100 hover:text-default-900"
                    }
                    href={child.href}
                    onClick={() => {
                      if (!isDesktop && onCloseMobile) {
                        onCloseMobile();
                      }
                    }}
                  >
                    <span className="shrink-0 text-base">{childIcon}</span>
                    <span className="truncate">{child.label}</span>
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
};

const SidebarToggleIcon = ({ collapsed }: { collapsed: boolean }) => (
  <span className="relative flex h-6 w-6 items-center justify-center">
    <span className={clsx("absolute inset-0 rounded-full border border-primary/50 transition-all duration-500 ease-out", collapsed ? "scale-90 opacity-50" : "scale-110 opacity-80")} />
    <span className={clsx("absolute inset-0 rounded-full bg-primary/20 transition-opacity duration-500", collapsed ? "opacity-25" : "opacity-40")} />
    <svg aria-hidden className={clsx("relative h-4 w-4 text-primary transition-transform duration-500 ease-in-out", collapsed ? "rotate-0" : "rotate-180")} fill="none" viewBox="0 0 24 24">
      <path d="M13 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <path d="M4 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </svg>
  </span>
);

function MobileUserProfile({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  const userDisplayName = session.user.name || session.user.email || "Usuário";
  const userEmail = session.user.email || "";
  const userAvatar = session.user.image || undefined;
  const isSuperAdmin = (session.user as any)?.role === "SUPER_ADMIN";

  const handleUserAction = (key: string) => {
    onClose(); // Fechar o drawer

    if (key === "profile") {
      // SuperAdmin não tem perfil de usuário comum
      if (isSuperAdmin) {
        router.push("/admin/configuracoes");
      } else {
        router.push("/usuario/perfil/editar");
      }
      return;
    }

    if (key === "tenant-settings") {
      // SuperAdmin vai para configurações do sistema
      if (isSuperAdmin) {
        router.push("/admin/configuracoes");
      } else {
        router.push("/configuracoes");
      }
      return;
    }

    if (key === "logout") {
      void signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <div className="px-4 py-3 border-b border-default-200">
      <Dropdown placement="bottom-start" className="w-full">
        <DropdownTrigger>
          <Button variant="light" className="w-full justify-start p-3 h-auto">
            <User
              avatarProps={{
                src: userAvatar,
                name: userDisplayName,
                size: "sm",
                className: "w-8 h-8 text-xs",
              }}
              className="w-full"
              description={userEmail}
              name={userDisplayName}
            />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Menu do usuário" className="min-w-[220px]" onAction={(key) => handleUserAction(String(key))}>
          <DropdownItem key="profile" description={isSuperAdmin ? "Configurações do sistema" : "Gerenciar informações pessoais"}>
            {isSuperAdmin ? "Configurações" : "Meu perfil"}
          </DropdownItem>
          {!isSuperAdmin ? (
            <DropdownItem key="tenant-settings" description="Configurações do escritório">
              Configurações
            </DropdownItem>
          ) : null}
          <DropdownItem key="logout" className="text-danger" color="danger" description="Sair da sua conta">
            Sair
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

function SidebarContent({
  tenantName,
  tenantLogoUrl,
  collapsed,
  onToggleCollapse,
  navItems,
  secondaryItems,
  isDesktop,
  onCloseMobile,
}: {
  tenantName: string;
  tenantLogoUrl?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  navItems: SidebarNavItem[];
  secondaryItems: SidebarNavItem[];
  isDesktop: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const sections = useMemo(() => {
    // Agrupar itens principais por seção
    const groupedItems = navItems.reduce(
      (acc, item) => {
        const section = item.section || "Geral";
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(item);
        return acc;
      },
      {} as Record<string, SidebarNavItem[]>
    );

    // Agrupar itens secundários por seção
    const groupedSecondaryItems = secondaryItems.reduce(
      (acc, item) => {
        const section = item.section || "Administração";
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(item);
        return acc;
      },
      {} as Record<string, SidebarNavItem[]>
    );

    // Criar seções ordenadas
    const sections: Array<{ title: string; items: SidebarNavItem[] }> = [];

    // Ordem das seções principais
    const sectionOrder = ["Visão Geral", "Gestão de Pessoas", "Atividades Jurídicas", "Operacional", "Administração"];

    // Adicionar seções principais na ordem
    sectionOrder.forEach((sectionTitle) => {
      if (groupedItems[sectionTitle]?.length > 0) {
        sections.push({ title: sectionTitle, items: groupedItems[sectionTitle] });
      }
    });

    // Adicionar seções não ordenadas
    Object.entries(groupedItems).forEach(([sectionTitle, items]) => {
      if (!sectionOrder.includes(sectionTitle) && items.length > 0) {
        sections.push({ title: sectionTitle, items });
      }
    });

    // Adicionar seções secundárias (evitando duplicatas)
    Object.entries(groupedSecondaryItems).forEach(([sectionTitle, items]) => {
      if (items.length > 0) {
        // Verificar se já existe uma seção com esse nome
        const existingSectionIndex = sections.findIndex((s) => s.title === sectionTitle);
        if (existingSectionIndex >= 0) {
          // Se existe, mesclar os itens
          sections[existingSectionIndex].items.push(...items);
        } else {
          // Se não existe, criar nova seção
          sections.push({ title: sectionTitle, items });
        }
      }
    });

    return sections;
  }, [navItems, secondaryItems]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-6 flex items-center gap-3 px-3 pt-4">
        {tenantLogoUrl ? (
          <span className="flex h-10 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1">
            <Image unoptimized alt={`Logo ${tenantName}`} className="max-h-full w-full object-contain" height={40} src={tenantLogoUrl} width={64} />
          </span>
        ) : (
          <span className="rounded-xl bg-primary/15 p-2 text-primary">
            <Logo className="h-6 w-6" />
          </span>
        )}
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{tenantName}</span>
            <span className="text-[11px] text-default-500">Workspace</span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2">
        {sections.map((section, index) => (
          <div key={section.title} className="space-y-1.5">
            {/* Separador visual entre seções (exceto a primeira) */}
            {index > 0 && !collapsed && <div className="mx-2 my-1.5 border-t border-default-200/50"></div>}

            <SidebarSectionLabel collapsed={collapsed}>{section.title}</SidebarSectionLabel>

            {collapsed ? (
              // Versão colapsada - sem accordion
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const icon = navIconMap[item.label] ?? <DashboardIcon />;

                  return (
                    <li key={item.href}>
                      <NextLink
                        className={
                          isActive
                            ? "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition justify-center bg-primary/25 text-primary"
                            : "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition justify-center text-default-400 hover:bg-default-100 hover:text-default-900"
                        }
                        href={item.href}
                        onClick={() => {
                          if (!isDesktop && onCloseMobile) {
                            onCloseMobile();
                          }
                        }}
                      >
                        <span className="shrink-0 text-base">{icon}</span>
                      </NextLink>
                    </li>
                  );
                })}
              </ul>
            ) : (
              // Versão expandida - com accordion
              <ul className="space-y-1">
                {section.items.map((item) => {
                  // Para itens com accordion, nunca considerar o pai como ativo - FIXED v2
                  const isActive = item.isAccordion ? false : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const icon = navIconMap[item.label] ?? <DashboardIcon />;

                  if (item.isAccordion && item.children) {
                    return <AccordionNavItem key={item.href} item={item} isActive={isActive} icon={icon} isDesktop={isDesktop} onCloseMobile={onCloseMobile} />;
                  }

                  // Item normal sem accordion
                  return (
                    <li key={item.href}>
                      <NextLink
                        className={
                          isActive
                            ? "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition bg-primary/25 text-primary"
                            : "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition text-default-400 hover:bg-default-100 hover:text-default-900"
                        }
                        href={item.href}
                        onClick={() => {
                          if (!isDesktop && onCloseMobile) {
                            onCloseMobile();
                          }
                        }}
                      >
                        <span className="shrink-0 text-base">{icon}</span>
                        <span className="truncate">{item.label}</span>
                      </NextLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {isDesktop ? (
        <div className="border-t border-default-200 p-3 space-y-2">
          <Button as={NextLink} href="/help" className={clsx("group relative w-full", collapsed ? "p-2" : "px-3 py-2")} isIconOnly={collapsed} radius="none" variant="bordered" color="warning">
            <HelpIcon size={collapsed ? 16 : 18} />
            <span className="sr-only">Abrir chamado</span>
            {!collapsed ? <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.35em]">Ajuda</span> : null}
          </Button>
          <Button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className={clsx("group relative w-full", collapsed ? "p-2" : "px-3 py-2")}
            isIconOnly={collapsed}
            radius="none"
            variant="bordered"
            color="primary"
            onPress={onToggleCollapse}
          >
            <SidebarToggleIcon collapsed={collapsed} />
            <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
            {!collapsed ? <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.35em]">Menu</span> : null}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar({ tenantName, tenantLogoUrl, collapsed, onToggleCollapse, isMobileOpen, onCloseMobile, navItems, secondaryItems }: SidebarProps) {
  return (
    <>
      <aside className={clsx("hidden h-screen flex-col border-r border-divider bg-background/80 backdrop-blur-xl transition-all duration-300 md:flex", collapsed ? "md:w-[84px]" : "md:w-64")}>
        <SidebarContent
          isDesktop
          collapsed={collapsed}
          navItems={navItems}
          secondaryItems={secondaryItems}
          tenantLogoUrl={tenantLogoUrl}
          tenantName={tenantName}
          onCloseMobile={onCloseMobile}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <Drawer
        isOpen={isMobileOpen}
        placement="left"
        size="xs"
        onOpenChange={(open) => {
          if (!open) {
            onCloseMobile();
          }
        }}
      >
        <DrawerContent className="bg-background/95 text-white">
          {(onClose) => (
            <>
              <DrawerHeader className="text-sm font-semibold uppercase tracking-[0.3em] text-default-500">Menu</DrawerHeader>
              <DrawerBody className="p-0">
                {/* Mobile Search and Notifications */}
                <div className="px-4 py-3 border-b border-default-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <SearchBar className="w-full" />
                    </div>
                    <NotificationCenter />
                  </div>
                </div>

                {/* Mobile User Profile */}
                <MobileUserProfile
                  onClose={() => {
                    onCloseMobile();
                    onClose();
                  }}
                />

                <SidebarContent
                  collapsed={false}
                  isDesktop={false}
                  navItems={navItems}
                  secondaryItems={secondaryItems}
                  tenantLogoUrl={tenantLogoUrl}
                  tenantName={tenantName}
                  onCloseMobile={() => {
                    onCloseMobile();
                    onClose();
                  }}
                  onToggleCollapse={onToggleCollapse}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
