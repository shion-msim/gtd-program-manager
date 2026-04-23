import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { getDefaultTimeZone, getSummaryForUser } from "@/lib/dashboard-data";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "./actions";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const tz = getDefaultTimeZone();
  const s = await getSummaryForUser(session.user.id, tz);

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            ログアウト
          </Button>
        </form>
      </header>
      <p className="text-muted-foreground text-sm" data-testid="dashboard-greeting">
        ようこそ、{session.user.name ?? session.user.email} さん。今日は{" "}
        <span className="text-foreground tabular-nums">{s.todayYmd}</span>（
        {tz}）です。
      </p>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Inbox</h2>
        {s.inboxCount > 0 ? (
          <p>
            未整理が{" "}
            <span className="text-destructive font-medium tabular-nums">
              {s.inboxCount}
            </span>{" "}
            件あります。
          </p>
        ) : (
          <p className="text-muted-foreground">受信箱は空です。</p>
        )}
        <Link
          href="/inbox"
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
        >
          Inbox へ
        </Link>
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">今日〆切</h2>
        {s.dueToday.length === 0 ? (
          <p className="text-muted-foreground">今日〆切の未完了はありません。</p>
        ) : (
          <ul className="list-inside list-disc text-sm">
            {s.dueToday.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/projects/${t.projectId}#task-${t.id}`}
                  className="underline underline-offset-4"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">次の行動</h2>
        {s.nextActions.length === 0 ? (
          <p className="text-muted-foreground">次の行動（next）はまだありません。</p>
        ) : (
          <ul className="list-inside list-disc text-sm">
            {s.nextActions.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/projects/${t.projectId}#task-${t.id}`}
                  className="underline underline-offset-4"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">7 日以内〆切</h2>
        <p>
          件数:{" "}
          <span className="tabular-nums" data-testid="due-7d-count">
            {s.dueNext7DaysCount}
          </span>
        </p>
        <Link
          href="/workload"
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
        >
          週次の負荷を見る
        </Link>
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">アクティブなプログラム</h2>
        {s.activePrograms.length === 0 ? (
          <p className="text-muted-foreground">期間中のプログラムはまだありません。</p>
        ) : (
          <ul className="list-inside list-disc text-sm">
            {s.activePrograms.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
        <Link
          href="/programs"
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
        >
          プログラム一覧
        </Link>
      </section>
    </div>
  );
}
