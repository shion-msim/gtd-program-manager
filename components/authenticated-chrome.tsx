"use client";

import * as React from "react";
import { MenuIcon, PanelLeftCloseIcon, PanelRightOpenIcon } from "lucide-react";

import { BrandLogoLink } from "@/components/brand-logo-link";
import type { SidebarNavData } from "@/lib/sidebar-nav-data";
import { AppSidebarBody } from "@/components/app-sidebar-body";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CaptureNowFabHost } from "@/components/capture-now-fab";

const STORAGE_KEY = "kernie-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function AuthenticatedChrome({
  initialData,
  children,
}: {
  initialData: SidebarNavData;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    React.startTransition(() => {
      setCollapsed(readCollapsed());
      setHydrated(true);
    });
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-3 py-3 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="サイドメニューを開く"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="size-4" />
          </Button>
          <BrandLogoLink href="/dashboard" className="min-w-0 shrink-0" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "bg-muted/20 border-border hidden shrink-0 flex-col border-r md:flex",
            hydrated && collapsed ? "w-13" : "w-60",
          )}
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <AppSidebarBody
              data={initialData}
              collapsed={hydrated && collapsed}
            />
          </div>
          <div className="border-border mt-auto border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("w-full", hydrated && collapsed && "px-0")}
              onClick={toggleCollapsed}
              aria-pressed={hydrated && collapsed}
              aria-label={
                hydrated && collapsed
                  ? "サイドバーを展開"
                  : "サイドバーを最小化"
              }
            >
              {hydrated && collapsed ? (
                <PanelRightOpenIcon className="size-4" />
              ) : (
                <>
                  <PanelLeftCloseIcon className="size-4" />
                  <span className="ml-1 truncate">最小化</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-full max-w-72 p-0 sm:max-w-72"
            showCloseButton
          >
            <SheetHeader className="sr-only">
              <SheetTitle>ナビゲーション</SheetTitle>
            </SheetHeader>
            <AppSidebarBody
              data={initialData}
              collapsed={false}
              onNavigate={closeMobile}
              className="pt-2"
            />
          </SheetContent>
        </Sheet>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <React.Suspense fallback={null}>
        <CaptureNowFabHost />
      </React.Suspense>
    </div>
  );
}
