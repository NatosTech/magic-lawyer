"use client";

import { Navbar as HeroUINavbar, NavbarContent, NavbarMenu, NavbarMenuToggle, NavbarBrand, NavbarMenuItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { User } from "@heroui/user";
import clsx from "clsx";
import NextLink from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import { siteConfig } from "@/config/site";
import { SignInOut } from "@/components/signinout";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, Logo } from "@/components/icons";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { TENANT_PERMISSIONS } from "@/types";

export const Navbar = () => {
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

  const navItems = session?.user ? siteConfig.navItemsAuthenticated : siteConfig.navItemsPublic;
  const menuItems = session?.user ? siteConfig.navMenuItemsAuthenticated : siteConfig.navMenuItemsPublic;
  const filteredMenuItems = menuItems.filter((item: any) => hasPermission(item.requiresPermission));
  const primaryCta = session?.user ? { label: "Abrir chamado", href: "/help" } : { label: "Falar com vendas", href: "/about" };
  const canManageTenantSettings = hasPermission(TENANT_PERMISSIONS.manageOfficeSettings);

  const renderNavLink = (label: string, href: string) => {
    const isActive = pathname === href;

    return (
      <NextLink
        key={label}
        className={clsx(
          linkStyles({ color: "foreground" }),
          "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
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

  return (
    <HeroUINavbar
      className="top-4 z-50 mx-auto rounded-3xl border border-white/10 bg-background/70 px-3 py-2 backdrop-blur-2xl shadow-[0_15px_45px_-25px_rgba(59,130,246,0.8)]"
      isBordered={false}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="max-w-fit" justify="start">
        <NavbarBrand className="max-w-fit">
          <NextLink className="flex items-center gap-3" href="/">
            {tenantLogoUrl ? (
              <span className="flex h-12 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2">
                <Image priority unoptimized alt={`Logo ${tenantName}`} className="max-h-full w-full object-contain" height={48} src={tenantLogoUrl} width={96} />
              </span>
            ) : (
              <span className="rounded-2xl bg-primary/15 p-2 text-primary">
                <Logo animated className="h-7 w-7" />
              </span>
            )}
            <span className="flex flex-col leading-tight">
              <span className={brandTitleClasses}>{tenantName}</span>
              <span className="text-xs text-default-400">{brandSubtitle}</span>
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden items-center gap-2 lg:flex" justify="center">
        {navItems.map((item) => renderNavLink(item.label, item.href))}
      </NavbarContent>

      <NavbarContent className="hidden items-center gap-3 sm:flex" justify="end">
        <Chip className="hidden text-xs uppercase tracking-wide text-primary-200 xl:flex" color="primary" variant="flat">
          Novas automações 2025.3
        </Chip>
        {session?.user ? <NotificationCenter /> : null}
        <ThemeSwitch />
        <Button as={NextLink} className="border-white/20 text-sm text-white hover:border-primary/60 hover:text-primary" href={primaryCta.href} radius="full" variant="bordered">
          {primaryCta.label}
        </Button>
        {session?.user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <User
                as="button"
                avatarProps={{
                  src: userAvatar,
                  name: userDisplayName,
                }}
                className="cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left shadow-lg shadow-black/5 transition hover:border-primary/40 hover:bg-primary/10"
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
        <NavbarMenuToggle aria-label="Abrir menu" className="lg:hidden" />
      </NavbarContent>

      <NavbarContent className="flex items-center gap-2 sm:hidden" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle aria-label="Abrir menu" />
      </NavbarContent>

      <NavbarMenu className="backdrop-blur-xl">
        <div className="mx-2 mt-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink className="text-base font-medium text-default-500" href={item.href}>
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
        </div>
        <div className="mx-2 mt-6 flex flex-col gap-3 border-t border-white/10 pt-4">
          {filteredMenuItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink className="text-sm text-default-500" href={item.href}>
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem className="pt-2">
            <SignInOut />
          </NavbarMenuItem>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 py-3">
            <div className="flex flex-col text-xs text-default-400">
              <span>Precisa ver uma demonstração?</span>
              <span className="font-semibold text-white">Fale com nossa equipe</span>
            </div>
            <Button as={NextLink} color="primary" href="/about" radius="full" size="sm">
              Agendar demo
            </Button>
          </div>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
