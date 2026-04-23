import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  getInboxOpenTasksForUser,
  getNonInboxProjectsForUser,
} from "@/lib/inbox-tasks";
import { TASK_STATUSES } from "@/lib/task-constants";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addInboxTask,
  completeInboxTask,
  moveInboxTaskToProject,
  updateInboxTask,
} from "./actions";

const inputClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

const textareaClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4.5rem] w-full min-w-0 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

const selectClass = inputClass;

const INBOX_EDITABLE_STATUSES = TASK_STATUSES.filter((s) => s !== "done");

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const [{ projectId, rows }, moveTargets] = await Promise.all([
    getInboxOpenTasksForUser(userId),
    getNonInboxProjectsForUser(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          受信箱（未整理）のタスク。会議中の即メモはここに置きます。
        </p>
      </header>

      {!projectId ? (
        <p className="text-muted-foreground text-sm">
          Inbox プロジェクトがまだありません。再ログインで作成されるはずです。
        </p>
      ) : (
        <>
          <form action={addInboxTask} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="inbox-title" className="sr-only">
                タスク
              </label>
              <input
                id="inbox-title"
                name="title"
                type="text"
                required
                placeholder="1 行でタスクを追加"
                className={inputClass}
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
                  className="px-3 py-2.5 text-sm"
                  data-task-title={t.title}
                >
                  <details>
                    <summary className="cursor-pointer list-inside list-disc font-medium marker:text-muted-foreground">
                      {t.title}
                    </summary>
                    <div className="border-border mt-3 space-y-4 border-t pt-3">
                      <form
                        action={updateInboxTask.bind(null, t.id)}
                        className="space-y-2"
                      >
                        <div>
                          <label
                            htmlFor={`title-${t.id}`}
                            className="text-muted-foreground mb-1 block text-xs"
                          >
                            タイトル
                          </label>
                          <input
                            id={`title-${t.id}`}
                            name="title"
                            type="text"
                            required
                            defaultValue={t.title}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`note-${t.id}`}
                            className="text-muted-foreground mb-1 block text-xs"
                          >
                            メモ
                          </label>
                          <textarea
                            id={`note-${t.id}`}
                            name="note"
                            rows={3}
                            defaultValue={t.note ?? ""}
                            className={textareaClass}
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="min-w-[10rem] flex-1">
                            <label
                              htmlFor={`due-${t.id}`}
                              className="text-muted-foreground mb-1 block text-xs"
                            >
                              〆切
                            </label>
                            <input
                              id={`due-${t.id}`}
                              name="dueOn"
                              type="date"
                              defaultValue={dueForInput(t.dueOn ?? undefined)}
                              className={inputClass}
                            />
                          </div>
                          <div className="min-w-[10rem] flex-1">
                            <label
                              htmlFor={`status-${t.id}`}
                              className="text-muted-foreground mb-1 block text-xs"
                            >
                              状態
                            </label>
                            <select
                              id={`status-${t.id}`}
                              name="status"
                              required
                              defaultValue={t.status}
                              className={selectClass}
                            >
                              {INBOX_EDITABLE_STATUSES.map((s) => (
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
                            <Link href="/programs" className="text-foreground underline">
                              プログラム
                            </Link>
                            からプロジェクトを作成してください。
                          </p>
                        ) : (
                          <form
                            action={moveInboxTaskToProject.bind(null, t.id)}
                            className="flex flex-wrap items-end gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`move-${t.id}`}
                                className="sr-only"
                              >
                                移動先プロジェクト
                              </label>
                              <select
                                id={`move-${t.id}`}
                                name="targetProjectId"
                                required
                                className={selectClass}
                                data-testid="inbox-move-target"
                              >
                                <option value="">選択…</option>
                                {moveTargets.map((m) => (
                                  <option key={m.projectId} value={m.projectId}>
                                    {m.programName} / {m.projectName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button
                              type="submit"
                              size="sm"
                              data-testid="inbox-move-submit"
                            >
                              移動
                            </Button>
                          </form>
                        )}
                      </div>

                      <form action={completeInboxTask.bind(null, t.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          完了
                        </Button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
