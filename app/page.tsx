"use client";
import { Button } from "@heroui/button";
import { addToast, type ToastProps } from "@heroui/toast";
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const showToast = () =>
    addToast({
      title: "Sucesso",
      description: "Toast configurado e funcionando.",
      color: "primary",
      variant: "solid",
      timeout: 5000,
      shouldShowTimeoutProgress: true,
    });

  const goToPrecos = async () => {
    router.push("/precos");
  };
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Advoque com&nbsp;</span>
        <span className={title({ color: "violet" })}>Magia&nbsp;</span>
        <br />
        <span className={title()}>Magic Lawyer</span>
        <div className={subtitle({ class: "mt-4" })}>Traga conforto e segurança para o seu escritório.</div>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          onPress={goToPrecos}
        >
          Preços
        </Link>
        <Link isExternal className={buttonStyles({ variant: "bordered", radius: "full" })} href={siteConfig.links.github}>
          <GithubIcon size={20} />
          Natos Tech
        </Link>
      </div>

      <div className="mt-4">
        <Button onPress={showToast}>Testar Toast</Button>
      </div>
    </section>
  );
}
