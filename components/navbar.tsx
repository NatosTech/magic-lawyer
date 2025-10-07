"use client";

import type { ReactNode, SVGProps } from "react";

import { useMemo, useEffect } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { link as linkStyles } from "@heroui/theme";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import clsx from "clsx";
import NextLink from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import { useAvatar } from "@/app/hooks/use-avatar";
import { siteConfig } from "@/config/site";
import packageInfo from "@/package.json";
import { SignInOut } from "@/components/signinout";
import { ThemeSwitch } from "@/components/theme-switch";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { CentralizedSearchBar } from "@/components/centralized-search-bar";
import { TENANT_PERMISSIONS } from "@/types";
import { UserRole, TenantPermission } from "@/app/generated/prisma";

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
  <svg
    aria-hidden
    className={clsx("h-5 w-5", className)}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <line x1="3" x2="21" y1="6" y2="6" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="21" y1="18" y2="18" />
  </svg>
);

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) =>
      part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part,
    )
    .join(" ");

export const Navbar = ({
  onOpenSidebar,
  rightExtras,
  showAuthenticatedSecondaryNav = true,
}: NavbarProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { avatarUrl, mutate: mutateAvatar } = useAvatar();

  const tenantLogoUrl = session?.user?.tenantLogoUrl || undefined;
  const tenantName = session?.user?.tenantName || "Magic Lawyer";
  const hasTenantBranding = Boolean(session?.user?.tenantName || tenantLogoUrl);
  const brandSubtitle = hasTenantBranding
    ? "Portal do escritório"
    : "SaaS jurídico white label";
  const brandTitleClasses = clsx(
    "text-sm font-semibold text-primary",
    hasTenantBranding ? "tracking-tight" : "uppercase tracking-[0.3em]",
  );
  const userDisplayName =
    session?.user?.name || session?.user?.email || "Usuário";
  const userEmail = session?.user?.email || "Conta Magic Lawyer";
  const userAvatar =
    avatarUrl || (session?.user as any)?.avatarUrl || undefined;
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const userPermissions =
    ((session?.user as any)?.permissions as TenantPermission[] | undefined) ??
    [];
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const hasPermission = (permission?: string) =>
    !permission ||
    isSuperAdmin ||
    userPermissions.includes(permission as TenantPermission);

  // Escutar evento customizado de atualização do avatar
  useEffect(() => {
    const handleAvatarUpdate = () => {
      // Revalidar dados do SWR quando o avatar for atualizado
      mutateAvatar();
    };

    window.addEventListener(
      "avatarUpdated",
      handleAvatarUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "avatarUpdated",
        handleAvatarUpdate as EventListener,
      );
    };
  }, [mutateAvatar]);

  const appVersion = packageInfo.version ?? "0.0.0";

  const canManageTenantSettings = hasPermission(
    TENANT_PERMISSIONS.manageOfficeSettings,
  );

  const renderNavLink = (label: string, href: string) => {
    const isActive = pathname === href;

    return (
      <NextLink
        key={label}
        className={clsx(
          linkStyles({ color: "foreground" }),
          "relative px-4 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-default-500 hover:text-primary",
        )}
        href={href}
      >
        {label}
      </NextLink>
    );
  };

  const handleUserAction = (key: string) => {
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

  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const normalized = segment.replace(/-/g, " ");
      const label = breadcrumbLabelMap[segment]
        ? breadcrumbLabelMap[segment]
        : toTitleCase(normalized);

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
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition rounded-md",
                  isActive
                    ? "bg-primary/25 text-primary"
                    : "text-default-500 hover:text-primary hover:bg-default-100",
                )}
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
      <HeroUINavbar
        className="border-b border-divider bg-background/95 backdrop-blur-xl py-2"
        isBordered={false}
        maxWidth="full"
      >
        {/* Seção Esquerda - Brand e Menu Mobile */}
        <NavbarContent className="flex-shrink-0 min-w-0" justify="start">
          {onOpenSidebar ? (
            <Button
              isIconOnly
              className="inline-flex h-8 w-8 items-center justify-center border border-divider bg-content1 text-default-500 transition hover:border-primary/40 hover:text-primary md:hidden"
              radius="none"
              variant="light"
              onPress={onOpenSidebar}
            >
              <MenuIcon />
            </Button>
          ) : null}
          <NavbarBrand className="min-w-0">
            <NextLink className="flex items-center gap-2" href="/">
              <span className="flex flex-col leading-tight">
                <span className={brandTitleClasses}>{tenantName}</span>
                <span className="text-xs text-default-400">
                  {brandSubtitle}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-default-600">
                  versão {appVersion}
                </span>
              </span>
            </NextLink>
          </NavbarBrand>
        </NavbarContent>

        {/* Seção Central - Search Bar */}
        {session?.user && (
          <NavbarContent className="flex-1 min-w-0 px-4" justify="center">
            <CentralizedSearchBar className="w-full max-w-3xl" />
          </NavbarContent>
        )}

        {/* Seção Direita - Ações */}
        <NavbarContent className="flex-shrink-0 min-w-0" justify="end">
          {session?.user ? rightExtras : null}
          {session?.user ? (
            <div className="hidden sm:block">
              <NotificationCenter />
            </div>
          ) : null}
          <ThemeSwitch />
          {session?.user ? (
            <div className="hidden sm:block">
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    className="min-w-0 p-2 h-auto gap-2 border border-divider bg-content1 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                    variant="light"
                  >
                    <Badge
                      color={
                        userRole === "ADMIN"
                          ? "danger"
                          : userRole === "ADVOGADO"
                            ? "primary"
                            : "default"
                      }
                      content={userRole?.replace(/_/g, " ").charAt(0) || "U"}
                      placement="bottom-right"
                      shape="circle"
                      size="sm"
                    >
                      <Avatar
                        isBordered
                        className="w-8 h-8 text-xs"
                        name={userDisplayName}
                        size="sm"
                        src={userAvatar}
                      />
                    </Badge>
                    <div className="hidden md:block min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-default-500 truncate">
                        {userRole?.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Menu do usuário"
                  className="min-w-[220px]"
                  onAction={(key) => handleUserAction(String(key))}
                >
                  <DropdownItem
                    key="profile"
                    description={
                      isSuperAdmin
                        ? "Configurações do sistema"
                        : "Gerenciar informações pessoais"
                    }
                  >
                    {isSuperAdmin ? "Configurações" : "Meu perfil"}
                  </DropdownItem>
                  {!isSuperAdmin && canManageTenantSettings ? (
                    <DropdownItem
                      key="tenant-settings"
                      description="Branding, domínios e integrações do escritório"
                    >
                      Configurações do escritório
                    </DropdownItem>
                  ) : null}
                  <DropdownItem
                    key="logout"
                    className="text-danger"
                    color="danger"
                    description="Encerrar sessão com segurança"
                  >
                    Sair
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          ) : (
            <div className="hidden sm:flex">
              <SignInOut />
            </div>
          )}
        </NavbarContent>
      </HeroUINavbar>

      {authenticatedNav}
    </div>
  );
};
