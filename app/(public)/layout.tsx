import { Link } from "@heroui/link";
import { siteConfig } from "@/config/site";
import { PublicNavbar } from "@/components/public-navbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="container mx-auto max-w-7xl flex-1 px-6 pt-16">{children}</main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link isExternal className="flex items-center gap-1 text-current" href={siteConfig.links.github} title="Conheça o desenvolvedor">
          <span className="text-default-600">Construído com amor e criatividade por</span>
          <p className="text-primary">NonatoDEV</p>
        </Link>
      </footer>
    </div>
  );
}
