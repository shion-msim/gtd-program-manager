"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const isClient = useIsClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  if (!isClient) {
    return (
      <Button variant="ghost" size="icon" aria-label="テーマ" disabled>
        <span className="size-4" />
      </Button>
    );
  }
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "ライトに切替" : "ダークに切替"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
