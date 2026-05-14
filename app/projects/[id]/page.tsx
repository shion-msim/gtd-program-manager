import { auth } from "@/auth";
import { ProjectTaskEditDialog } from "@/components/project-task-edit-dialog";
import { TaskStatusInlineForm } from "@/components/task-status-inline-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { getOtherProjectsForMove } from "@/lib/project-move-targets";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/task-constants";
import { and, desc, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addProjectTask,
  moveProjectTask,
  updateProjectTaskStatus,
} from "./actions";
import { NativeSelect } from "@/components/ui/native-select";
import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { getPriorityColorsForUser } from "@/lib/user-priority-colors";
import {
  priorityStripeColor,
  resolveTaskEntityAccent,
} from "@/lib/task-row-accent";

const PROJECT_TASK_STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

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
    redirect("/inbox/table");
  }

  const [openRows, doneRows, moveTargets, priorityColors] = await Promise.all([
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
    getPriorityColorsForUser(userId),
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
          一覧では状態だけ変更できます。タイトルやメモは「編集」から。移動もここから行えます。
        </p>
        {ctx.project.isArchived ? (
          <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
            このプロジェクトはアーカイブ中です。サイドバーには表示されず、ここからタスクの整理・移動は引き続きできます。新規タスクの追加はプログラム画面でアーカイブを解除してください。
          </p>
        ) : null}
      </header>

      {!ctx.project.isArchived ? (
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
          既定の状態は「次の行動」です。追加後、一覧の状態または「編集」で更新できます。
        </p>
      </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">未完了</h2>
        {openRows.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="project-tasks-empty">
            未完了のタスクはまだありません。
          </p>
        ) : (
          <ul
            className="divide-border border-border divide-y overflow-hidden rounded-lg border"
            data-testid="project-tasks-open"
          >
            {openRows.map((t) => {
              const entityColor = resolveTaskEntityAccent(
                ctx.project.accentColor,
                ctx.program.accentColor,
              );
              const priorityColor = priorityStripeColor(t.priority, priorityColors);
              return (
              <li key={t.id} id={`task-${t.id}`} className="min-w-0" data-task-title={t.title}>
                <ListRowEdgeAccent
                  as="div"
                  entityColor={entityColor}
                  priorityColor={priorityColor}
                  className="text-sm"
                >
                <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {t.dueOn ? `〆 ${t.dueOn}` : "〆切なし"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusInlineForm
                    key={`${t.id}-${t.status}`}
                    action={updateProjectTaskStatus.bind(null, t.id, projectId)}
                    defaultStatus={t.status}
                    options={PROJECT_TASK_STATUS_OPTIONS}
                    selectId={`pt-status-${t.id}`}
                  />
                  <ProjectTaskEditDialog
                    projectId={projectId}
                    task={{
                      id: t.id,
                      title: t.title,
                      note: t.note,
                      dueOn: t.dueOn,
                      status: t.status,
                      priority: t.priority,
                    }}
                  />
                  {moveTargets.length > 0 ? (
                    <form
                      action={moveProjectTask.bind(null, t.id, projectId)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <div className="token-move-target-min flex-1">
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
                </div>
                </ListRowEdgeAccent>
              </li>
            );
            })}
          </ul>
        )}
      </section>

      {doneRows.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">完了（直近）</h2>
          <ul className="divide-border border-border divide-y overflow-hidden rounded-lg border text-sm">
            {doneRows.map((t) => {
              const entityColor = resolveTaskEntityAccent(
                ctx.project.accentColor,
                ctx.program.accentColor,
              );
              const priorityColor = priorityStripeColor(t.priority, priorityColors);
              return (
              <li key={t.id} id={`task-${t.id}`} className="min-w-0">
                <ListRowEdgeAccent
                  as="div"
                  entityColor={entityColor}
                  priorityColor={priorityColor}
                >
                <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-muted-foreground line-through">{t.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.dueOn ? `〆 ${t.dueOn}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusInlineForm
                      key={`${t.id}-${t.status}`}
                      action={updateProjectTaskStatus.bind(null, t.id, projectId)}
                      defaultStatus={t.status}
                      options={PROJECT_TASK_STATUS_OPTIONS}
                      selectId={`pt-status-done-${t.id}`}
                    />
                    <ProjectTaskEditDialog
                      projectId={projectId}
                      task={{
                        id: t.id,
                        title: t.title,
                        note: t.note,
                        dueOn: t.dueOn,
                        status: t.status,
                        priority: t.priority,
                      }}
                      triggerLabel="詳細"
                      triggerVariant="outline"
                    />
                  </div>
                </div>
                </ListRowEdgeAccent>
              </li>
            );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
