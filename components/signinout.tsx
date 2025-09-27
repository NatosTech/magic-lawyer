import Link from "next/link";
import { Button } from "@heroui/button";
import { getSession } from "@/app/lib/auth";

export async function SignInOut() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <Button as={Link} href="/login" color="primary" variant="flat">
        Entrar
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{session.user.name || session.user.email}</span>
      <form action="/api/auth/signout" method="post">
        <Button type="submit" variant="ghost" size="sm">
          Sair
        </Button>
      </form>
    </div>
  );
}
