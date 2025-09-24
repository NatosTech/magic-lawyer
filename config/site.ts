export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Magic Lawyer",
  description: "Sistema para advogados - Controle seu escritório com facilidade.",
  navItems: [
    {
      label: "Página Inicial",
      href: "/",
    },
    {
      label: "Documentação",
      href: "/docs",
    },
    {
      label: "Nossos Preços",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "Sobre Nós",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Perfil",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projetos",
      href: "/projects",
    },
    {
      label: "Equipe",
      href: "/team",
    },
    {
      label: "Calendário",
      href: "/calendar",
    },
    {
      label: "Configurações",
      href: "/settings",
    },
    {
      label: "Ajuda & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
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
