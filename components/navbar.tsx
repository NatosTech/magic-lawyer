"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { SignInOut } from "@/components/signinout";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, Logo } from "@/components/icons";

export const Navbar = () => {
  const pathname = usePathname();

  const renderNavLink = (label: string, href: string) => {
    const isActive = pathname === href;

    return (
      <NextLink
        key={label}
        className={clsx(
          linkStyles({ color: "foreground" }),
          "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
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

  return (
    <HeroUINavbar
      className="top-4 z-50 mx-auto rounded-full border border-white/10 bg-background/70 px-3 py-2 backdrop-blur-2xl shadow-[0_15px_45px_-25px_rgba(59,130,246,0.8)]"
      isBordered={false}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="max-w-fit" justify="start">
        <NavbarBrand className="max-w-fit">
          <NextLink className="flex items-center gap-3" href="/">
            <span className="rounded-2xl bg-primary/15 p-2 text-primary">
              <Logo className="h-6 w-6" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Magic Lawyer
              </span>
              <span className="text-xs text-default-400">
                SaaS jurídico white label
              </span>
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden items-center gap-2 lg:flex"
        justify="center"
      >
        {siteConfig.navItems.map((item) =>
          renderNavLink(item.label, item.href),
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden items-center gap-3 sm:flex"
        justify="end"
      >
        <Chip
          className="hidden text-xs uppercase tracking-wide text-primary-200 xl:flex"
          color="primary"
          variant="flat"
        >
          Novas automações 2025.3
        </Chip>
        <ThemeSwitch />
        <Button
          as={NextLink}
          className="border-white/20 text-sm text-white hover:border-primary/60 hover:text-primary"
          href="/about"
          radius="full"
          variant="bordered"
        >
          Falar com vendas
        </Button>
        <div className="hidden sm:flex">
          <SignInOut />
        </div>
        <NavbarMenuToggle aria-label="Abrir menu" className="lg:hidden" />
      </NavbarContent>

      <NavbarContent
        className="flex items-center gap-2 sm:hidden"
        justify="end"
      >
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle aria-label="Abrir menu" />
      </NavbarContent>

      <NavbarMenu className="backdrop-blur-xl">
        <div className="mx-2 mt-4 flex flex-col gap-4">
          {siteConfig.navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink
                className="text-base font-medium text-default-500"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
        </div>
        <div className="mx-2 mt-6 flex flex-col gap-3 border-t border-white/10 pt-4">
          {siteConfig.navMenuItems.map((item) => (
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
              <span className="font-semibold text-white">
                Fale com nossa equipe
              </span>
            </div>
            <Button
              as={NextLink}
              color="primary"
              href="/about"
              radius="full"
              size="sm"
            >
              Agendar demo
            </Button>
          </div>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
