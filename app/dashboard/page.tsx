import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { signOutAction } from "./actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            ログアウト
          </Button>
        </form>
      </header>
      <p className="text-muted-foreground text-sm">
        ようこそ、{session.user.name ?? session.user.email} さん。
        GTD ウィジェットは今後の実装で追加します。
      </p>
    </div>
  );
}
