import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/dashboard/actions";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const u = session.user;
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">設定</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          アカウントと表示の切替です。
        </p>
      </header>

      <Card size="sm">
        <CardHeader>
          <CardTitle>アカウント</CardTitle>
          <CardDescription>Google でサインインしています。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">名前: </span>
            {u.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">メール: </span>
            {u.email ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>カラースキーム</CardTitle>
          <CardDescription>ライトとダークを切り替えます。</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>セッション</CardTitle>
          <CardDescription>この端末からサインアウトします。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
