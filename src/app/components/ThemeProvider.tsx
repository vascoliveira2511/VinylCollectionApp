"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="vinyl-theme"
    >
      {children}
    </NextThemeProvider>
  );
}