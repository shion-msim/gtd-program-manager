import { auth } from "@/auth";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <Link href="/" className="text-foreground font-medium">
          GTD マネージャー
        </Link>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              ダッシュボード
            </Link>
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
