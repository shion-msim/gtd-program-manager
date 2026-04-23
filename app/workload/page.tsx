import { auth } from "@/auth";
import { getDefaultTimeZone, getWorkloadViewForUser } from "@/lib/dashboard-data";
import { addDaysYmd, mondayOfWeekContainingYmd } from "@/lib/calendar-buckets";
import Link from "next/link";
import { redirect } from "next/navigation";

function weekLabel(weekStartYmd: string) {
  const endIncl = addDaysYmd(weekStartYmd, 6);
  const fmt = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    if (!y || m === undefined || d === undefined) {
      return ymd;
    }
    return `${m}/${d}`;
  };
  return `${fmt(weekStartYmd)} 〜 ${fmt(endIncl)}`;
}

export default async function WorkloadPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const timeZone = getDefaultTimeZone();
  const data = await getWorkloadViewForUser(session.user.id, timeZone);
  const maxCount = Math.max(
    1,
    ...data.buckets.map((b) => b.count),
  );
  const currentWeekStart = mondayOfWeekContainingYmd(data.todayYmd);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">負荷（週次・〆切）</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          〆切がある未完了タスクを、{data.timeZone} 基準の 6
          週に分けた集計です。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">6 週の件数</h2>
        {data.buckets.length === 0 ? (
          <p className="text-muted-foreground text-sm">週データがありません。</p>
        ) : (
          <ul className="space-y-4">
            {data.buckets.map((b) => (
              <li key={b.weekStart} className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{weekLabel(b.weekStart)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {b.count} 件
                  </span>
                </div>
                <div className="bg-muted h-2 w-full max-w-md overflow-hidden rounded">
                  <div
                    className="bg-primary h-full rounded transition-all"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                {b.count === 0 ? (
                  <p className="text-muted-foreground text-xs">この週の〆切はありません</p>
                ) : (
                  <details
                    open={b.weekStart === currentWeekStart}
                    className="rounded-md border border-border bg-muted/20 px-2 py-1"
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      この週のタスク一覧（{b.count} 件）
                    </summary>
                    <ul className="text-foreground/90 mt-2 list-inside list-disc text-sm">
                      {b.tasks.slice(0, 8).map((t) => (
                        <li key={t.id}>
                          {t.projectId ? (
                            <Link
                              href={`/projects/${t.projectId}#task-${t.id}`}
                              className="underline underline-offset-4"
                            >
                              {t.title}
                            </Link>
                          ) : (
                            t.title
                          )}
                          {t.dueOn ? (
                            <span className="text-muted-foreground">
                              {" "}
                              （〆 {t.dueOn}）
                            </span>
                          ) : null}
                        </li>
                      ))}
                      {b.tasks.length > 8 ? (
                        <li className="text-muted-foreground list-none text-xs">
                          ほか {b.tasks.length - 8} 件
                        </li>
                      ) : null}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium">〆切なし（未完了）</h2>
        <p className="text-muted-foreground mt-1 text-sm tabular-nums">
          負荷週に含めないタスク: {data.withoutDueCount} 件
        </p>
        {data.withoutDueCount === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            〆切なしの未完了はありません。
          </p>
        ) : null}
      </section>
    </div>
  );
}
