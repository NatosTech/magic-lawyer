import { Metadata } from "next";

import { NotificationPreferencesContent } from "./notification-preferences-content";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Preferências de Notificações",
  description: "Configure suas preferências de notificações por tipo de evento",
};

export default function NotificationPreferencesPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Configurações
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Preferências de Notificações
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Configure como e quando você deseja receber notificações do sistema.
          Escolha os canais (in-app, email) e tipos de eventos que são
          importantes para você.
        </p>
      </header>

      <NotificationPreferencesContent />
    </section>
  );
}
