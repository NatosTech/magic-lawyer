import { redirect } from "next/navigation";

import { getSession } from "@/app/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SessionGuard } from "./session-guard";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
