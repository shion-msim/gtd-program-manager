import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { getOtherProjectsForMove } from "@/lib/project-move-targets";
import { TASK_STATUSES } from "@/lib/task-constants";
import { and, desc, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addProjectTask,
  deleteProjectTask,
  moveProjectTask,
  updateProjectTask,
} from "./actions";

const inputClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

const textareaClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4.5rem] w-full min-w-0 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

const selectClass = inputClass;

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

type Props = { params: Promise<{ id: string }> };

export default async function ProjectTasksPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const { id: projectId } = await params;

  const [ctx] = await db
    .select({
      project: projects,
      program: programs,
    })
    .from(projects)
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!ctx) {
    notFound();
  }

  if (ctx.project.isInbox) {
    redirect("/inbox");
  }

  const [openRows, doneRows, moveTargets] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), ne(tasks.status, "done")))
      .orderBy(desc(tasks.updatedAt)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.status, "done")))
      .orderBy(desc(tasks.updatedAt))
      .limit(40),
    getOtherProjectsForMove(userId, projectId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href="/programs" className="underline underline-offset-4">
            プログラム一覧
          </Link>
          {" · "}
          <Link
            href={`/programs/${ctx.program.id}`}
            className="underline underline-offset-4"
          >
            {ctx.program.name}
          </Link>
        </p>
        <h1 className="text-xl font-semibold">{ctx.project.name}</h1>
        <p className="text-muted-foreground text-sm">
          このプロジェクトのタスクを追加・編集し、別プロジェクトや受信箱へ移動できます。
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">タスクを追加</h2>
        <form action={addProjectTask.bind(null, projectId)} className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-task-title" className="sr-only">
              タイトル
            </label>
            <input
              id="new-task-title"
              name="title"
              type="text"
              required
              placeholder="次の行動として追加"
              className={inputClass}
            />
          </div>
          <Button type="submit" size="sm">
            追加
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          既定の状態は「次の行動（next）」です。〆切や状態は追加後に編集できます。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">未完了</h2>
        {openRows.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="project-tasks-empty">
            未完了のタスクはまだありません。
          </p>
        ) : (
          <ul
            className="divide-border border-border divide-y rounded-lg border"
            data-testid="project-tasks-open"
          >
            {openRows.map((t) => (
              <li
                key={t.id}
                id={`task-${t.id}`}
                className="px-3 py-2.5 text-sm"
                data-task-title={t.title}
              >
                <details>
                  <summary className="cursor-pointer list-inside list-disc font-medium marker:text-muted-foreground">
                    {t.title}
                    {t.dueOn ? (
                      <span className="text-muted-foreground ml-2 text-xs font-normal">
                        〆 {t.dueOn}
                      </span>
                    ) : null}
                  </summary>
                  <div className="border-border mt-3 space-y-4 border-t pt-3">
                    <form
                      action={updateProjectTask.bind(null, t.id, projectId)}
                      className="space-y-2"
                    >
                      <div>
                        <label
                          htmlFor={`pt-title-${t.id}`}
                          className="text-muted-foreground mb-1 block text-xs"
                        >
                          タイトル
                        </label>
                        <input
                          id={`pt-title-${t.id}`}
                          name="title"
                          type="text"
                          required
                          defaultValue={t.title}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`pt-note-${t.id}`}
                          className="text-muted-foreground mb-1 block text-xs"
                        >
                          メモ
                        </label>
                        <textarea
                          id={`pt-note-${t.id}`}
                          name="note"
                          rows={3}
                          defaultValue={t.note ?? ""}
                          className={textareaClass}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="min-w-[10rem] flex-1">
                          <label
                            htmlFor={`pt-due-${t.id}`}
                            className="text-muted-foreground mb-1 block text-xs"
                          >
                            〆切
                          </label>
                          <input
                            id={`pt-due-${t.id}`}
                            name="dueOn"
                            type="date"
                            defaultValue={dueForInput(t.dueOn ?? undefined)}
                            className={inputClass}
                          />
                        </div>
                        <div className="min-w-[10rem] flex-1">
                          <label
                            htmlFor={`pt-status-${t.id}`}
                            className="text-muted-foreground mb-1 block text-xs"
                          >
                            状態
                          </label>
                          <select
                            id={`pt-status-${t.id}`}
                            name="status"
                            required
                            defaultValue={t.status}
                            className={selectClass}
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">
                        変更を保存
                      </Button>
                    </form>

                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-medium">
                        別プロジェクトへ移す
                      </p>
                      {moveTargets.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          移動先がありません。
                        </p>
                      ) : (
                        <form
                          action={moveProjectTask.bind(null, t.id, projectId)}
                          className="flex flex-wrap items-end gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <label htmlFor={`pt-move-${t.id}`} className="sr-only">
                              移動先
                            </label>
                            <select
                              id={`pt-move-${t.id}`}
                              name="targetProjectId"
                              required
                              className={selectClass}
                              data-testid="project-move-target"
                            >
                              <option value="">選択…</option>
                              {moveTargets.map((m) => (
                                <option key={m.projectId} value={m.projectId}>
                                  {m.programName} / {m.projectName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button type="submit" size="sm" data-testid="project-move-submit">
                            移動
                          </Button>
                        </form>
                      )}
                    </div>

                    <form action={deleteProjectTask.bind(null, t.id, projectId)}>
                      <Button type="submit" size="sm" variant="destructive">
                        削除
                      </Button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {doneRows.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">完了（直近）</h2>
          <ul className="divide-border border-border divide-y rounded-lg border text-sm">
            {doneRows.map((t) => (
              <li key={t.id} id={`task-${t.id}`} className="px-3 py-2.5">
                <details>
                  <summary className="text-muted-foreground cursor-pointer line-through">
                    {t.title}
                  </summary>
                  <div className="border-border mt-3 space-y-3 border-t pt-3">
                    <form
                      action={updateProjectTask.bind(null, t.id, projectId)}
                      className="space-y-2"
                    >
                      <input type="hidden" name="title" value={t.title} />
                      <p className="text-muted-foreground text-xs">
                        完了から戻すには状態を変更してください。
                      </p>
                      <div>
                        <label
                          htmlFor={`pt-done-status-${t.id}`}
                          className="text-muted-foreground mb-1 block text-xs"
                        >
                          状態
                        </label>
                        <select
                          id={`pt-done-status-${t.id}`}
                          name="status"
                          required
                          defaultValue="done"
                          className={selectClass}
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">
                        状態を更新
                      </Button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
