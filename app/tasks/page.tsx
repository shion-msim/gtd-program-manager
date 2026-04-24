import { updateInboxTaskStatus } from "@/app/inbox/actions";
import { updateProjectTaskStatus } from "@/app/projects/[id]/actions";
import { auth } from "@/auth";
import { InboxTaskEditDialog } from "@/components/inbox-task-edit-dialog";
import { ProjectTaskEditDialog } from "@/components/project-task-edit-dialog";
import { TaskStatusInlineForm } from "@/components/task-status-inline-form";
import { ensureInboxForUser } from "@/lib/inbox";
import { getOpenTasksListRowsForUser } from "@/lib/cross-project-views";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";
import { redirect } from "next/navigation";

const PROJECT_TASK_STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

const INBOX_STATUS_OPTIONS = INBOX_EDITABLE_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

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
          未完了タスクを横断表示します。一覧では状態だけ変えられます。詳細は「編集」から開きます。
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">未完了のタスクはありません。</p>
      ) : (
        <ul
          className="divide-border divide-y rounded-lg border text-sm"
          data-testid="tasks-index-list"
        >
          {rows.map((row) => (
            <li
              key={row.taskId}
              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground text-xs">
                  {row.programName} / {row.projectName}
                  {row.dueOn ? ` · 〆 ${row.dueOn}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {row.isInbox ? (
                  <>
                    <TaskStatusInlineForm
                      action={updateInboxTaskStatus.bind(null, row.taskId)}
                      defaultStatus={row.status}
                      options={INBOX_STATUS_OPTIONS}
                      selectId={`tasks-idx-inbox-${row.taskId}`}
                    />
                    <InboxTaskEditDialog
                      task={{
                        id: row.taskId,
                        title: row.title,
                        note: row.note,
                        dueOn: row.dueOn,
                        status: row.status,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <TaskStatusInlineForm
                      action={updateProjectTaskStatus.bind(
                        null,
                        row.taskId,
                        row.projectId,
                      )}
                      defaultStatus={row.status}
                      options={PROJECT_TASK_STATUS_OPTIONS}
                      selectId={`tasks-idx-pt-${row.taskId}`}
                    />
                    <ProjectTaskEditDialog
                      projectId={row.projectId}
                      task={{
                        id: row.taskId,
                        title: row.title,
                        note: row.note,
                        dueOn: row.dueOn,
                        status: row.status,
                      }}
                    />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
