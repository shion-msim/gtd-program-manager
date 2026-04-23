import { auth } from "@/auth";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-foreground font-medium">
          GTD マネージャー
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {session?.user ? (
            <>
              <Link
                href="/inbox"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Inbox
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                ダッシュボード
              </Link>
              <Link
                href="/workload"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                data-testid="nav-workload"
              >
                負荷
              </Link>
              <Link
                href="/programs"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                プログラム
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              ログイン
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
