import { auth } from "@/auth";
import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { TaskProgramProjectTags } from "@/components/task-program-project-tags";
import { buttonVariants } from "@/components/ui/button";
import { getDefaultTimeZone, getSummaryForUser } from "@/lib/dashboard-data";
import { normalizeHexColor } from "@/lib/hex-color";
import {
  getPriorityColorsForUser,
  priorityStripeColor,
} from "@/lib/user-priority-colors";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const tz = getDefaultTimeZone();
  const [s, priorityColors] = await Promise.all([
    getSummaryForUser(session.user.id, tz),
    getPriorityColorsForUser(session.user.id),
  ]);

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <Link
          href="/settings"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          設定
        </Link>
      </header>
      <p className="text-muted-foreground text-sm" data-testid="dashboard-greeting">
        ようこそ、{session.user.name ?? session.user.email} さん。今日は{" "}
        <span className="text-foreground tabular-nums">{s.todayYmd}</span>（
        {tz}）です。
      </p>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">受信箱（Inbox）</h2>
        {s.inboxCount > 0 ? (
          <>
            <p>
              未整理が{" "}
              <span className="text-destructive font-medium tabular-nums">
                {s.inboxCount}
              </span>{" "}
              件あります。
            </p>
            <ul className="space-y-2 text-sm">
              {s.inboxTasks.map((t) => (
                <li key={t.id} className="min-w-0">
                  <div className="py-0.5">
                    <div className="flex w-full min-w-0 items-baseline justify-between gap-3">
                      <Link
                        href={`/projects/${t.projectId}#task-${t.id}`}
                        className="min-w-0 flex-1 truncate underline underline-offset-4"
                      >
                        {t.title}
                      </Link>
                      <TaskProgramProjectTags
                        programName={t.programName}
                        projectName={t.projectName}
                        programId={t.programId}
                        projectId={t.projectId}
                        programAccent={t.programAccent}
                        projectAccent={t.projectAccent}
                        priority={t.priority}
                        priorityColor={priorityStripeColor(
                          t.priority,
                          priorityColors,
                        )}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {s.inboxTasks.length < s.inboxCount ? (
              <p className="text-muted-foreground text-xs">
                ほか {s.inboxCount - s.inboxTasks.length}{" "}
                件は整理ビューで確認できます。
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">受信箱は空です。</p>
        )}
        <Link
          href="/inbox/table"
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
        >
          整理する
        </Link>
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">今日〆切</h2>
        {s.dueToday.length === 0 ? (
          <p className="text-muted-foreground">今日〆切の未完了はありません。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {s.dueToday.map((t) => (
              <li key={t.id} className="min-w-0">
                <div className="py-0.5">
                  <div className="flex w-full min-w-0 items-baseline justify-between gap-3">
                    <Link
                      href={`/projects/${t.projectId}#task-${t.id}`}
                      className="min-w-0 flex-1 truncate underline underline-offset-4"
                    >
                      {t.title}
                    </Link>
                    <TaskProgramProjectTags
                      programName={t.programName}
                      projectName={t.projectName}
                      programId={t.programId}
                      projectId={t.projectId}
                      programAccent={t.programAccent}
                      projectAccent={t.projectAccent}
                      priority={t.priority}
                      priorityColor={priorityStripeColor(
                        t.priority,
                        priorityColors,
                      )}
                      className="shrink-0"
                    />
                  </div>
                </div>
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
          <ul className="space-y-2 text-sm">
            {s.nextActions.map((t) => (
              <li key={t.id} className="min-w-0">
                <div className="py-0.5">
                  <div className="flex w-full min-w-0 items-baseline justify-between gap-3">
                    <Link
                      href={`/projects/${t.projectId}#task-${t.id}`}
                      className="min-w-0 flex-1 truncate underline underline-offset-4"
                    >
                      {t.title}
                    </Link>
                    <TaskProgramProjectTags
                      programName={t.programName}
                      projectName={t.projectName}
                      programId={t.programId}
                      projectId={t.projectId}
                      programAccent={t.programAccent}
                      projectAccent={t.projectAccent}
                      priority={t.priority}
                      priorityColor={priorityStripeColor(
                        t.priority,
                        priorityColors,
                      )}
                      className="shrink-0"
                    />
                  </div>
                </div>
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
          <ul className="space-y-2 text-sm">
            {s.activePrograms.map((p) => (
              <li key={p.id} className="min-w-0">
                <ListRowEdgeAccent
                  as="div"
                  entityColor={
                    p.accentColor ? normalizeHexColor(p.accentColor) : null
                  }
                  priorityColor={null}
                >
                  <div className="py-0.5">
                    <Link
                      href={`/programs/${p.id}`}
                      className="underline underline-offset-4"
                    >
                      {p.name}
                    </Link>
                  </div>
                </ListRowEdgeAccent>
              </li>
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
