"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";
import { SessionProvider } from "next-auth/react";

import { RealtimeProvider } from "./providers/realtime-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <SessionProvider>
        <RealtimeProvider>
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
          <ToastProvider placement="top-right" />
        </RealtimeProvider>
      </SessionProvider>
    </HeroUIProvider>
  );
}
