import { Metadata } from "next";

import { ProfileContent } from "./profile-content";

import { title, subtitle } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Editar perfil",
  description: "Personalize seus dados, preferências e informações de contato.",
};

export default function EditUserProfilePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Área do usuário
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Gerencie seu perfil
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Atualize seus dados pessoais, altere sua senha e gerencie suas
          preferências de conta.
        </p>
      </header>

      <ProfileContent />
    </section>
  );
}
