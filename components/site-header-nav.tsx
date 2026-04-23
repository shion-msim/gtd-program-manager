"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; testId?: string }[] = [
  { href: "/inbox", label: "受信箱", testId: "nav-inbox" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/workload", label: "負荷", testId: "nav-workload" },
  { href: "/programs", label: "プログラム" },
  { href: "/settings", label: "設定", testId: "nav-settings" },
];

function isNavActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(href: string, pathname: string) {
  const active = isNavActive(href, pathname);
  return cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    active && "bg-muted text-foreground",
  );
}

export function SiteHeaderNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  if (!loggedIn) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <nav
        className="hidden items-center gap-1 sm:flex"
        aria-label="メイン"
      >
        {NAV.map(({ href, label, testId }) => (
          <Link
            key={href}
            href={href}
            className={navLinkClass(href, pathname)}
            aria-current={isNavActive(href, pathname) ? "page" : undefined}
            {...(testId ? { "data-testid": testId } : {})}
          >
            {label}
          </Link>
        ))}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "sm:hidden",
          )}
          aria-label="メニューを開く"
        >
          <MenuIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {NAV.map(({ href, label, testId }) => (
            <DropdownMenuItem
              key={href}
              {...(testId ? { "data-testid": testId } : {})}
              onClick={() => router.push(href)}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
