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
import { SettingsPriorityColorsForm } from "@/components/settings-priority-colors-form";
import { getPriorityColorsForUser } from "@/lib/user-priority-colors";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const u = session.user;
  const priorityColors = await getPriorityColorsForUser(session.user.id);
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
          <CardTitle>タスク優先度の色</CardTitle>
          <CardDescription>
            タスク一覧などの左端に表示する優先度ごとの色です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsPriorityColorsForm colors={priorityColors} />
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
