import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { ensureInboxForUser } from "@/lib/inbox";
import { getOpenTasksListRowsForUser } from "@/lib/cross-project-views";
import { taskStatusLabel } from "@/lib/task-constants";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function TasksIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  await ensureInboxForUser(userId);
  const rows = await getOpenTasksListRowsForUser(userId);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">タスク一覧</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          未完了タスクを横断表示します。編集は各タスクの画面へ進んでください。
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">未完了のタスクはありません。</p>
      ) : (
        <ul
          className="divide-border divide-y rounded-lg border text-sm"
          data-testid="tasks-index-list"
        >
          {rows.map((row) => {
            const editHref = row.isInbox
              ? `/inbox/tasks/${row.taskId}/edit`
              : `/projects/${row.projectId}/tasks/${row.taskId}/edit`;
            return (
              <li
                key={row.taskId}
                className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.programName} / {row.projectName}
                    {" · "}
                    {taskStatusLabel(row.status)}
                    {row.dueOn ? ` · 〆 ${row.dueOn}` : ""}
                  </p>
                </div>
                <Link
                  href={editHref}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
                >
                  編集
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
