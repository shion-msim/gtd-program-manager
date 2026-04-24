import { InboxTaskEditDialog } from "@/components/inbox-task-edit-dialog";
import { TaskStatusInlineForm } from "@/components/task-status-inline-form";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { InboxReturnPath } from "@/lib/inbox-return-path";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";
import type { InferSelectModel } from "drizzle-orm";
import type { tasks } from "@/db/schema";
import {
  completeInboxTask,
  moveInboxTaskToProject,
  updateInboxTaskStatus,
} from "@/app/inbox/actions";

const INBOX_STATUS_OPTIONS = INBOX_EDITABLE_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

type TaskRow = InferSelectModel<typeof tasks>;

type MoveTarget = {
  projectId: string;
  programName: string;
  projectName: string;
};

export function InboxTasksTable({
  rows,
  moveTargets,
  returnPath,
}: {
  rows: TaskRow[];
  moveTargets: MoveTarget[];
  returnPath: InboxReturnPath;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="inbox-empty">
        未整理のタスクはまだありません。受信箱の入力欄から追加できます。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" data-testid="inbox-list">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-muted/80 border-b text-xs font-medium tracking-wide text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 font-medium">
              タイトル
            </th>
            <th scope="col" className="w-[7.5rem] px-3 py-2.5 font-medium">
              〆切
            </th>
            <th scope="col" className="w-[10.5rem] px-3 py-2.5 font-medium">
              状態
            </th>
            <th scope="col" className="min-w-[14rem] px-3 py-2.5 font-medium">
              移動先
            </th>
            <th scope="col" className="w-[11rem] px-3 py-2.5 text-right font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((t) => (
            <tr key={t.id} className="align-middle" data-task-title={t.title}>
              <td className="max-w-[20rem] px-3 py-2">
                <p className="font-medium leading-snug">{t.title}</p>
              </td>
              <td className="text-muted-foreground whitespace-nowrap px-3 py-2 text-xs">
                {t.dueOn ? t.dueOn : "—"}
              </td>
              <td className="px-3 py-2">
                <TaskStatusInlineForm
                  action={updateInboxTaskStatus.bind(null, t.id)}
                  defaultStatus={t.status}
                  options={INBOX_STATUS_OPTIONS}
                  selectId={`inbox-status-${t.id}`}
                />
              </td>
              <td className="px-3 py-2">
                {moveTargets.length > 0 ? (
                  <form
                    action={moveInboxTaskToProject.bind(null, t.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <NativeSelect
                      id={`move-${t.id}`}
                      name="targetProjectId"
                      required
                      data-testid="inbox-move-target"
                      defaultValue=""
                      className="min-w-[12rem] flex-1 text-sm"
                    >
                      <option value="">選択…</option>
                      {moveTargets.map((m) => (
                        <option key={m.projectId} value={m.projectId}>
                          {m.programName} / {m.projectName}
                        </option>
                      ))}
                    </NativeSelect>
                    <Button
                      type="submit"
                      size="sm"
                      data-testid="inbox-move-submit"
                    >
                      移動
                    </Button>
                  </form>
                ) : (
                  <span className="text-muted-foreground text-xs">移動先なし</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <InboxTaskEditDialog
                    task={{
                      id: t.id,
                      title: t.title,
                      note: t.note,
                      dueOn: t.dueOn,
                      status: t.status,
                    }}
                  />
                  <form action={completeInboxTask.bind(null, t.id)}>
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <Button type="submit" size="sm" variant="outline">
                      完了
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
