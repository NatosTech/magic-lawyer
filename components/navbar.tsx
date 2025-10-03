"use client";

import type { ReactNode, SVGProps } from "react";

import { useMemo } from "react";
import { Navbar as HeroUINavbar, NavbarBrand, NavbarContent, NavbarMenu, NavbarMenuItem, NavbarMenuToggle } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { link as linkStyles } from "@heroui/theme";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { User } from "@heroui/user";
import clsx from "clsx";
import NextLink from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import { siteConfig } from "@/config/site";
import packageInfo from "@/package.json";
import { SignInOut } from "@/components/signinout";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { SearchBar } from "@/components/searchbar";
import { TENANT_PERMISSIONS } from "@/types";

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

type NavbarProps = {
  onOpenSidebar?: () => void;
  rightExtras?: ReactNode;
  showAuthenticatedSecondaryNav?: boolean;
};

const MenuIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden className={clsx("h-5 w-5", className)} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}>
    <line x1="3" x2="21" y1="6" y2="6" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="21" y1="18" y2="18" />
  </svg>
);

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");

export const Navbar = ({ onOpenSidebar, rightExtras, showAuthenticatedSecondaryNav = true }: NavbarProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const tenantLogoUrl = session?.user?.tenantLogoUrl || undefined;
  const tenantName = session?.user?.tenantName || "Magic Lawyer";
  const hasTenantBranding = Boolean(session?.user?.tenantName || tenantLogoUrl);
  const brandSubtitle = hasTenantBranding ? "Portal do escritório" : "SaaS jurídico white label";
  const brandTitleClasses = clsx("text-sm font-semibold text-primary", hasTenantBranding ? "tracking-tight" : "uppercase tracking-[0.3em]");
  const userDisplayName = session?.user?.name || session?.user?.email || "Usuário";
  const userEmail = session?.user?.email || "Conta Magic Lawyer";
  const userAvatar = session?.user?.image || undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  const userPermissions = ((session?.user as any)?.permissions as string[] | undefined) ?? [];
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const hasPermission = (permission?: string) => !permission || isSuperAdmin || userPermissions.includes(permission);

  const appVersion = packageInfo.version ?? "0.0.0";

  const canManageTenantSettings = hasPermission(TENANT_PERMISSIONS.manageOfficeSettings);

  const renderNavLink = (label: string, href: string) => {
    const isActive = pathname === href;

    return (
      <NextLink
        key={label}
        className={clsx(
          linkStyles({ color: "foreground" }),
          "relative px-4 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-primary/15 text-primary" : "text-default-500 hover:text-primary"
        )}
        href={href}
      >
        {label}
      </NextLink>
    );
  };

  const handleUserAction = (key: string) => {
    if (key === "profile") {
      router.push("/usuario/perfil/editar");

      return;
    }

    if (key === "tenant-settings") {
      router.push("/configuracoes");

      return;
    }

    if (key === "logout") {
      void signOut({ callbackUrl: "/login" });
    }
  };

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

  const authenticatedNav = useMemo(() => {
    if (!showAuthenticatedSecondaryNav) return null;

    return (
      <div className="mx-auto w-full max-w-6xl border-b border-divider bg-background/60 px-6 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {siteConfig.navItemsAuthenticated.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <NextLink
                key={item.href}
                className={clsx("px-4 py-2 text-sm font-medium transition rounded-md", isActive ? "bg-primary/25 text-primary" : "text-default-500 hover:text-primary hover:bg-default-100")}
                href={item.href}
              >
                {item.label}
              </NextLink>
            );
          })}
        </div>
      </div>
    );
  }, [pathname, showAuthenticatedSecondaryNav]);

  return (
    <div className="sticky top-0 z-50 flex flex-col">
      <HeroUINavbar className="border-b border-divider bg-background/95 backdrop-blur-xl py-3" isBordered={false} maxWidth="xl">
        <NavbarContent justify="start" className="flex-1">
          {onOpenSidebar ? (
            <Button
              isIconOnly
              className="inline-flex h-10 w-10 items-center justify-center border border-divider bg-content1 text-default-500 transition hover:border-primary/40 hover:text-primary md:hidden"
              radius="none"
              variant="light"
              onPress={onOpenSidebar}
            >
              <MenuIcon />
            </Button>
          ) : null}
          <NavbarBrand>
            <NextLink className="flex items-center gap-3" href="/">
              <span className="flex flex-col leading-tight">
                <span className={brandTitleClasses}>{tenantName}</span>
                <span className="text-xs text-default-400">{brandSubtitle}</span>
                <span className="text-[10px] uppercase tracking-wide text-default-600">versão {appVersion}</span>
              </span>
            </NextLink>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end" className="flex-shrink-0">
          {session?.user ? rightExtras : null}
          <Chip className="hidden text-xs uppercase tracking-wide text-primary-200 xl:flex" color="primary" variant="flat">
            Novas automações 2025.3
          </Chip>
          {session?.user ? <SearchBar /> : null}
          {session?.user ? <NotificationCenter /> : null}
          <ThemeSwitch />
          {session?.user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <User
                  as="button"
                  avatarProps={{
                    src: userAvatar,
                    name: userDisplayName,
                    size: "lg",
                  }}
                  className="cursor-pointer gap-2 border border-divider bg-content1 px-6 py-2 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                  description={userEmail}
                  name={userDisplayName}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Menu do usuário" className="min-w-[220px]" onAction={(key) => handleUserAction(String(key))}>
                <DropdownItem key="profile" description="Gerenciar informações pessoais">
                  Meu perfil
                </DropdownItem>
                {canManageTenantSettings ? (
                  <DropdownItem key="tenant-settings" description="Branding, domínios e integrações do escritório">
                    Configurações do escritório
                  </DropdownItem>
                ) : null}
                <DropdownItem key="logout" className="text-danger" color="danger" description="Encerrar sessão com segurança">
                  Sair
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="hidden sm:flex">
              <SignInOut />
            </div>
          )}
        </NavbarContent>

        <NavbarContent className="flex items-center gap-2 sm:hidden" justify="end">
          <ThemeSwitch />
        </NavbarContent>
      </HeroUINavbar>

      {authenticatedNav}
    </div>
  );
};
