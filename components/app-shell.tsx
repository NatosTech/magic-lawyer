"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { AppSidebar, type SidebarNavItem } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";

export type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const tenantName = session?.user?.tenantName || "Magic Lawyer";
  const tenantLogoUrl = session?.user?.tenantLogoUrl || undefined;
  const userPermissions = (session?.user as any)?.permissions as string[] | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasPermission = useCallback((permission?: string) => !permission || isSuperAdmin || userPermissions?.includes(permission), [isSuperAdmin, userPermissions]);

  const primaryNavItems = useMemo<SidebarNavItem[]>(() => {
    if (!isAuthenticated) {
      return siteConfig.navItemsPublic.map((item) => ({
        label: item.label,
        href: item.href,
      }));
    }

    return siteConfig.navItemsAuthenticated.map((item) => ({
      label: item.label,
      href: item.href,
    }));
  }, [isAuthenticated]);

  const secondaryNavItems = useMemo<SidebarNavItem[]>(() => {
    if (!isAuthenticated) {
      return [];
    }

    return siteConfig.navMenuItemsAuthenticated.filter((item) => hasPermission(item.requiresPermission)).map((item) => ({ label: item.label, href: item.href }));
  }, [hasPermission, isAuthenticated]);

  const openSidebarMobile = () => setIsMobileOpen(true);
  const closeSidebarMobile = () => setIsMobileOpen(false);
  const toggleCollapse = () => setCollapsed((current) => !current);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container mx-auto max-w-7xl flex-1 px-6 pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        collapsed={collapsed}
        isMobileOpen={isMobileOpen}
        navItems={primaryNavItems}
        secondaryItems={secondaryNavItems}
        tenantLogoUrl={tenantLogoUrl}
        tenantName={tenantName}
        onCloseMobile={closeSidebarMobile}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex flex-1 flex-col">
        <Navbar showAuthenticatedSecondaryNav={false} onOpenSidebar={openSidebarMobile} />
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
