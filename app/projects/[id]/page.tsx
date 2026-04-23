import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { getOtherProjectsForMove } from "@/lib/project-move-targets";
import { taskStatusLabel } from "@/lib/task-constants";
import { and, desc, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addProjectTask,
  moveProjectTask,
} from "./actions";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
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
          タスクの編集は「編集」から開きます。移動はここからも行えます。
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">タスクを追加</h2>
        <form action={addProjectTask.bind(null, projectId)} className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-task-title" className="sr-only">
              タイトル
            </label>
            <Input
              id="new-task-title"
              name="title"
              type="text"
              required
              placeholder="次の行動として追加"
            />
          </div>
          <Button type="submit" size="sm">
            追加
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          既定の状態は「次の行動」です。〆切や状態は追加後に編集できます。
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
                className="flex flex-col gap-3 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                data-task-title={t.title}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {taskStatusLabel(t.status)}
                    {t.dueOn ? ` · 〆 ${t.dueOn}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${projectId}/tasks/${t.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                    )}
                  >
                    編集
                  </Link>
                  {moveTargets.length > 0 ? (
                    <form
                      action={moveProjectTask.bind(null, t.id, projectId)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <div className="min-w-[12rem] flex-1">
                        <label htmlFor={`pt-move-${t.id}`} className="sr-only">
                          移動先
                        </label>
                        <NativeSelect
                          id={`pt-move-${t.id}`}
                          name="targetProjectId"
                          required
                          data-testid="project-move-target"
                          defaultValue=""
                        >
                          <option value="">移動先を選択…</option>
                          {moveTargets.map((m) => (
                            <option key={m.projectId} value={m.projectId}>
                              {m.programName} / {m.projectName}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <Button type="submit" size="sm" data-testid="project-move-submit">
                        移動
                      </Button>
                    </form>
                  ) : null}
                </div>
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
              <li key={t.id} id={`task-${t.id}`} className="px-3 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground line-through">{t.title}</p>
                  <Link
                    href={`/projects/${projectId}/tasks/${t.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    状態を変える
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
