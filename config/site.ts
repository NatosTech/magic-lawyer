export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Magic Lawyer",
  description:
    "Sistema para advogados - Controle seu escritório com facilidade.",
  navItems: [
    {
      label: "Início",
      href: "/",
    },
    {
      label: "Recursos",
      href: "/docs",
    },
    {
      label: "Planos",
      href: "/precos",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "Contato",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Entrar",
      href: "/login",
    },
    {
      label: "Portal do Cliente",
      href: "/login?view=cliente",
    },
    {
      label: "Suporte",
      href: "/help",
    },
    {
      label: "Termos & Políticas",
      href: "/docs",
    },
    {
      label: "Sair",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/nonattodev",
    twitter: "https://github.com/nonattodev",
    discord: "https://github.com/nonattodev",
    sponsor: "https://github.com/nonattodev",
  },
};
