import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfiguracoesTabs } from "./configuracoes-tabs";

import { title, subtitle } from "@/components/primitives";
import { getSession } from "@/app/lib/auth";
import { TENANT_PERMISSIONS } from "@/types";
import { getTenantConfigData } from "@/app/actions/tenant-config";

export const metadata: Metadata = {
  title: "Configurações do escritório",
  description: "Personalize branding, integrações e preferências avançadas.",
};

export default async function ConfiguracoesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role as string | undefined;
  const permissions = ((session.user as any)?.permissions ?? []) as string[];
  const allowed =
    role === "SUPER_ADMIN" ||
    permissions.includes(TENANT_PERMISSIONS.manageOfficeSettings);

  if (!allowed) {
    redirect("/dashboard");
  }

  // Buscar dados do tenant
  const tenantData = await getTenantConfigData();

  if (!tenantData.success || !tenantData.data) {
    redirect("/dashboard");
  }

  const { tenant, branding, subscription, modules, metrics, digitalCertificates } =
    tenantData.data;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Configurações
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Central de configurações do escritório
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Gerencie informações do seu plano, módulos disponíveis e dados do
          escritório.
        </p>
      </header>

      <ConfiguracoesTabs
        branding={branding}
        metrics={metrics}
        modules={modules}
        subscription={subscription}
        tenant={tenant}
        certificates={digitalCertificates}
        certificatePolicy={tenant.digitalCertificatePolicy}
      />
    </section>
  );
}
