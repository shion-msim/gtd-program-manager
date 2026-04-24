import { auth } from "@/auth";
import { InboxTaskEditDialog } from "@/components/inbox-task-edit-dialog";
import { TaskStatusInlineForm } from "@/components/task-status-inline-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ensureInboxForUser } from "@/lib/inbox";
import {
  getInboxOpenTasksForUser,
  getNonInboxProjectsForUser,
} from "@/lib/inbox-tasks";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";
import { redirect } from "next/navigation";
import {
  addInboxTask,
  completeInboxTask,
  moveInboxTaskToProject,
  updateInboxTaskStatus,
} from "./actions";
import { NativeSelect } from "@/components/ui/native-select";

const INBOX_STATUS_OPTIONS = INBOX_EDITABLE_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  await ensureInboxForUser(userId);
  const [{ projectId, rows }, moveTargets] = await Promise.all([
    getInboxOpenTasksForUser(userId),
    getNonInboxProjectsForUser(userId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">受信箱（Inbox）</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          未整理のタスク。一覧では状態だけ変えられます。タイトルやメモは「編集」から開きます。
        </p>
      </header>

      {!projectId ? (
        <p className="text-muted-foreground text-sm">
          Inbox プロジェクトを用意できませんでした。データベース接続を確認するか、しばらくしてから再度お試しください。
        </p>
      ) : (
        <>
          <form action={addInboxTask} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="inbox-title" className="sr-only">
                タスク
              </label>
              <Input
                id="inbox-title"
                name="title"
                type="text"
                required
                placeholder="1 行でタスクを追加"
              />
            </div>
            <Button type="submit" size="sm">
              追加
            </Button>
          </form>

          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="inbox-empty">
              未整理のタスクはまだありません。上の欄にメモを追加できます。
            </p>
          ) : (
            <ul className="divide-border border-border divide-y rounded-lg border" data-testid="inbox-list">
              {rows.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  data-task-title={t.title}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.dueOn ? `〆 ${t.dueOn}` : "〆切なし"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusInlineForm
                      action={updateInboxTaskStatus.bind(null, t.id)}
                      defaultStatus={t.status}
                      options={INBOX_STATUS_OPTIONS}
                      selectId={`inbox-status-${t.id}`}
                    />
                    <InboxTaskEditDialog
                      task={{
                        id: t.id,
                        title: t.title,
                        note: t.note,
                        dueOn: t.dueOn,
                        status: t.status,
                      }}
                    />
                    {moveTargets.length > 0 ? (
                      <form
                        action={moveInboxTaskToProject.bind(null, t.id)}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <div className="min-w-[12rem] flex-1">
                          <label htmlFor={`move-${t.id}`} className="sr-only">
                            移動先プロジェクト
                          </label>
                          <NativeSelect
                            id={`move-${t.id}`}
                            name="targetProjectId"
                            required
                            data-testid="inbox-move-target"
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
                        <Button
                          type="submit"
                          size="sm"
                          data-testid="inbox-move-submit"
                        >
                          移動
                        </Button>
                      </form>
                    ) : null}
                    <form action={completeInboxTask.bind(null, t.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        完了
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
