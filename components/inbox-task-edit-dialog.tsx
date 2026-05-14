"use client";

import type { ComponentProps } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateInboxTaskStay } from "@/app/inbox/actions";
import { InboxTaskDeleteConfirm } from "@/components/inbox-task-delete-confirm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/task-priority";

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export type InboxTaskEditPayload = {
  id: string;
  title: string;
  note: string | null;
  dueOn: string | null;
  status: string;
  priority: string;
};

type Props = {
  task: InboxTaskEditPayload;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
};

export function InboxTaskEditDialog({
  task,
  triggerLabel = "編集",
  triggerVariant = "secondary",
  triggerSize = "sm",
  triggerClassName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          >
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="token-dialog-content-layout">
        <DialogHeader>
          <DialogTitle>タスクを編集</DialogTitle>
          <DialogDescription>
            受信箱内のメモと〆切・状態を更新するか、削除できます。
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            const submitEvent = e.nativeEvent as SubmitEvent;
            const submitter = submitEvent.submitter;
            if (submitter instanceof HTMLElement && !e.currentTarget.contains(submitter)) {
              return;
            }
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              try {
                const r = await updateInboxTaskStay(task.id, fd);
                if (r.ok) {
                  toast.success("保存しました");
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error("保存できませんでした");
                }
              } catch {
                toast.error("保存できませんでした");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`ib-dlg-title-${task.id}`}>タイトル</Label>
            <Input
              id={`ib-dlg-title-${task.id}`}
              name="title"
              type="text"
              required
              defaultValue={task.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`ib-dlg-note-${task.id}`}>メモ</Label>
            <Textarea
              id={`ib-dlg-note-${task.id}`}
              name="note"
              rows={4}
              defaultValue={task.note ?? ""}
            />
          </div>
          <div className="token-form-row">
            <div className="token-form-field-col">
              <Label htmlFor={`ib-dlg-due-${task.id}`}>〆切</Label>
              <Input
                id={`ib-dlg-due-${task.id}`}
                name="dueOn"
                type="date"
                defaultValue={dueForInput(task.dueOn ?? undefined)}
              />
            </div>
            <div className="token-form-field-col">
              <Label htmlFor={`ib-dlg-status-${task.id}`}>状態</Label>
              <NativeSelect
                id={`ib-dlg-status-${task.id}`}
                name="status"
                required
                defaultValue={task.status}
              >
                {INBOX_EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="token-form-field-col">
              <Label htmlFor={`ib-dlg-prio-${task.id}`}>優先度</Label>
              <NativeSelect
                id={`ib-dlg-prio-${task.id}`}
                name="priority"
                required
                defaultValue={task.priority}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter className="flex-col gap-3 pt-2 sm:flex-col">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
                閉じる
              </DialogClose>
              <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                {pending ? "保存中…" : "保存"}
              </Button>
            </div>
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">危険な操作</p>
              <InboxTaskDeleteConfirm
                taskId={task.id}
                title="このタスクを削除しますか？"
                description="削除すると元に戻せません。"
                triggerLabel="削除"
                confirmLabel="削除する"
                triggerVariant="destructive"
                onDeleted={() => {
                  setOpen(false);
                  router.refresh();
                }}
              />
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
