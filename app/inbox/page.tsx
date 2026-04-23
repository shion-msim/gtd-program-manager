import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getInboxOpenTasksForUser,
  getNonInboxProjectsForUser,
} from "@/lib/inbox-tasks";
import { taskStatusLabel } from "@/lib/task-constants";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addInboxTask, completeInboxTask, moveInboxTaskToProject } from "./actions";
import { NativeSelect } from "@/components/ui/native-select";

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">受信箱（Inbox）</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          未整理のタスク。会議中の即メモはここに置きます。編集は各行の「編集」から開きます。
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
                      {taskStatusLabel(t.status)}
                      {t.dueOn ? ` · 〆 ${t.dueOn}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/inbox/tasks/${t.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                      )}
                    >
                      編集
                    </Link>
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
