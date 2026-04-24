import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-8 p-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Kernie</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Kernie
          は、期間付きのプログラム（桶）の下にプロジェクトを束ね、タスクを GTD 的に扱う
          個人向けツールです。要件の一次ソースは{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            docs/REQUIREMENTS.md
          </code>{" "}
          を参照してください。
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Google でログイン
        </Link>
      </div>
    </main>
  );
}
